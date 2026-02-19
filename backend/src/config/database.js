import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Ajuste para Supabase y Vercel Serverless
// Usamos la URL completa para respetar ?pgbouncer=true y otros params
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Necesario para Supabase en Vercel
  },
  max: 1, // Serverless functions should use minimal connections
  idleTimeoutMillis: 3000, // Close idle clients quickly
  connectionTimeoutMillis: 5000,
});

console.log('DB Config Loaded for Serverless:', {
  hasUrl: !!connectionString,
  sslMode: 'no-verify',
  maxConnections: 1
});

const db = {
  query: (text, params) => pool.query(text, params),
};

export default db;
