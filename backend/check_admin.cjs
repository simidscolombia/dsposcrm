require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const res = await pool.query("SELECT * FROM infrastructure_servers LIMIT 10");
        console.log('SERVERS:', res.rows);
    } catch(e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
