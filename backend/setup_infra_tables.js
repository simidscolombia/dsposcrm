import pg from 'pg';

const pool = new pg.Pool({
    connectionString: 'postgresql://postgres:SimidsCRM2026!@147.182.173.202:5432/simids_crm',
    ssl: false
});

async function main() {
    try {
        console.log('🔌 Connecting to CRM database on 147.182.173.202...');
        
        // 1. Check existing tables
        const tablesRes = await pool.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        console.log('\n📋 EXISTING TABLES:');
        tablesRes.rows.forEach(r => console.log(`  - ${r.table_name}`));
        
        // 2. Check if infrastructure tables exist
        const infraTables = ['infrastructure_servers', 'infrastructure_clusters', 'infrastructure_pos_clients', 'infrastructure_data'];
        const missing = [];
        for (const t of infraTables) {
            const exists = tablesRes.rows.some(r => r.table_name === t);
            console.log(`  ${exists ? '✅' : '❌'} ${t}`);
            if (!exists) missing.push(t);
        }
        
        if (missing.length === 0) {
            console.log('\n✅ All infrastructure tables exist!');
        } else {
            console.log(`\n⚠️ Missing tables: ${missing.join(', ')}`);
            console.log('Creating missing infrastructure tables...\n');
        }

        // Create all tables with IF NOT EXISTS
        await pool.query(`
            CREATE TABLE IF NOT EXISTS infrastructure_servers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                ip VARCHAR(45) NOT NULL,
                provider VARCHAR(100) DEFAULT 'DigitalOcean',
                region VARCHAR(50),
                total_clients INTEGER DEFAULT 0,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ infrastructure_servers OK');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS infrastructure_clusters (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                host VARCHAR(255),
                uri TEXT,
                tier VARCHAR(50) DEFAULT 'M0',
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ infrastructure_clusters OK');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS infrastructure_pos_clients (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                domain VARCHAR(255),
                server_id INTEGER REFERENCES infrastructure_servers(id),
                server_name VARCHAR(100),
                cluster_id INTEGER REFERENCES infrastructure_clusters(id),
                cluster_name VARCHAR(100),
                db_name VARCHAR(150),
                db_size_mb NUMERIC(10,2) DEFAULT 0,
                port INTEGER,
                owner_name VARCHAR(150),
                owner_phone VARCHAR(50),
                owner_email VARCHAR(150),
                notes TEXT,
                status VARCHAR(30) DEFAULT 'active',
                has_link BOOLEAN DEFAULT false,
                has_system BOOLEAN DEFAULT false,
                has_db BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ infrastructure_pos_clients OK');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS infrastructure_data (
                id SERIAL PRIMARY KEY,
                payload JSONB,
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ infrastructure_data OK');
        
        // 3. Seed known servers
        console.log('\n🌱 Seeding known servers...');
        const knownServers = [
            { name: 'Server01', ip: '24.144.114.69', provider: 'DigitalOcean' },
            { name: 'Server02', ip: '104.248.238.193', provider: 'DigitalOcean' },
            { name: 'Server-simids-pos', ip: '134.209.115.74', provider: 'DigitalOcean' },
            { name: 'Server-CRM', ip: '147.182.173.202', provider: 'DigitalOcean' }
        ];
        
        for (const srv of knownServers) {
            const exists = await pool.query('SELECT id FROM infrastructure_servers WHERE ip = $1', [srv.ip]);
            if (exists.rows.length === 0) {
                await pool.query(
                    'INSERT INTO infrastructure_servers (name, ip, provider, status, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())',
                    [srv.name, srv.ip, srv.provider, 'active']
                );
                console.log(`  ✅ Inserted ${srv.name} (${srv.ip})`);
            } else {
                console.log(`  ⏭️  ${srv.name} (${srv.ip}) already exists`);
            }
        }
        
        // 4. Final check
        console.log('\n📊 FINAL STATE:');
        for (const t of infraTables) {
            try {
                const countRes = await pool.query(`SELECT count(*) FROM ${t}`);
                console.log(`  ${t}: ${countRes.rows[0].count} rows`);
            } catch (e) {
                console.log(`  ${t}: ERROR - ${e.message}`);
            }
        }
        
        const serversRes = await pool.query('SELECT id, name, ip, status FROM infrastructure_servers ORDER BY id');
        console.log('\n🖥️  SERVERS:');
        serversRes.rows.forEach(r => console.log(`  [${r.id}] ${r.name} - ${r.ip} (${r.status})`));
        
    } catch (error) {
        console.error('❌ FATAL ERROR:', error.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

main();
