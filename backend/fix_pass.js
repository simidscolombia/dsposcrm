
import db from './src/config/database.js';
import bcrypt from 'bcryptjs';

async function fix() {
    try {
        const hash = await bcrypt.hash('123456', 10);
        console.log('New hash:', hash);
        const res = await db.query('UPDATE crm_users SET password_hash =  WHERE username = ', [hash, 'admin']);
        console.log('Update result:', res.rowCount);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
fix();

