const { Client } = require('pg');

async function check() {
  const client = new Client({
    connectionString: 'postgresql://postgres:SimidsCRM2026!@localhost:5432/simids_crm'
  });
  try {
    await client.connect();
    const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'crm_clients'");
    console.log('--- COLUMNAS DE crm_clients ---');
    res.rows.forEach(r => console.log(r.column_name));
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
check();
