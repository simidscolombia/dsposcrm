
import pg from 'pg';

export default async function handler(req, res) {
    const { Pool } = pg;

    // Imprimir (censurado) lo que ve Vercel
    const dbUrl = process.env.DATABASE_URL || 'NO_URL_FOUND';
    const cleanUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');

    console.log('Testing DB Connection to:', cleanUrl);

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
    });

    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as time, version()');
        client.release();

        res.status(200).json({
            status: 'SUCCESS',
            message: 'Conexión exitosa a Supabase 🚀',
            time: result.rows[0].time,
            version: result.rows[0].version,
            env_check: cleanUrl
        });
    } catch (error) {
        console.error('DB Connection Error:', error);
        res.status(500).json({
            status: 'ERROR',
            message: error.message,
            code: error.code,
            details: error.toString(),
            env_check: cleanUrl
        });
    }
}
