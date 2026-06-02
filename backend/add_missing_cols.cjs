const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  try {
    await client.connect();
    console.log('Connected to DB. Adding columns...');
    
    await client.query(`
      ALTER TABLE crm_clients 
      ADD COLUMN IF NOT EXISTS billing_start_date DATE,
      ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(50) DEFAULT 'monthly',
      ADD COLUMN IF NOT EXISTS has_electronic_billing BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS profile_completion INTEGER DEFAULT 0
    `);
    
    console.log('Columns added successfully.');
  } catch (e) {
    console.error('Error migrating DB:', e);
  } finally {
    await client.end();
  }
}
main();
