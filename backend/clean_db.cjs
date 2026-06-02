require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await pool.query("DELETE FROM infrastructure_servers WHERE ip = '134.209.115.74'");
        console.log('✅ Server 134.209.115.74 deleted.');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
}

run();
