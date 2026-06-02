const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  try {
    await client.connect();
    console.log('Connected to DB. Creating crm_payments_history table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS crm_payments_history (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES crm_clients(id) ON DELETE CASCADE,
        payment_date DATE NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        months_covered INTEGER DEFAULT 1,
        method VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('crm_payments_history table created successfully.');
  } catch (e) {
    console.error('Error migrating DB:', e);
  } finally {
    await client.end();
  }
}
main();
