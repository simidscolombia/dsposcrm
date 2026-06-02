
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: 'postgresql://postgres:SimidsCRM2026!@localhost:5432/simids_crm'
});

async function migrate() {
    try {
        console.log("Starting DB migration...");
        await pool.query('ALTER TABLE infrastructure_pos_clients ADD COLUMN IF NOT EXISTS has_link BOOLEAN DEFAULT false');
        await pool.query('ALTER TABLE infrastructure_pos_clients ADD COLUMN IF NOT EXISTS has_system BOOLEAN DEFAULT false');
        await pool.query('ALTER TABLE infrastructure_pos_clients ADD COLUMN IF NOT EXISTS has_db BOOLEAN DEFAULT false');
        console.log("Migration complete.");
    } catch (e) {
        console.error("Migration error:", e.message);
    } finally {
        await pool.end();
        process.exit();
    }
}
migrate();
