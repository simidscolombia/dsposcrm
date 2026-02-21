import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// ============================================
// GET /api/payments
// Listar todos los pagos con filtros
// ============================================
router.get('/', async (req, res) => {
    try {
        const { status, period_month, period_year, search, limit = 100, offset = 0 } = req.query;

        let query = `
            SELECT p.*, 
                   c.business_name, c.contact_name, c.whatsapp, c.plan_type, c.city
            FROM crm_payments p
            JOIN crm_clients c ON p.client_id = c.id
        `;
        const conditions = [];
        const params = [];
        let i = 1;

        if (status) { conditions.push(`p.status = $${i++}`); params.push(status); }
        if (period_month) { conditions.push(`p.period_month = $${i++}`); params.push(parseInt(period_month)); }
        if (period_year) { conditions.push(`p.period_year = $${i++}`); params.push(parseInt(period_year)); }
        if (search) {
            conditions.push(`(LOWER(c.business_name) LIKE LOWER($${i}) OR c.whatsapp LIKE $${i})`);
            params.push(`%${search}%`);
            i++;
        }

        if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
        query += ` ORDER BY p.period_year DESC, p.period_month DESC, p.created_at DESC LIMIT $${i++} OFFSET $${i++}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await db.query(query, params);

        res.json({ success: true, payments: result.rows, count: result.rows.length });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POST /api/payments/generate
// Generar cobros del mes actual para clientes activos
// ============================================
router.post('/generate', async (req, res) => {
    try {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // Obtener clientes activos en la nube que no tengan cobro este mes
        const clients = await db.query(`
            SELECT c.id, c.business_name, c.monthly_amount, c.plan_type
            FROM crm_clients c
            LEFT JOIN crm_payments p ON p.client_id = c.id 
                AND p.period_month = $1 AND p.period_year = $2
            WHERE c.plan_type IN ('cloud', 'cloud_fe') 
                AND c.payment_status IN ('active', 'grace')
                AND c.is_active = true
                AND p.id IS NULL
        `, [currentMonth, currentYear]);

        if (clients.rows.length === 0) {
            return res.json({ success: true, message: 'Todos los clientes ya tienen cobros generados para este mes.', generated: 0 });
        }

        let generated = 0;
        for (const client of clients.rows) {
            await db.query(`
                INSERT INTO crm_payments (client_id, period_month, period_year, amount, status)
                VALUES ($1, $2, $3, $4, 'pending')
            `, [client.id, currentMonth, currentYear, client.monthly_amount]);
            generated++;

            // Log de actividad
            await db.query(`
                INSERT INTO crm_activity_log (client_id, activity_type, description, performed_by)
                VALUES ($1, 'payment_generated', $2, 'system')
            `, [client.id, `Cobro automático de $${client.monthly_amount} generado para el mes ${currentMonth}/${currentYear}`]);
        }

        res.json({ success: true, message: `Se generaron ${generated} cobros exitosamente.`, generated });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// PUT /api/payments/:id/status
// Actualizar el estado de un pago (Marcar Pagado, Pendiente, etc)
// ============================================
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, payment_method, notes, receipt_url } = req.body; // 'pending', 'paid', 'overdue', 'waived'

        const result = await db.query(`
            UPDATE crm_payments 
            SET status = $1, 
                payment_method = COALESCE($2, payment_method), 
                notes = COALESCE($3, notes), 
                receipt_url = COALESCE($4, receipt_url),
                payment_date = CASE WHEN $1 = 'paid' AND payment_date IS NULL THEN NOW() ELSE payment_date END, 
                updated_at = NOW()
            WHERE id = $5 
            RETURNING *
        `, [status, payment_method || null, notes || null, receipt_url || null, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Cobro no encontrado' });
        }

        const payment = result.rows[0];

        // Log the activity
        await db.query(`
            INSERT INTO crm_activity_log (client_id, activity_type, description, performed_by)
            VALUES ($1, 'payment_status_changed', $2, 'admin')
        `, [payment.client_id, `Cobro del mes ${payment.period_month}/${payment.period_year} marcado como: ${status}`]);

        // Si se pagó, actualizar el estado del cliente a activo
        if (status === 'paid') {
            await db.query(`
                UPDATE crm_clients 
                SET payment_status = 'active', last_payment_date = NOW()
                WHERE id = $1
            `, [payment.client_id]);
        }

        res.json({ success: true, payment });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POST /api/payments/:id/remind
// Enviar recordatorio de WhatsApp (simulado)
// ============================================
router.post('/:id/remind', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(`
            UPDATE crm_payments 
            SET reminder_count = reminder_count + 1, last_reminder_at = NOW(), updated_at = NOW()
            WHERE id = $1 
            RETURNING *
        `, [id]);

        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Cobro no encontrado' });

        const payment = result.rows[0];

        // Obtener datos del cliente
        const client = await db.query('SELECT whatsapp, business_name FROM crm_clients WHERE id = $1', [payment.client_id]);
        if (client.rows.length === 0) return res.status(404).json({ success: false, error: 'Cliente no encontrado' });

        const clientData = client.rows[0];

        // Log the activity
        await db.query(`
            INSERT INTO crm_activity_log (client_id, activity_type, description, metadata, performed_by)
            VALUES ($1, 'payment_reminder_sent', $2, $3, 'system')
        `, [
            payment.client_id,
            `Recordatorio de pago de $${payment.amount} enviado vía WhatsApp al ${clientData.whatsapp}`,
            JSON.stringify({ payment_id: id, count: payment.reminder_count })
        ]);

        res.json({
            success: true,
            message: `Recordatorio de WhatsApp enviado a ${clientData.business_name} (${clientData.whatsapp}).`,
            payment
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
