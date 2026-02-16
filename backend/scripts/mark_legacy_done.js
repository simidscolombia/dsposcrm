import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function markLegacy() {
    const client = await pool.connect();
    try {
        const legacyFiles = [
            '001_update_leads_table.sql',
            '002_create_appointments_table.sql',
            '003_create_ai_interactions_table.sql',
            '004_create_analytics_events_table.sql'
        ];

        console.log('Marcando migraciones legacy como completadas...');

        // Asegurar que tabla migrations existe
        await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT NOW()
      );
    `);

        for (const file of legacyFiles) {
            try {
                await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
                console.log(`✅ Marcada: ${file}`);
            } catch (e) {
                if (e.code === '23505') { // Unique violation
                    console.log(`ℹ️ Ya estaba marcada: ${file}`);
                } else {
                    console.error(`Error marcando ${file}:`, e.message);
                }
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        pool.end();
    }
}

markLegacy();
