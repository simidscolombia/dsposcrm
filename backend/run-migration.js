import db from './src/config/database.js';

async function run() {
  try {
    console.log('Running missing migrations...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS crm_distributors (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          contact_name VARCHAR(255),
          whatsapp VARCHAR(20),
          city VARCHAR(100),
          commission_rate DECIMAL(5,2) DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Table crm_distributors created or exists.');

    const checkDist = await db.query('SELECT COUNT(*) FROM crm_distributors');
    if (parseInt(checkDist.rows[0].count) === 0) {
      await db.query(`
        INSERT INTO crm_distributors (name, city, is_active) VALUES ('Discovery Systems (Directo)', 'Colombia', true);
      `);
      console.log('Inserted default distributor.');
    }

    // Let's also check if distributor_id and technician_id exist in crm_clients
    await db.query('ALTER TABLE crm_clients ADD COLUMN IF NOT EXISTS distributor_id INTEGER');
    await db.query('ALTER TABLE crm_clients ADD COLUMN IF NOT EXISTS technician_id INTEGER');
    await db.query("ALTER TABLE crm_clients ADD COLUMN IF NOT EXISTS audit_status VARCHAR(50) DEFAULT 'pending'");
    console.log('Columns added to crm_clients.');

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

run().then(() => process.exit(0));
