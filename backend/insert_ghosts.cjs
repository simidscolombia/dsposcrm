const { MongoClient } = require('mongodb');
const pg = require('pg');

const pool = new pg.Pool({
    connectionString: 'postgresql://postgres:SimidsCRM2026!@localhost:5432/simids_crm'
});

const ghosts = [
  {
    "server": "Server02",
    "name": "cafeterialabendicion",
    "port": 3132,
    "dbCnn": "mongodb+srv://soportesimids12_db_user:4SCGFpIdUV8YPbMV@simids12.8g6hzui.mongodb.net/cafeterialabendicion",
    "domain": "cafeterialabendicion.poslatino.com"
  },
  {
    "server": "Server02",
    "name": "ags",
    "port": 3110,
    "dbCnn": "mongodb+srv://mongosimids7_db_user:oAkgL0RwL2ssMhGH@mongosimids7.hizdoxl.mongodb.net/ags",
    "domain": "ags.poslatino.com"
  },
  {
    "server": "Server02",
    "name": "motorsjm",
    "port": 3146,
    "dbCnn": "mongodb+srv://soportesimids12_db_user:4SCGFpIdUV8YPbMV@simids12.8g6hzui.mongodb.net/motorsjm",
    "domain": "motorsjm.poslatino.com"
  },
  {
    "server": "Server02",
    "name": "areizason",
    "port": 3114,
    "dbCnn": "mongodb+srv://mongosimids7_db_user:oAkgL0RwL2ssMhGH@mongosimids7.hizdoxl.mongodb.net/areizason",
    "domain": "areizason.poslatino.com"
  },
  {
    "server": "Server02",
    "name": "abastosylubricantes",
    "port": 3130,
    "dbCnn": "mongodb+srv://soportesimids12_db_user:4SCGFpIdUV8YPbMV@simids12.8g6hzui.mongodb.net/abastosylubricantes",
    "domain": "abastosylubricantes.poslatino.com"
  },
  {
    "server": "Server02",
    "name": "drogueriaom",
    "port": 3124,
    "dbCnn": "mongodb+srv://soportesimids12_db_user:4SCGFpIdUV8YPbMV@simids12.8g6hzui.mongodb.net/drogueriaom",
    "domain": "drogueriaom.poslatino.com"
  },
  {
    "server": "Server02",
    "name": "rooma",
    "port": 3062,
    "dbCnn": "mongodb+srv://simids6:Simids2024*@simids6.mjkgn.mongodb.net/rooma",
    "domain": "rooma.poslatino.com"
  },
  {
    "server": "Server02",
    "name": "supercarnes1",
    "port": 3122,
    "dbCnn": "mongodb+srv://mongosimids7_db_user:oAkgL0RwL2ssMhGH@mongosimids7.hizdoxl.mongodb.net/supercarnes1",
    "domain": "supercarnes1.poslatino.com"
  },
  {
    "server": "Server02",
    "name": "puentepiedra",
    "port": 3113,
    "dbCnn": "mongodb+srv://mongosimids7_db_user:oAkgL0RwL2ssMhGH@mongosimids7.hizdoxl.mongodb.net/puentepiedra",
    "domain": "puentepiedra.poslatino.com"
  },
  {
    "server": "Server02",
    "name": "pollosrohi1",
    "port": 3068,
    "dbCnn": "mongodb+srv://simids6:Simids2024*@simids6.mjkgn.mongodb.net/pollosrohi1",
    "domain": "pollosrohi1.poslatino.com"
  },
  {
    "server": "Server02",
    "name": "tacoburguer_backup",
    "port": 3121,
    "dbCnn": "mongodb+srv://mongosimids7_db_user:oAkgL0RwL2ssMhGH@mongosimids7.hizdoxl.mongodb.net/tacoburguer",
    "domain": "tacoburguer.poslatino.com"
  },
  {
    "server": "Server02",
    "name": "rhmas",
    "port": 3118,
    "dbCnn": "mongodb+srv://mongosimids7_db_user:oAkgL0RwL2ssMhGH@mongosimids7.hizdoxl.mongodb.net/rhmas",
    "domain": "rhmas.poslatino.com"
  },
  {
    "server": "Server02",
    "name": "danyorstylos2",
    "port": 3057,
    "dbCnn": "mongodb+srv://simids6:Simids2024*@simids6.mjkgn.mongodb.net/danyorstylos2",
    "domain": "danyorstylos2.poslatino.com"
  },
  {
    "server": "Server02",
    "name": "pollobulevar",
    "port": 3064,
    "dbCnn": "mongodb+srv://simids6:Simids2024*@simids6.mjkgn.mongodb.net/pollobulevar",
    "domain": "pollobulevar.poslatino.com"
  },
  {
    "server": "Server02",
    "name": "ptcemodayestilo",
    "port": 3126,
    "dbCnn": "mongodb+srv://mongosimids7_db_user:oAkgL0RwL2ssMhGH@mongosimids7.hizdoxl.mongodb.net/ptcemodayestilo",
    "domain": "ptcemodayestilo.poslatino.com"
  },
  {
    "server": "Server02",
    "name": "ptcemodayestilo1",
    "port": 3137,
    "dbCnn": "mongodb+srv://soportesimids12_db_user:4SCGFpIdUV8YPbMV@simids12.8g6hzui.mongodb.net/ptcemodayestilo1",
    "domain": "ptcemodayestilo1.poslatino.com"
  },
  {
    "server": "Server02",
    "name": "pollosrohi",
    "port": 3063,
    "dbCnn": "mongodb+srv://simids6:Simids2024*@simids6.mjkgn.mongodb.net/pollosrohi",
    "domain": "pollosrohi.poslatino.com"
  }
];

async function main() {
    try {
        console.log("Starting missing clients insertion in CRM PostgreSQL database...");
        
        // 1. Get Server02 ID and info
        const serverQuery = await pool.query("SELECT id, name FROM infrastructure_servers WHERE name = 'Server02'");
        if (serverQuery.rows.length === 0) {
            console.error("Server02 not found in database!");
            return;
        }
        const serverId = serverQuery.rows[0].id;
        const serverName = serverQuery.rows[0].name;
        
        for (const ghost of ghosts) {
            console.log(`\nProcessing client: [${ghost.name}]...`);
            
            // 2. Check if already exists in database
            const checkQuery = await pool.query("SELECT id FROM infrastructure_pos_clients WHERE name = $1", [ghost.name]);
            if (checkQuery.rows.length > 0) {
                console.log(`Client [${ghost.name}] already registered in PostgreSQL database (Skipping insert)`);
                continue;
            }
            
            // 3. Find the matching cluster name and ID
            const hostMatch = ghost.dbCnn.match(/mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@([^/]+)\/([^?]+)/);
            if (!hostMatch) {
                console.log(`⚠️ Could not parse connection string for ${ghost.name}`);
                continue;
            }
            const host = hostMatch[1];
            const dbName = hostMatch[2];
            
            const clusterQuery = await pool.query("SELECT id, name FROM infrastructure_clusters WHERE host = $1 OR uri LIKE $2", [host, `%@${host}%`]);
            if (clusterQuery.rows.length === 0) {
                console.log(`⚠️ Cluster with host ${host} not found in database for client ${ghost.name}`);
                continue;
            }
            const clusterId = clusterQuery.rows[0].id;
            const clusterName = clusterQuery.rows[0].name;
            
            // 4. Measure the MongoDB database size
            let dbSizeMb = 0.00;
            try {
                const mongoClient = new MongoClient(ghost.dbCnn, { connectTimeoutMS: 5000, serverSelectionTimeoutMS: 5000 });
                await mongoClient.connect();
                const dbs = await mongoClient.db().admin().listDatabases();
                const matchedDb = dbs.databases.find(d => d.name === dbName);
                if (matchedDb) {
                    dbSizeMb = matchedDb.sizeOnDisk / 1024 / 1024;
                    console.log(`   MongoDB database found: ${dbName} (Size: ${dbSizeMb.toFixed(2)} MB)`);
                } else {
                    console.log(`   ⚠️ Database ${dbName} not found in cluster, size defaulted to 0 MB`);
                }
                await mongoClient.close();
            } catch (err) {
                console.log(`   ⚠️ Failed to connect to MongoDB cluster: ${err.message}, size defaulted to 0 MB`);
            }
            
            // 5. Insert client into PostgreSQL database
            const insertQuery = `
                INSERT INTO infrastructure_pos_clients 
                (name, domain, server_id, server_name, cluster_id, cluster_name, db_name, db_size_mb, port, status, has_link, has_system, has_db, created_at, updated_at) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', true, true, true, NOW(), NOW())
                RETURNING id;
            `;
            const insertRes = await pool.query(insertQuery, [
                ghost.name,
                ghost.domain,
                serverId,
                serverName,
                clusterId,
                clusterName,
                dbName,
                dbSizeMb,
                ghost.port
            ]);
            
            console.log(`✅ Successfully REGISTERED [${ghost.name}] in CRM PostgreSQL (ID: ${insertRes.rows[0].id})`);
        }
        
        console.log("\n🏁 Insertion and sync process completed successfully!");
    } catch (err) {
        console.error("FATAL ERROR:", err);
    } finally {
        await pool.end();
    }
}

main();
