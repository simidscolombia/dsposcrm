require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        console.log("Conectando a BD...");
        await pool.query(`ALTER TABLE crm_quote_items ADD COLUMN IF NOT EXISTS product_name VARCHAR(255) DEFAULT 'Producto'`);
        await pool.query(`ALTER TABLE crm_quote_items ADD COLUMN IF NOT EXISTS product_category VARCHAR(50)`);
        console.log("✅ Columnas agegadas!");
    } catch (e) {
        console.error("❌ Error:", e.message);
    } finally {
        pool.end();
    }
}

run();
