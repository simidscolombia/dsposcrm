const pg = require('pg');
const dotenv = require('dotenv');
dotenv.config({ path: '/var/www/simids-crm/backend/.env' });

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function main() {
    try {
        console.log("Conectando a la base de datos central...");
        const res = await pool.query("SELECT id, name, business_name, subdomain, database_name, mongo_uri FROM crm_clients WHERE subdomain = 'elbroasterdelchef' OR business_name ILIKE '%broaster%'");
        console.log("RESULTADO:", JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error("ERROR QUERY:", e);
    } finally {
        await pool.end();
    }
}
main();
