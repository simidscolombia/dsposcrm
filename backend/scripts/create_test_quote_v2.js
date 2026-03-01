import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

const client = await pool.connect();
try {
    // 1. Create a lead (No city column)
    const leadRes = await client.query(`
        INSERT INTO leads (name, whatsapp, pipeline_stage, source, status)
        VALUES ('Cliente Prueba #25', '573001234567', 'quoted', 'web', 'new')
        RETURNING id
    `);
    const leadId = leadRes.rows[0].id;

    // 2. Create the quote with ID 25
    await client.query(`
        INSERT INTO crm_quotes (id, lead_id, client_name, client_phone, client_city, total_amount, final_amount, status)
        VALUES (25, $1, 'Cliente Prueba #25', '573001234567', 'Medellín', 2500000, 2250000, 'sent')
        ON CONFLICT (id) DO UPDATE SET client_name = EXCLUDED.client_name
    `, [leadId]);

    // 3. Create items
    const items = [
        { name: 'Sistema POS Discovery All-in-One', category: 'Software', price: 1800000, qty: 1 },
        { name: 'Impresora Térmica 80mm', category: 'Hardware', price: 450000, qty: 1 },
        { name: 'Cajón Monedero Metálico', category: 'Hardware', price: 250000, qty: 1 }
    ];

    for (const item of items) {
        await client.query(`
            INSERT INTO crm_quote_items (quote_id, product_name, product_category, unit_price, quantity, subtotal)
            VALUES (25, $1, $2, $3, $4, $5)
        `, [item.name, item.category, item.price, item.qty, item.price * item.qty]);
    }

    console.log('✅ Quote #25 created successfully locally!');

} finally {
    client.release();
    await pool.end();
}
