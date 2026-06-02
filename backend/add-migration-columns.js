import db from './src/config/database.js';

async function run() {
  try {
    console.log('Adding columns for migration support...');
    await db.query('ALTER TABLE crm_clients ADD COLUMN IF NOT EXISTS db_name TEXT');
    await db.query('ALTER TABLE crm_clients ADD COLUMN IF NOT EXISTS cluster_id VARCHAR(100)');
    await db.query('ALTER TABLE crm_clients ADD COLUMN IF NOT EXISTS billing_start_date TIMESTAMP');
    console.log('Columns db_name, cluster_id, billing_start_date added successfully.');
  } catch (err) {
    console.error('Failed to add columns:', err);
  }
  process.exit(0);
}

run();
