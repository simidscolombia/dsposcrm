
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://postgres:SimidsCRM2026!@localhost:5432/simids_crm' });

async function query() {
    try {
        const res = await pool.query("SELECT * FROM crm_clients WHERE subdomain ILIKE '%leyla%' OR subdomain ILIKE '%helato%' OR subdomain ILIKE '%yogelato%'");
        console.table(res.rows.map(r => ({ subdomain: r.subdomain, cluster: r.cluster, server: r.server })));
    } catch (e) {
        console.error(e.message);
    } finally {
        await pool.end();
        process.exit();
    }
}
query();
