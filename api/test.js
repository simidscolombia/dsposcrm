
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

        // Test 1: Lectura
        const result = await client.query('SELECT NOW() as time, version()');

        // Test 2: Escritura (Intento)
        // Intentamos insertar una categoria dummy que luego borramos (o rollback)
        await client.query('BEGIN');
        const insertResult = await client.query(
            `INSERT INTO crm_categories (name, slug, description, "order") 
       VALUES ($1, $2, $3, $4) RETURNING id`,
            ['Test Vercel ' + Date.now(), 'test-' + Date.now(), 'Test de escritura', 999]
        );
        await client.query('ROLLBACK'); // No guardamos nada realmente, solo probamos permiso

        client.release();

        res.status(200).json({
            status: 'SUCCESS',
            message: 'Lectura y Escritura exitosa en Supabase 🚀',
            write_test: 'OK (Rollback performed)',
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
