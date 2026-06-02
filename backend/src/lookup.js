
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: 'postgresql://postgres:SimidsCRM2026!@localhost:5432/simids_crm'
});

async function query() {
    try {
        const clusters = await pool.query("SELECT * FROM infrastructure_clusters WHERE name = 'cluster0_u5yvx'");
        console.table(clusters.rows);
    } catch (e) {
        console.error(e.message);
    } finally {
        await pool.end();
        process.exit();
    }
}
query();
