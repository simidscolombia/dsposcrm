require('dotenv').config();
const { Client } = require('pg');

const urlPattern = process.env.DATABASE_URL.replace(':6543', ':5432');

const connectionString = urlPattern.includes('?') ? urlPattern : urlPattern + '?pgbouncer=true';

const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

client.connect()
    .then(() => {
        console.log('Connected to DB');
        return client.query(`
      ALTER TABLE crm_clients ADD COLUMN IF NOT EXISTS legal_representative VARCHAR(255);
      ALTER TABLE crm_distributors ADD COLUMN IF NOT EXISTS legal_representative VARCHAR(255);
      ALTER TABLE crm_distributors ADD COLUMN IF NOT EXISTS nit VARCHAR(50);
      ALTER TABLE crm_distributors ADD COLUMN IF NOT EXISTS email VARCHAR(255);
      ALTER TABLE crm_distributors ADD COLUMN IF NOT EXISTS address VARCHAR(255);
    `);
    })
    .then(() => {
        console.log('Tables successfully altered');
        client.end();
    })
    .catch(err => {
        console.error('Error during migration:', err);
        client.end();
    });
