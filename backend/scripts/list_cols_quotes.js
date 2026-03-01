import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'crm_quotes'");
console.log('Columns:', res.rows.map(r => r.column_name).join(', '));
await pool.end();
