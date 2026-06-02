// run_migration_billing.cjs
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: 'postgresql://postgres:SimidsCRM2026!@24.144.114.69:5432/simids_crm',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const sql = fs.readFileSync(path.join(__dirname, 'migrations/004_billing_months.sql'), 'utf8');
    // Ejecutar por bloques separados por punto y coma para evitar problemas con múltiples statements
    const client = await pool.connect();
    try {
        await client.query(sql);
        console.log('✅ Migración client_billing_months ejecutada correctamente.');
        // Verificar cuántos meses se generaron
        const res = await client.query('SELECT COUNT(*) AS total FROM client_billing_months');
        console.log(`📅 Meses generados en client_billing_months: ${res.rows[0].total}`);
    } catch (err) {
        console.error('❌ Error en migración:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
