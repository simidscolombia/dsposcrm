
// RUTA DE DEBUG DE EXPRESS
import express from 'express';
import pg from 'pg';

const router = express.Router();

router.get('/debug-express', async (req, res) => {
    const { Pool } = pg;
    // Usamos la misma lógica que en api/test.js pero dentro del router de Express
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
    });

    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as time, version()');
        client.release();

        res.json({
            status: 'SUCCESS (Express)',
            message: 'Conexión desde Express exitosa 🚀',
            time: result.rows[0].time,
            db_url_masked: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@') : 'MISSING'
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR (Express)',
            message: error.message,
            details: error.toString()
        });
    }
});

export default router;
