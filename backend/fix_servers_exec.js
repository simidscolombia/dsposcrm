import db from './src/config/database.js';

async function run() {
    try {
        console.log('=== ACTUALIZANDO CONEXIONES DE SERVIDORES ===');
        
        // 1. Update Server02 IP
        await db.query(`
            UPDATE infrastructure_servers 
            SET ip = '104.248.238.193', updated_at = NOW() 
            WHERE name = 'Server02' OR ip = '159.203.109.163'
        `);
        console.log('✅ Server02 IP actualizada de 159.203.109.163 a 104.248.238.193');

        // 2. Insert Server-simids-pos
        const existing = await db.query(`SELECT id FROM infrastructure_servers WHERE ip = '134.209.115.74'`);
        if (existing.rows.length === 0) {
            await db.query(`
                INSERT INTO infrastructure_servers (name, ip, provider, total_clients, status, created_at, updated_at) 
                VALUES ('Server-simids-pos', '134.209.115.74', 'DigitalOcean', 0, 'active', NOW(), NOW())
            `);
            console.log('✅ Server-simids-pos (134.209.115.74) fue agregado exitosamente a la base de datos');
        } else {
            console.log('✅ Server-simids-pos ya existía en la BD.');
        }

        // 3. Print the updated list
        const servers = await db.query('SELECT id, name, ip FROM infrastructure_servers ORDER BY id');
        console.log('=== LISTA ACTUALIZADA DE SERVIDORES ===');
        console.log(JSON.stringify(servers.rows, null, 2));

    } catch (error) {
        console.error('Error actualizando DB:', error);
    } finally {
        process.exit(0);
    }
}

run();
