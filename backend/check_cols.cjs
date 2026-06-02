const { Client } = require('pg');
require('dotenv').config();

async function check() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  try {
    await client.connect();
    
    // Check in crm_clients
    const crmRes = await client.query(`
      SELECT id, business_name, subdomain, cloud_url, plan_type, db_name, server_name, is_active 
      FROM crm_clients 
      WHERE subdomain ILIKE '%admin%' OR cloud_url ILIKE '%admin%' OR business_name ILIKE '%admin%'
    `);
    console.log('--- MATCHES IN crm_clients ---');
    console.log(crmRes.rows);

    // Check in infrastructure_pos_clients
    const infraRes = await client.query(`
      SELECT id, name, domain, db_name, server_name, cluster_name, status, has_link, has_system, has_db 
      FROM infrastructure_pos_clients 
      WHERE name ILIKE '%admin%' OR domain ILIKE '%admin%'
    `);
    console.log('--- MATCHES IN infrastructure_pos_clients ---');
    console.log(infraRes.rows);

  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
check();
