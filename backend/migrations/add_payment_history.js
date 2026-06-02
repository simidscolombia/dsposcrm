import db from '../src/config/database.js';

async function migrate() {
    try {
        console.log('Adding billing fields to crm_clients...');
        await db.query(`
            ALTER TABLE crm_clients 
            ADD COLUMN IF NOT EXISTS billing_start_date DATE,
            ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'monthly',
            ADD COLUMN IF NOT EXISTS next_billing_date DATE,
            ADD COLUMN IF NOT EXISTS profile_completion INTEGER DEFAULT 0;
        `);
        
        console.log('Creating crm_payments_history table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS crm_payments_history (
                id SERIAL PRIMARY KEY,
                client_id INTEGER REFERENCES crm_clients(id) ON DELETE CASCADE,
                payment_date DATE NOT NULL,
                amount NUMERIC(10, 2) NOT NULL,
                months_covered INTEGER DEFAULT 1,
                method VARCHAR(50) DEFAULT 'transfer',
                notes TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('Migration successful.');
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}
migrate();
