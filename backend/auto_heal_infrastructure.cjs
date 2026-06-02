const { Client } = require('ssh2');
const pg = require('pg');

const pool = new pg.Pool({
    connectionString: 'postgresql://postgres:SimidsCRM2026!@localhost:5432/simids_crm'
});

const SSH_PASSWORD = '*DSPOSIlI2030*';

function execRemoteSSH(host, cmd) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        const timeout = setTimeout(() => { conn.end(); reject(new Error('timeout')); }, 25000);
        conn.on('ready', () => {
            conn.exec(cmd, (err, stream) => {
                if (err) { clearTimeout(timeout); return reject(err); }
                let out = '';
                stream.on('data', d => out += d);
                stream.stderr.on('data', d => out += d);
                stream.on('close', () => { clearTimeout(timeout); conn.end(); resolve(out.trim()); });
            });
        }).on('error', e => { clearTimeout(timeout); reject(e); })
        .connect({ host, port: 22, username: 'root', password: SSH_PASSWORD });
    });
}

async function main() {
    try {
        console.log("🚀 Starting Infrastructure Auto-Healing Process...");
        
        // 1. Fetch all servers from database
        const serversRes = await pool.query("SELECT id, name, ip FROM infrastructure_servers");
        console.log(`Found ${serversRes.rows.length} servers to check.`);

        for (const server of serversRes.rows) {
            console.log(`\nChecking server: ${server.name} (${server.ip})...`);
            
            let findOutput = '';
            try {
                // Find all .env files in /root/clients/
                findOutput = await execRemoteSSH(server.ip, 'find /root/clients/ -maxdepth 3 -name ".env" 2>/dev/null');
            } catch (err) {
                console.error(`❌ Failed to connect or search on ${server.name}: ${err.message}`);
                continue;
            }

            const envPaths = findOutput.split('\n').filter(p => p.trim().length > 0);
            console.log(`Found ${envPaths.length} client config files (.env) on ${server.name}`);

            for (const envPath of envPaths) {
                try {
                    // Extract client name from path (e.g. /root/clients/merkaurora/.env -> merkaurora)
                    const pathParts = envPath.split('/');
                    const clientName = pathParts[pathParts.length - 2];
                    
                    // Read DB_CNN from the .env file
                    const dbCnnLine = await execRemoteSSH(server.ip, `grep "^DB_CNN=" ${envPath} || true`);
                    if (!dbCnnLine || !dbCnnLine.includes('mongodb')) {
                        continue;
                    }
                    
                    const connectionString = dbCnnLine.replace('DB_CNN=', '').replace(/'/g, '').replace(/"/g, '').trim();
                    
                    // Parse the connection string
                    // Example: mongodb+srv://username:password@host/dbname?query
                    const match = connectionString.match(/mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@([^/]+)\/([^?]+)/);
                    if (!match) {
                        console.log(`⚠️ Could not parse connection string for ${clientName}: ${connectionString}`);
                        continue;
                    }
                    
                    const host = match[1];
                    const dbName = match[2];
                    
                    // Construct the cluster URI (without specific database name)
                    const baseUri = connectionString.split('/').slice(0, 3).join('/') + '/';
                    
                    console.log(`Client [${clientName}] connects to host: [${host}] -> DB: [${dbName}]`);
                    
                    // 2. Check if this cluster is already registered in infrastructure_clusters
                    let clusterId;
                    let clusterName;
                    
                    const clusterCheck = await pool.query(
                        "SELECT id, name FROM infrastructure_clusters WHERE host = $1 OR uri LIKE $2",
                        [host, `%@${host}%`]
                    );
                    
                    if (clusterCheck.rows.length > 0) {
                        clusterId = clusterCheck.rows[0].id;
                        clusterName = clusterCheck.rows[0].name;
                    } else {
                        // Register new cluster
                        clusterName = host.split('.')[0] + '_auto';
                        const insRes = await pool.query(
                            "INSERT INTO infrastructure_clusters (name, host, uri, status) VALUES ($1, $2, $3, 'active') RETURNING id",
                            [clusterName, host, baseUri]
                        );
                        clusterId = insRes.rows[0].id;
                        console.log(`✅ Registered NEW Cluster: ${clusterName} (ID: ${clusterId})`);
                    }
                    
                    // 3. Update the client record in infrastructure_pos_clients
                    const updateRes = await pool.query(
                        `UPDATE infrastructure_pos_clients 
                         SET cluster_id = $1, cluster_name = $2, db_name = $3 
                         WHERE name = $4 OR domain LIKE $5 OR domain LIKE $6 
                         RETURNING id, name`,
                        [clusterId, clusterName, dbName, clientName, `%${clientName}%`, `%${clientName.replace(/_/g, '')}%`]
                    );
                    
                    if (updateRes.rows.length > 0) {
                        console.log(`   ➡️  Successfully mapped client [${updateRes.rows[0].name}] in CRM database.`);
                    } else {
                        console.log(`   ⚠️  Client [${clientName}] has a active process, but no matching record was found in the CRM.`);
                    }
                } catch (clientErr) {
                    console.error(`   ❌ Error processing config file ${envPath}: ${clientErr.message}`);
                }
            }
        }
        
        console.log("\n🏁 Auto-healing process completed successfully!");
    } catch (e) {
        console.error("FATAL ERROR:", e);
    } finally {
        await pool.end();
    }
}

main();
