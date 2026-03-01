import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: 'postgresql://postgres.cqgndjrqburmhwlrrwm:DSPOSIlI2025@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        const res = await pool.query('SELECT * FROM crm_quote_items WHERE quote_id = 22');
        console.log('Items for quote 22:', JSON.stringify(res.rows, null, 2));

        const quote = await pool.query('SELECT * FROM crm_quotes WHERE id = 22');
        console.log('Quote 22:', JSON.stringify(quote.rows[0], null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
