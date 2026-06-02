
import dotenv from 'dotenv';
dotenv.config({ path: '/var/www/simids-crm/backend/.env' });

import db from './config/database.js';

async function migrate() {
    try {
        console.log("Starting DB migration...");
        await db.query('ALTER TABLE infrastructure_pos_clients ADD COLUMN IF NOT EXISTS has_link BOOLEAN DEFAULT false');
        await db.query('ALTER TABLE infrastructure_pos_clients ADD COLUMN IF NOT EXISTS has_system BOOLEAN DEFAULT false');
        await db.query('ALTER TABLE infrastructure_pos_clients ADD COLUMN IF NOT EXISTS has_db BOOLEAN DEFAULT false');
        console.log("Migration complete.");
    } catch (e) {
        console.error("Migration error:", e.message);
    } finally {
        process.exit();
    }
}
migrate();
