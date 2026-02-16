import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10, // Serverless needs fewer connections
  connectionTimeoutMillis: 5000 // Error if connection takes too long
});

console.log('DB Config:', {
  hasUrl: !!process.env.DATABASE_URL,
  ssl: true
});

const db = {
  query: (text, params) => pool.query(text, params),
};

export default db;
