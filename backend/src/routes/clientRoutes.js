import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// ============================================
// GET /api/clients
// Listar clientes con filtros
// ============================================
router.get('/', async (req, res) => {
    try {
        const { plan_type, payment_status, city, search, limit = 100, offset = 0 } = req.query;

        let query = `
            SELECT c.*,
                   a.name as advisor_name,
                   d.name as distributor_name,
                   (SELECT COUNT(*) FROM crm_payments p WHERE p.client_id = c.id AND p.status = 'paid') as total_payments,
                   (SELECT COUNT(*) FROM crm_payments p WHERE p.client_id = c.id AND p.status IN ('pending', 'overdue')) as pending_payments,
                   (SELECT SUM(amount) FROM crm_payments p WHERE p.client_id = c.id AND p.status = 'paid') as total_paid,
                   (SELECT COUNT(*) FROM crm_tickets t WHERE t.client_id = c.id AND t.status != 'closed') as open_tickets
            FROM crm_clients c
            LEFT JOIN crm_advisors a ON c.advisor_id = a.id
            LEFT JOIN crm_distributors d ON c.distributor_id = d.id
        `;
        const conditions = [];
        const params = [];
        let i = 1;

        if (plan_type) { conditions.push(`c.plan_type = $${i++}`); params.push(plan_type); }
        if (payment_status) { conditions.push(`c.payment_status = $${i++}`); params.push(payment_status); }
        if (city) { conditions.push(`LOWER(c.city) = LOWER($${i++})`); params.push(city); }
        if (search) {
            conditions.push(`(LOWER(c.business_name) LIKE LOWER($${i}) OR LOWER(c.contact_name) LIKE LOWER($${i}) OR c.whatsapp LIKE $${i})`);
            params.push(`%${search}%`);
            i++;
        }

        if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
        query += ` ORDER BY c.business_name ASC LIMIT $${i++} OFFSET $${i++}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await db.query(query, params);

        // Summary stats
        const stats = await db.query(`
            SELECT
                COUNT(*) as total_clients,
                COUNT(*) FILTER (WHERE plan_type = 'cloud') as cloud_clients,
                COUNT(*) FILTER (WHERE plan_type = 'cloud_fe') as cloud_fe_clients,
                COUNT(*) FILTER (WHERE plan_type = 'local') as local_clients,
                COUNT(*) FILTER (WHERE payment_status = 'active') as active_clients,
                COUNT(*) FILTER (WHERE payment_status = 'suspended') as suspended_clients,
                COALESCE(SUM(monthly_amount), 0) as expected_monthly
            FROM crm_clients
        `);

        res.json({
            success: true,
            clients: result.rows,
            stats: stats.rows[0],
            count: result.rows.length
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POST /api/clients
// Crear nuevo cliente
// ============================================
router.post('/', async (req, res) => {
    try {
        const {
            business_name, contact_name, whatsapp, email, city, address, nit,
            plan_type, monthly_amount, billing_day, pos_version, server_name,
            cloud_url, anydesk_id, advisor_id, notes, priority, started_at
        } = req.body;

        if (!business_name || !whatsapp) {
            return res.status(400).json({ success: false, error: 'Nombre del negocio y WhatsApp son requeridos' });
        }

        // Default monthly amount by plan
        let amount = monthly_amount;
        if (!amount) {
            if (plan_type === 'cloud') amount = 35000;
            else if (plan_type === 'cloud_fe') amount = 55000;
            else amount = 0;
        }

        const result = await db.query(`
            INSERT INTO crm_clients (
                business_name, contact_name, whatsapp, email, city, address, nit,
                plan_type, monthly_amount, billing_day, pos_version, server_name,
                cloud_url, anydesk_id, advisor_id, notes, priority, started_at, next_billing_date
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
                      DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '27 days')
            RETURNING *
        `, [
            business_name, contact_name, whatsapp, email, city, address, nit,
            plan_type || 'local', amount, billing_day || 28, pos_version,
            server_name, cloud_url, anydesk_id, advisor_id, notes, priority || 'normal',
            started_at || new Date()
        ]);

        // Log activity
        await db.query(`
            INSERT INTO crm_activity_log (client_id, activity_type, description, performed_by)
            VALUES ($1, 'client_created', $2, 'admin')
        `, [result.rows[0].id, `Cliente creado: ${business_name} (${plan_type || 'local'})`]);

        res.status(201).json({ success: true, client: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POST /api/clients/bulk
// Importar clientes masivamente (desde Excel/CSV)
// ============================================
router.post('/bulk', async (req, res) => {
    try {
        const { clients } = req.body;
        if (!clients || !Array.isArray(clients)) {
            return res.status(400).json({ success: false, error: 'Se requiere un array de clientes' });
        }

        let created = 0;
        let skipped = 0;
        const errors = [];

        for (const c of clients) {
            try {
                // Check if already exists
                const exists = await db.query('SELECT id FROM crm_clients WHERE whatsapp = $1 LIMIT 1', [c.whatsapp]);
                if (exists.rows.length > 0) {
                    skipped++;
                    continue;
                }

                let amount = c.monthly_amount;
                if (!amount) {
                    if (c.plan_type === 'cloud') amount = 35000;
                    else if (c.plan_type === 'cloud_fe') amount = 55000;
                    else amount = 0;
                }

                await db.query(`
                    INSERT INTO crm_clients (business_name, contact_name, whatsapp, email, city, plan_type, monthly_amount, cloud_url, notes)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                `, [
                    c.business_name || c.nombre || 'Sin nombre',
                    c.contact_name || c.contacto || null,
                    c.whatsapp || c.telefono || c.phone,
                    c.email || null,
                    c.city || c.ciudad || null,
                    c.plan_type || c.plan || 'cloud',
                    amount,
                    c.cloud_url || c.url || null,
                    c.notes || c.notas || null
                ]);
                created++;
            } catch (e) {
                errors.push({ client: c.business_name, error: e.message });
            }
        }

        res.json({
            success: true,
            message: `Importación completada: ${created} creados, ${skipped} duplicados`,
            created,
            skipped,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET /api/clients/:id
// Detalle de cliente
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const client = await db.query(`
            SELECT c.*, a.name as advisor_name
            FROM crm_clients c
            LEFT JOIN crm_advisors a ON c.advisor_id = a.id
            WHERE c.id = $1
        `, [id]);

        if (client.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
        }

        const payments = await db.query(
            'SELECT * FROM crm_payments WHERE client_id = $1 ORDER BY period_year DESC, period_month DESC LIMIT 24',
            [id]
        );

        const tickets = await db.query(
            'SELECT * FROM crm_tickets WHERE client_id = $1 ORDER BY created_at DESC LIMIT 20',
            [id]
        );

        const activities = await db.query(
            'SELECT * FROM crm_activity_log WHERE client_id = $1 ORDER BY created_at DESC LIMIT 50',
            [id]
        );

        res.json({
            success: true,
            client: client.rows[0],
            payments: payments.rows,
            tickets: tickets.rows,
            activities: activities.rows
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// PUT /api/clients/:id
// Actualizar cliente
// ============================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const fields = req.body;

        const allowedFields = [
            'business_name', 'contact_name', 'whatsapp', 'email', 'city', 'address', 'nit',
            'plan_type', 'monthly_amount', 'billing_day', 'payment_status',
            'pos_version', 'server_name', 'cloud_url', 'anydesk_id',
            'advisor_id', 'distributor_id', 'technician_id', 'notes', 'priority', 'is_active'
        ];

        const updates = [];
        const params = [];
        let i = 1;

        for (const [key, value] of Object.entries(fields)) {
            if (allowedFields.includes(key) && value !== undefined) {
                updates.push(`${key} = $${i++}`);
                params.push(value);
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, error: 'No hay campos para actualizar' });
        }

        updates.push('updated_at = NOW()');
        params.push(parseInt(id));

        const result = await db.query(
            `UPDATE crm_clients SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
            params
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
        }

        res.json({ success: true, client: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET /api/clients/billing/summary
// Resumen de facturación del mes actual
// ============================================
router.get('/billing/summary', async (req, res) => {
    try {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const summary = await db.query(`
            SELECT
                COUNT(DISTINCT c.id) as total_billable_clients,
                COALESCE(SUM(c.monthly_amount), 0) as expected_amount,
                COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) as collected_amount,
                COALESCE(SUM(CASE WHEN p.status IN ('pending', 'overdue') THEN p.amount ELSE 0 END), 0) as pending_amount,
                COUNT(CASE WHEN p.status = 'paid' THEN 1 END) as paid_count,
                COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_count,
                COUNT(CASE WHEN p.status = 'overdue' THEN 1 END) as overdue_count
            FROM crm_clients c
            LEFT JOIN crm_payments p ON p.client_id = c.id
                AND p.period_month = $1 AND p.period_year = $2
            WHERE c.plan_type IN ('cloud', 'cloud_fe')
                AND c.is_active = true
        `, [currentMonth, currentYear]);

        // By plan type
        const byPlan = await db.query(`
            SELECT
                c.plan_type,
                COUNT(*) as client_count,
                SUM(c.monthly_amount) as expected,
                COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) as collected
            FROM crm_clients c
            LEFT JOIN crm_payments p ON p.client_id = c.id
                AND p.period_month = $1 AND p.period_year = $2
            WHERE c.plan_type IN ('cloud', 'cloud_fe') AND c.is_active = true
            GROUP BY c.plan_type
        `, [currentMonth, currentYear]);

        res.json({
            success: true,
            month: currentMonth,
            year: currentYear,
            summary: summary.rows[0],
            by_plan: byPlan.rows
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
