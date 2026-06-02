require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log('Creating leads table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS leads (
                id SERIAL PRIMARY KEY,
                business_name VARCHAR(255),
                contact_name VARCHAR(255),
                whatsapp VARCHAR(50),
                created_at TIMESTAMP DEFAULT NOW(),
                status VARCHAR(50)
            );
        `);
        console.log('✅ leads table created.');

        const sql7 = fs.readFileSync(path.join(__dirname, 'migrations/007_crm_full_schema.sql'), 'utf8');
        console.log('Running 007...');
        await pool.query(sql7);
        console.log('✅ 007 done.');

        const sql8 = fs.readFileSync(path.join(__dirname, 'migrations/008_infrastructure_tables.sql'), 'utf8');
        console.log('Running 008...');
        await pool.query(sql8);
        console.log('✅ 008 done.');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
}

run();
