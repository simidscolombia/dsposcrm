const { Client } = require('pg');

async function update() {
  const client = new Client({
    connectionString: 'postgresql://postgres:SimidsCRM2026!@localhost:5432/simids_crm'
  });
  try {
    await client.connect();
    const res = await client.query("UPDATE crm_clients SET subdomain = 'resiliencia' WHERE subdomain = 'recilencia'");
    console.log(`✅ CRM Actualizado: ${res.rowCount} filas afectadas.`);
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
update();
