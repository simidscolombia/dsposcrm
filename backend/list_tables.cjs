require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
`, (err, res) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Tables:', res.rows.map(r => r.table_name));
    }
    pool.end();
});
