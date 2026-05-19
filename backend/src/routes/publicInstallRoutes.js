import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// ============================================
// GET /api/public/install/validate/:token
// Validar un token de instalación temporal públicamente
// ============================================
router.get('/validate/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const tokReq = await db.query(
            'SELECT * FROM install_tokens WHERE token = $1 AND used = false AND expires_at > NOW()',
            [token]
        );

        if (tokReq.rows.length === 0) {
            return res.status(400).json({ success: false, error: 'Token inválido, expirado o ya utilizado' });
        }

        res.json({
            success: true,
            install_type: tokReq.rows[0].install_type,
            expires_at: tokReq.rows[0].expires_at
        });
    } catch (error) {
        console.error('Error validating token:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POST /api/public/install/submit/:token
// Crear cliente desde el link compartible de provisión pública
// ============================================
router.post('/submit/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const {
            business_name, contact_name, whatsapp, email, city, address, nit, legal_representative,
            plan_type, monthly_amount, pos_version, server_name,
            cloud_url, anydesk_id, install_type, subdomain, server_id, cluster_id, db_name
        } = req.body;

        // Verify token
        const tokReq = await db.query(
            'SELECT * FROM install_tokens WHERE token = $1 AND used = false AND expires_at > NOW()',
            [token]
        );

        if (tokReq.rows.length === 0) {
            return res.status(400).json({ success: false, error: 'Token de instalación inválido o expirado' });
        }

        if (!business_name || !whatsapp) {
            return res.status(400).json({ success: false, error: 'Nombre de negocio y WhatsApp son obligatorios' });
        }

        // Default monthly amount
        let amount = monthly_amount || 0;
        if (!amount) {
            if (plan_type === 'cloud') amount = 35000;
            else if (plan_type === 'cloud_fe') amount = 55000;
        }

        // Insert into crm_clients
        const result = await db.query(`
            INSERT INTO crm_clients (
                business_name, contact_name, whatsapp, email, city, address, nit, legal_representative,
                plan_type, monthly_amount, billing_day, pos_version, server_name,
                cloud_url, anydesk_id, started_at, next_billing_date,
                install_type, subdomain, server_id, cluster_id, db_name, is_active
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, 28, $11, $12, $13, $14, NOW(),
                      DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '27 days',
                      $15,$16,$17,$18,$19, true)
            RETURNING *
        `, [
            business_name, contact_name, whatsapp, email, city, address, nit, legal_representative,
            plan_type || 'local', amount, pos_version || 'v1.0.0', server_name || null,
            cloud_url || null, anydesk_id || null,
            install_type || 'local_pc', subdomain || null, server_id || null, cluster_id || null, db_name || null
        ]);

        const newClientId = result.rows[0].id;

        // Mark token as used
        await db.query(
            'UPDATE install_tokens SET used = true, client_id = $1 WHERE id = $2',
            [newClientId, tokReq.rows[0].id]
        );

        // Log activity
        await db.query(`
            INSERT INTO crm_activity_log (client_id, activity_type, description, performed_by)
            VALUES ($1, 'client_created', $2, 'public_wizard')
        `, [newClientId, `Cliente auto-provisionado vía Link Técnico: ${business_name} (${install_type})`]);

        res.status(201).json({
            success: true,
            message: 'Instalación registrada con éxito',
            client: result.rows[0]
        });
    } catch (error) {
        console.error('Error public submit:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
