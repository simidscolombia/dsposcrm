/**
 * boldWebhookRoutes.js
 * Endpoint PÚBLICO (sin autenticación de usuario) que recibe notificaciones
 * de la pasarela Bold.co cuando un pago es procesado.
 *
 * Bold envía un POST con información del pago. Cuando detectamos un
 * SALE_APPROVED, marcamos automáticamente el mes como 'paid'.
 */

import express from 'express';
import crypto from 'crypto';
import db from '../config/database.js';

const router = express.Router();

/**
 * POST /api/webhooks/bold
 * Recibe notificaciones de Bold.co sobre transacciones.
 *
 * Bold envía un JSON con estructura:
 * {
 *   "id": "trx-xxx",
 *   "status": "APPROVED" | "REJECTED" | "PENDING" | "VOIDED",
 *   "type": "SALE_APPROVED" | "SALE_REJECTED" | "VOID" | ...,
 *   "reference": "SIMIDS-123-6-2026-...",
 *   "amount": { "total": 35000, "currency": "COP" },
 *   "payment_method": { "type": "CARD", ... },
 *   ...
 * }
 */
router.post('/', async (req, res) => {
    try {
        const payload = req.body;
        const boldSecret = process.env.BOLD_WEBHOOK_SECRET;

        console.log('[Bold Webhook] 📩 Notificación recibida:', JSON.stringify(payload).substring(0, 500));

        // ──────────────────────────────────────
        // 1. Validar firma HMAC si está configurada
        // ──────────────────────────────────────
        if (boldSecret) {
            const signature = req.headers['bold-signature'] || req.headers['x-bold-signature'] || '';
            if (signature) {
                const expectedSignature = crypto
                    .createHmac('sha256', boldSecret)
                    .update(JSON.stringify(payload))
                    .digest('hex');

                if (signature !== expectedSignature) {
                    console.warn('[Bold Webhook] ⚠️ Firma HMAC inválida. Posible intento de suplantación.');
                    return res.status(401).json({ error: 'Firma inválida' });
                }
                console.log('[Bold Webhook] ✅ Firma HMAC válida');
            }
        }

        // ──────────────────────────────────────
        // 2. Extraer datos relevantes del payload
        // ──────────────────────────────────────
        // Bold puede enviar en varios formatos. Intentamos mapear flexiblemente.
        const transactionId = payload.id || payload.transaction_id || payload.payment_id || '';
        const reference = payload.reference || payload.order_reference || '';
        const eventType = payload.type || payload.event || payload.status || '';
        const transactionStatus = payload.status || '';
        const paymentMethodType = payload.payment_method?.type || payload.method || 'bold';
        const amountTotal = payload.amount?.total || payload.amount || 0;

        console.log(`[Bold Webhook] Evento: ${eventType} | Referencia: ${reference} | Estado: ${transactionStatus} | ID: ${transactionId}`);

        // ──────────────────────────────────────
        // 3. Solo procesamos pagos aprobados
        // ──────────────────────────────────────
        const isApproved =
            eventType === 'SALE_APPROVED' ||
            eventType === 'APPROVED' ||
            transactionStatus === 'APPROVED' ||
            eventType === 'payment.approved' ||
            eventType === 'TRANSACTION_APPROVED';

        if (!isApproved) {
            console.log(`[Bold Webhook] Evento ${eventType} no es un pago aprobado. Se ignora.`);
            return res.json({ received: true, action: 'ignored', reason: `Evento ${eventType} no requiere acción` });
        }

        // ──────────────────────────────────────
        // 4. Buscar el mes de facturación por referencia o bold_link_id
        // ──────────────────────────────────────
        let monthRecord = null;

        // Estrategia A: Buscar por la referencia que nosotros generamos (SIMIDS-{id}-{month}-{year}-{ts})
        if (reference) {
            const refResult = await db.query(
                `SELECT * FROM client_billing_months WHERE bold_transaction_id = $1`,
                [reference]
            );
            if (refResult.rows.length > 0) {
                monthRecord = refResult.rows[0];
            }
        }

        // Estrategia B: Si no encontramos por referencia, intentar parsear el ID del billing month desde la referencia
        if (!monthRecord && reference) {
            const match = reference.match(/^SIMIDS-(\d+)-/);
            if (match) {
                const billingMonthId = parseInt(match[1]);
                const idResult = await db.query(
                    `SELECT * FROM client_billing_months WHERE id = $1`,
                    [billingMonthId]
                );
                if (idResult.rows.length > 0) {
                    monthRecord = idResult.rows[0];
                }
            }
        }

        // Estrategia C: Buscar por bold_link_id
        if (!monthRecord && transactionId) {
            const linkResult = await db.query(
                `SELECT * FROM client_billing_months WHERE bold_link_id = $1`,
                [transactionId]
            );
            if (linkResult.rows.length > 0) {
                monthRecord = linkResult.rows[0];
            }
        }

        if (!monthRecord) {
            console.warn('[Bold Webhook] ⚠️ No se encontró un mes de facturación para la referencia:', reference, '| transaction:', transactionId);
            return res.json({ received: true, action: 'unmatched', reason: 'No se encontró un registro asociado' });
        }

        // ──────────────────────────────────────
        // 5. Ya está pagado? No duplicar
        // ──────────────────────────────────────
        if (monthRecord.status === 'paid') {
            console.log(`[Bold Webhook] El mes ${monthRecord.month}/${monthRecord.year} ya estaba marcado como pagado.`);
            return res.json({ received: true, action: 'already_paid' });
        }

        // ──────────────────────────────────────
        // 6. Marcar como pagado
        // ──────────────────────────────────────
        await db.query(`
            UPDATE client_billing_months 
            SET status = 'paid',
                paid_date = NOW(),
                payment_method = $1,
                bold_transaction_id = COALESCE(bold_transaction_id, $2),
                notes = COALESCE(notes, '') || ' | Pago confirmado vía Bold webhook (' || $3 || ')',
                updated_at = NOW()
            WHERE id = $4
        `, [paymentMethodType, reference, transactionId, monthRecord.id]);

        console.log(`[Bold Webhook] ✅ Mes ${monthRecord.month}/${monthRecord.year} del cliente #${monthRecord.client_id} marcado como PAGADO automáticamente.`);

        // ──────────────────────────────────────
        // 7. Log de actividad
        // ──────────────────────────────────────
        await db.query(`
            INSERT INTO crm_activity_log (client_id, activity_type, description, performed_by)
            VALUES ($1, 'bold_payment_confirmed', $2, 'bold_webhook')
        `, [
            monthRecord.client_id,
            `Pago Bold confirmado automáticamente para mes ${monthRecord.month}/${monthRecord.year}. Monto: $${amountTotal}. Transacción: ${transactionId}`
        ]);

        // ──────────────────────────────────────
        // 8. Actualizar estado general del cliente
        // ──────────────────────────────────────
        const pendingCheck = await db.query(
            `SELECT COUNT(*) FROM client_billing_months WHERE client_id = $1 AND status = 'pending'`,
            [monthRecord.client_id]
        );

        const hasPending = parseInt(pendingCheck.rows[0].count) > 0;
        const newClientStatus = hasPending ? 'grace' : 'active';

        await db.query(
            `UPDATE crm_clients SET payment_status = $1, last_payment_date = NOW() WHERE id = $2`,
            [newClientStatus, monthRecord.client_id]
        );

        console.log(`[Bold Webhook] Estado del cliente #${monthRecord.client_id} actualizado a: ${newClientStatus}`);

        return res.json({
            received: true,
            action: 'payment_confirmed',
            billing_month_id: monthRecord.id,
            client_id: monthRecord.client_id,
            period: `${monthRecord.month}/${monthRecord.year}`
        });

    } catch (error) {
        console.error('[Bold Webhook] ❌ Error procesando webhook:', error);
        // Siempre respondemos 200 para que Bold no reintente indefinidamente
        return res.status(200).json({ received: true, action: 'error', error: error.message });
    }
});

/**
 * GET /api/webhooks/bold/health
 * Endpoint de verificación para que Bold confirme que el webhook está activo.
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'SIMIDS CRM Bold Webhook',
        timestamp: new Date().toISOString()
    });
});

export default router;
