// backend/src/routes/whatsappRoutes.js
// API routes para gestionar WAHA y enviar mensajes desde el admin

import express from 'express';
import whatsappService from '../services/whatsappService.js';
import db from '../config/database.js';
import geminiService from '../services/geminiService.js';


const router = express.Router();

// ============================================
// GET /api/whatsapp/status
// Estado de la sesión WAHA
// ============================================
router.get('/status', async (req, res) => {
    try {
        const result = await whatsappService.checkSessionStatus();
        res.json({
            success: true,
            connected: result.success && result.status === 'WORKING',
            status: result.status || 'DISCONNECTED',
            details: result.data || null,
            wahaUrl: process.env.WAHA_URL || 'No configurado',
            config: {
                wahaUrl: process.env.WAHA_URL || 'No configurado',
                hasApiKey: !!process.env.WAHA_API_KEY,
                session: process.env.WAHA_SESSION || 'default',
                configured: !!(process.env.WAHA_URL && process.env.WAHA_API_KEY)
            }
        });
    } catch (error) {
        res.json({
            success: true,
            connected: false,
            status: 'ERROR',
            error: error.message,
            config: {
                wahaUrl: process.env.WAHA_URL || 'No configurado',
                hasApiKey: !!process.env.WAHA_API_KEY,
                session: process.env.WAHA_SESSION || 'default',
                configured: !!(process.env.WAHA_URL && process.env.WAHA_API_KEY)
            }
        });
    }
});

// ============================================
// POST /api/whatsapp/start
// Iniciar sesión WAHA (genera QR)
// ============================================
router.post('/start', async (req, res) => {
    try {
        const axios = (await import('axios')).default;
        const wahaUrl = process.env.WAHA_URL || 'http://localhost:3000';
        const apiKey = process.env.WAHA_API_KEY;
        const sessionName = process.env.WAHA_SESSION || 'default';
        const headers = { 'Content-Type': 'application/json' };
        if (apiKey) headers['X-Api-Key'] = apiKey;

        // Try to create session (WAHA auto-starts it)
        let response;
        try {
            response = await axios.post(`${wahaUrl}/api/sessions`, {
                name: sessionName,
                start: true,
                config: {
                    webhooks: [{
                        url: 'https://dspos.vercel.app/api/whatsapp/webhook',
                        events: ['message', 'session.status']
                    }]
                }
            }, { headers });
        } catch (createErr) {
            // Session might already exist, try starting it
            response = await axios.post(`${wahaUrl}/api/sessions/${sessionName}/start`, {}, { headers });
        }

        res.json({ success: true, session: response.data });
    } catch (error) {
        const detail = error.response?.data || error.message;
        res.status(500).json({ success: false, error: typeof detail === 'string' ? detail : JSON.stringify(detail) });
    }
});

// ============================================
// GET /api/whatsapp/qr
// Obtener QR para escanear
// ============================================
router.get('/qr', async (req, res) => {
    try {
        const axios = (await import('axios')).default;
        const wahaUrl = process.env.WAHA_URL || 'http://localhost:3000';
        const apiKey = process.env.WAHA_API_KEY;
        const sessionName = process.env.WAHA_SESSION || 'default';
        const headers = {};
        if (apiKey) headers['X-Api-Key'] = apiKey;

        // WAHA QR endpoint: /api/{session}/auth/qr
        const response = await axios.get(`${wahaUrl}/api/${sessionName}/auth/qr`, {
            headers,
            responseType: 'arraybuffer',
            timeout: 10000
        });

        const base64 = Buffer.from(response.data).toString('base64');
        res.json({
            success: true,
            qr: `data:image/png;base64,${base64}`
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.response?.data?.message || error.message,
            hint: 'La sesión puede ya estar autenticada o WAHA no está disponible'
        });
    }
});

// ============================================
// POST /api/whatsapp/stop
// Cerrar sesión WAHA
// ============================================
router.post('/stop', async (req, res) => {
    try {
        const axios = (await import('axios')).default;
        const wahaUrl = process.env.WAHA_URL || 'http://localhost:3000';
        const apiKey = process.env.WAHA_API_KEY;
        const sessionName = process.env.WAHA_SESSION || 'default';
        const headers = {};
        if (apiKey) headers['X-Api-Key'] = apiKey;

        await axios.post(`${wahaUrl}/api/sessions/${sessionName}/stop`, {}, { headers });

        res.json({ success: true, message: 'Sesión cerrada' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POST /api/whatsapp/send
// Enviar mensaje manual desde admin
// ============================================
router.post('/send', async (req, res) => {
    try {
        const { phone, message, type = 'text' } = req.body;
        if (!phone || !message) {
            return res.status(400).json({ success: false, error: 'Phone y message son requeridos' });
        }

        const formattedPhone = whatsappService.formatPhoneNumber(phone);
        const result = await whatsappService.sendTextMessage(formattedPhone, message);

        // Log el envío
        try {
            await db.query(`
                INSERT INTO crm_whatsapp_log (phone, message, direction, status)
                VALUES ($1, $2, 'outbound', 'sent')
            `, [formattedPhone, message.substring(0, 500)]);
        } catch (e) { /* log table might not exist */ }

        res.json({ success: true, result });
    } catch (error) {
        // Log the failed attempt
        try {
            await db.query(`
                INSERT INTO crm_whatsapp_log (phone, message, direction, status, error)
                VALUES ($1, $2, 'outbound', 'failed', $3)
            `, [req.body.phone, req.body.message?.substring(0, 500), error.message]);
        } catch (e) { /* */ }

        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POST /api/whatsapp/send-quote
// Enviar cotización completa (texto + PDF)
// ============================================
router.post('/send-quote', async (req, res) => {
    try {
        const { phoneNumber, leadName, prize, total, pdfUrl } = req.body;
        if (!phoneNumber || !leadName) {
            return res.status(400).json({ success: false, error: 'phoneNumber y leadName requeridos' });
        }

        const result = await whatsappService.sendQuoteMessage({
            phoneNumber, leadName, prize, total, pdfUrl
        });

        // Log
        try {
            await db.query(`
                INSERT INTO crm_whatsapp_log (phone, message, direction, status)
                VALUES ($1, $2, 'outbound', $3)
            `, [phoneNumber, `Cotización enviada a ${leadName}`, result.success ? 'sent' : 'failed']);
        } catch (e) { /* */ }

        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POST /api/whatsapp/send-followup
// Enviar seguimiento programado
// ============================================
router.post('/send-followup', async (req, res) => {
    try {
        const { phoneNumber, leadName, prize, day } = req.body;

        let result;
        if (day === 1) {
            result = await whatsappService.sendFollowUpDay1(phoneNumber, leadName);
        } else if (day === 3) {
            result = await whatsappService.sendFollowUpDay3(phoneNumber, leadName, prize);
        } else {
            return res.status(400).json({ success: false, error: 'day debe ser 1 o 3' });
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET /api/whatsapp/logs
// Historial de mensajes enviados
// ============================================
router.get('/logs', async (req, res) => {
    try {
        // Auto-create log table
        await db.query(`
            CREATE TABLE IF NOT EXISTS crm_whatsapp_log (
                id SERIAL PRIMARY KEY,
                phone VARCHAR(20),
                message TEXT,
                direction VARCHAR(10) DEFAULT 'outbound',
                status VARCHAR(20) DEFAULT 'sent',
                error TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        const { limit = 50 } = req.query;
        const result = await db.query(
            'SELECT * FROM crm_whatsapp_log ORDER BY created_at DESC LIMIT $1',
            [parseInt(limit)]
        );

        res.json({ success: true, logs: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POST /api/whatsapp/webhook
// Recibir eventos de WAHA (mensajes entrantes, etc.)
// ============================================
router.post('/webhook', async (req, res) => {
    try {
        const event = req.body;
        console.log('📨 WAHA Webhook:', event.event, event.payload?.from);

        // Guardar mensajes entrantes y procesar
        if (event.event === 'message' && event.payload) {
            const from = event.payload.from?.replace('@c.us', '') || 'unknown';
            const body = event.payload.body || '';

            // 1. Log en base de datos
            try {
                await db.query(`
                    INSERT INTO crm_whatsapp_log (phone, message, direction, status)
                    VALUES ($1, $2, 'inbound', 'received')
                `, [from, body.substring(0, 500)]);
            } catch (e) { /* */ }

            // 2. Normalizar número para buscar cliente
            let cleanPhone = from;
            if (from.startsWith('57') && from.length === 12) {
                cleanPhone = from.substring(2);
            }

            // 3. Buscar cliente activo
            const clientRes = await db.query(`
                SELECT * FROM crm_clients 
                WHERE whatsapp LIKE $1 AND is_active = true
                LIMIT 1
            `, [`%${cleanPhone}%`]);

            if (clientRes.rows.length > 0) {
                const client = clientRes.rows[0];
                console.log(`[WAHA Webhook] Cliente identificado: ${client.business_name} (ID: ${client.id})`);

                // 4. Obtener mes pendiente más antiguo
                const monthRes = await db.query(`
                    SELECT * FROM client_billing_months
                    WHERE client_id = $1 AND status = 'pending'
                    ORDER BY year ASC, month ASC
                    LIMIT 1
                `, [client.id]);
                
                const pendingMonth = monthRes.rows.length > 0 ? monthRes.rows[0] : null;

                // Si no hay link de Bold y hay mes pendiente, generamos link de cobro Bold preventivamente
                if (pendingMonth && !pendingMonth.bold_link_url) {
                    try {
                        const boldService = (await import('../services/boldService.js')).default;
                        const boldRes = await boldService.crearLinkPagoBold({
                            billingMonthId: pendingMonth.id,
                            businessName: client.business_name,
                            nit: client.nit,
                            amount: pendingMonth.amount,
                            month: pendingMonth.month,
                            year: pendingMonth.year
                        });

                        if (boldRes.success) {
                            pendingMonth.bold_link_url = boldRes.payment_url;
                            pendingMonth.bold_link_id = boldRes.link_id;
                            pendingMonth.bold_transaction_id = boldRes.reference;
                            
                            await db.query(`
                                UPDATE client_billing_months 
                                SET bold_link_id = $1, 
                                    bold_link_url = $2,
                                    bold_transaction_id = $3,
                                    updated_at = NOW()
                                WHERE id = $4
                            `, [boldRes.link_id, boldRes.payment_url, boldRes.reference, pendingMonth.id]);
                        }
                    } catch (boldErr) {
                        console.error('[WAHA Webhook] Error al auto-generar link Bold:', boldErr.message);
                    }
                }

                // 5. Procesar conversación con Gemini
                const aiResult = await geminiService.handleBillingConversation(client, pendingMonth, body);
                
                console.log(`[WAHA Webhook] Gemini respuesta: "${aiResult.response}" | Acción: ${aiResult.action}`);

                // 6. Ejecutar acción de IA
                if (aiResult.action === 'request_courtesy' && pendingMonth) {
                    // Crear alerta de cortesía en base de datos
                    await db.query(`
                        INSERT INTO crm_billing_alerts (client_id, billing_month_id, alert_type, reason, status)
                        VALUES ($1, $2, 'courtesy_request', $3, 'pending')
                        ON CONFLICT DO NOTHING
                    `, [client.id, pendingMonth.id, 'courtesy_request', `Cliente solicita mes de cortesía para el período ${pendingMonth.month}/${pendingMonth.year}. Mensaje: "${body}"`]);
                    
                    console.log(`[WAHA Webhook] 🔵 Registrada alerta de solicitud de cortesía para cliente #${client.id}`);
                }

                // 7. Enviar la respuesta vía WhatsApp al cliente
                const responsePhone = whatsappService.formatPhoneNumber(from);
                await whatsappService.sendTextMessage(responsePhone, aiResult.response);

                // Log el mensaje saliente
                try {
                    await db.query(`
                        INSERT INTO crm_whatsapp_log (phone, message, direction, status)
                        VALUES ($1, $2, 'outbound', 'sent')
                    `, [responsePhone, aiResult.response.substring(0, 500)]);
                } catch (e) { /* */ }
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error('[WAHA Webhook] Error en webhook:', error);
        res.json({ success: true }); // Always respond 200 to webhooks
    }
});

// ============================================
// GET /api/whatsapp/config
// Config actual de WAHA
// ============================================
router.get('/config', (req, res) => {
    res.json({
        success: true,
        config: {
            wahaUrl: process.env.WAHA_URL || 'No configurado',
            hasApiKey: !!process.env.WAHA_API_KEY,
            session: process.env.WAHA_SESSION || 'default',
            configured: !!(process.env.WAHA_URL && process.env.WAHA_API_KEY)
        }
    });
});

export default router;
