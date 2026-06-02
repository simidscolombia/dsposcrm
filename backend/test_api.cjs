require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.query('SELECT 1', (err, res) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Success:', res.rows);
    }
    pool.end();
});
