import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigrations() {
    const migrationsDir = path.join(__dirname, '../migrations');

    if (!fs.existsSync(migrationsDir)) {
        console.error('No se encontró la carpeta de migraciones');
        process.exit(1);
    }

    const files = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort(); // Orden alfabético

    console.log(`Encontradas ${files.length} migraciones.`);

    const client = await pool.connect();

    try {
        // Transaction Pooler no soporta transacciones de múltiples pasos
        // await client.query('BEGIN');

        // Tabla de control de migraciones
        await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT NOW()
      );
    `);

        for (const file of files) {
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf-8');

            // Verificar si ya se aplicó
            // Usamos interpolación directa para evitar Prepared Statements (incompatibles con Transaction Pooler)
            const checkQuery = `SELECT id FROM migrations WHERE name = '${file}'`;
            const check = await client.query(checkQuery);

            if (check.rows.length === 0) {
                console.log(`Aplicando migración: ${file}`);
                await client.query(sql); // SQL directo del archivo

                const insertQuery = `INSERT INTO migrations (name) VALUES ('${file}')`;
                await client.query(insertQuery);

                console.log(`✅ ${file} completada.`);
            } else {
                console.log(`⏭️ ${file} ya aplicada.`);
            }
        }

        // await client.query('COMMIT');
        console.log('🎉 Todas las migraciones completadas exitosamente.');
    } catch (error) {
        // await client.query('ROLLBACK');
        console.error('❌ Error ejecutando migraciones:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations();
