
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://postgres:SimidsCRM2026!@localhost:5432/simids_crm' });

async function query() {
    try {
        const res = await pool.query("SELECT id, name, ip FROM infrastructure_servers");
        console.log(JSON.stringify(res.rows));
    } catch (e) {
        console.error("[]");
    } finally {
        await pool.end();
        process.exit();
    }
}
query();
