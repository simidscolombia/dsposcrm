// backend/src/routes/whatsappRoutes.js
// API routes para gestionar WAHA y enviar mensajes desde el admin

import express from 'express';
import whatsappService from '../services/whatsappService.js';
import db from '../config/database.js';

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
            wahaUrl: process.env.WAHA_URL || 'No configurado'
        });
    } catch (error) {
        res.json({
            success: true,
            connected: false,
            status: 'ERROR',
            error: error.message
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

        const response = await axios.post(`${wahaUrl}/api/sessions/start`, {
            name: sessionName,
            config: {
                proxy: null,
                webhooks: [{
                    url: `${process.env.BACKEND_URL || 'https://dspos.vercel.app'}/api/whatsapp/webhook`,
                    events: ['message', 'session.status']
                }]
            }
        }, {
            headers: { 'X-Api-Key': apiKey }
        });

        res.json({ success: true, session: response.data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
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

        const response = await axios.get(`${wahaUrl}/api/sessions/${sessionName}/auth/qr`, {
            headers: { 'X-Api-Key': apiKey },
            responseType: 'arraybuffer'
        });

        // Return as base64 image
        const base64 = Buffer.from(response.data).toString('base64');
        res.json({
            success: true,
            qr: `data:image/png;base64,${base64}`
        });
    } catch (error) {
        // If SCAN state, session may already be authenticated
        res.json({
            success: false,
            error: error.message,
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

        await axios.post(`${wahaUrl}/api/sessions/stop`, {
            name: sessionName
        }, {
            headers: { 'X-Api-Key': apiKey }
        });

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

        // Guardar mensajes entrantes
        if (event.event === 'message' && event.payload) {
            const from = event.payload.from?.replace('@c.us', '') || 'unknown';
            const body = event.payload.body || '';

            try {
                await db.query(`
                    INSERT INTO crm_whatsapp_log (phone, message, direction, status)
                    VALUES ($1, $2, 'inbound', 'received')
                `, [from, body.substring(0, 500)]);
            } catch (e) { /* */ }
        }

        res.json({ success: true });
    } catch (error) {
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
