import db from '../src/config/database.js';

async function run() {
    try {
        console.log('--- SERVERS ---');
        const servers = await db.query('SELECT * FROM infrastructure_servers');
        console.log(servers.rows);

        console.log('--- CLUSTERS ---');
        const clusters = await db.query('SELECT * FROM infrastructure_clusters WHERE id = 5 OR name = \'cluster0_auto\'');
        console.log(clusters.rows);

        console.log('--- CLIENTS (ADMIN DETAILS) ---');
        const clients = await db.query("SELECT * FROM infrastructure_pos_clients WHERE name = 'admin'");
        console.log(clients.rows);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

run();
