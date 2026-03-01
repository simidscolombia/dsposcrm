import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const res = await pool.query('SELECT count(*) FROM crm_quotes');
console.log('Quote Count:', res.rows[0].count);
await pool.end();
