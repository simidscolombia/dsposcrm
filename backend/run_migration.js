import db from './src/config/database.js';

async function runMigration() {
    try {
        console.log('Starting migration...');
        await db.query(`
            ALTER TABLE crm_payments ADD COLUMN IF NOT EXISTS wompi_link_id VARCHAR(255);
            ALTER TABLE crm_payments ADD COLUMN IF NOT EXISTS wompi_link_url TEXT;
            ALTER TABLE crm_payments ADD COLUMN IF NOT EXISTS wompi_reference VARCHAR(255);
            ALTER TABLE crm_payments ADD COLUMN IF NOT EXISTS wompi_transaction_id VARCHAR(255);
        `);
        console.log('✅ Migration successful: Wompi columns added.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
