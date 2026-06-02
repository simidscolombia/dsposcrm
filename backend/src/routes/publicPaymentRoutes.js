import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// ============================================
// GET /api/public/payments/client/:clientId/status  
// Estado de pagos de un cliente (público)
// ============================================
router.get('/client/:clientId/status', async (req, res) => {
    try {
        const { clientId } = req.params;

        const client = await db.query(`
            SELECT id, business_name, payment_status, plan_type, monthly_amount, last_payment_date
            FROM crm_clients WHERE id = $1
        `, [clientId]);

        if (client.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
        }

        const payments = await db.query(`
            SELECT id, amount, period_month, period_year, status, due_date, payment_date, 
                   wompi_link_url, wompi_link_id, created_at
            FROM crm_payments 
            WHERE client_id = $1 
            ORDER BY period_year DESC, period_month DESC 
            LIMIT 12
        `, [clientId]);

        const pendingPayment = payments.rows.find(p => p.status === 'pending' || p.status === 'overdue');

        res.json({
            success: true,
            client: client.rows[0],
            payments: payments.rows,
            pending_payment: pendingPayment || null,
            service_active: client.rows[0].payment_status === 'active'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
