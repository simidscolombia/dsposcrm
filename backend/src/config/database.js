import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Ajuste para Supabase Transaction Pooler: Evitar error de certificado autofirmado
const connectionString = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace("sslmode=require", "sslmode=no-verify")
  : undefined;

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // CLAVE: Aceptar certificado de Supabase
  },
  max: 10,
  connectionTimeoutMillis: 5000
});

console.log('DB Config Loaded:', {
  hasUrl: !!connectionString,
  sslMode: 'no-verify (forced)'
});

const db = {
  query: (text, params) => pool.query(text, params),
};

export default db;
