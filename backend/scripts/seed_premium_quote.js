import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function seed() {
    console.log("🚀 Seeding Premium Quote #50...");
    try {
        // 1. Create Lead
        const lead = await pool.query(`
            INSERT INTO leads (name, whatsapp, city, business_type, system_type, prize_won, pipeline_stage, source)
            VALUES ('CARLOS PEREIRA', '3155962626', 'Medellín', 'Restaurante', 'Touch Pro', 'Impresora Térmica Gratis', 'won', 'web')
            RETURNING id
        `);
        const leadId = lead.rows[0].id;

        // 2. Create Quote
        const quote = await pool.query(`
            INSERT INTO crm_quotes (
                id, lead_id, client_name, client_phone, client_city, client_business,
                system_type, total_amount, discount_percent, discount_amount, final_amount,
                prize_label, prize_detail, status, created_at
            ) VALUES (50, $1, 'CARLOS PEREIRA', '3155962626', 'Medellín', 'Restaurante El Sabor', 
            'Touch Pro', 3200000, 10, 320000, 2880000, 
            'Impresora Térmica Gratis', 'Impresora Xprinter 80mm de alta velocidad', 'sent', NOW())
            ON CONFLICT (id) DO UPDATE SET 
                client_name = EXCLUDED.client_name,
                total_amount = EXCLUDED.total_amount,
                final_amount = EXCLUDED.final_amount
            RETURNING id
        `, [leadId]);
        const quoteId = quote.rows[0].id;

        // 3. Create Items
        await pool.query("DELETE FROM crm_quote_items WHERE quote_id = 50");
        const items = [
            ['Sistema POS Discovery PRO', 'Software', 1, 1500000],
            ['Monitor Táctil 15.6" Industrial', 'Hardware', 1, 1200000],
            ['Cajón Monedero Metálico', 'Hardware', 1, 300000],
            ['Capacitación y Montaje', 'Servicios', 1, 200000]
        ];

        for (const [name, cat, qty, price] of items) {
            await pool.query(`
                INSERT INTO crm_quote_items (quote_id, product_name, product_category, quantity, unit_price, subtotal)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [quoteId, name, cat, qty, price, price * qty]);
        }

        console.log("✅ Seed complete! Portal available at: /portal/50");

    } catch (e) {
        console.error("❌ Error seeding:", e);
    } finally {
        await pool.end();
    }
}

seed();
