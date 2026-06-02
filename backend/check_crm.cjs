const { Client } = require('pg');

async function check() {
  const client = new Client({
    connectionString: 'postgresql://postgres:SimidsCRM2026!@localhost:5432/simids_crm'
  });
  try {
    await client.connect();
    const res = await client.query("SELECT subdomain, database FROM crm_clients WHERE subdomain = 'bancos'");
    console.log('--- CONFIGURACIÓN EN CRM ---');
    console.log(res.rows[0]);
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
check();
