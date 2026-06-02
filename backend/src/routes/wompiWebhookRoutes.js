// backend/src/routes/wompiWebhookRoutes.js
// Ruta PÚBLICA (sin autenticación) para recibir eventos de Wompi

import express from 'express';
import db from '../config/database.js';
import wompiService from '../services/wompiService.js';

const router = express.Router();

// ============================================
// POST /api/webhooks/wompi
// Webhook público para recibir eventos de Wompi
// ============================================
router.post('/', async (req, res) => {
    try {
        const event = req.body;
        console.log('📨 Wompi Webhook recibido:', JSON.stringify(event.event, null, 2));

        // Verificar firma del webhook
        const checksum = event.signature?.checksum;
        if (checksum && wompiService.getEventsSecret()) {
            const isValid = wompiService.verifyWebhookSignature(event, checksum);
            if (!isValid) {
                console.warn('⚠️ Firma de webhook inválida');
                return res.status(401).json({ error: 'Invalid signature' });
            }
        }

        // Solo procesar transacciones aprobadas
        if (event.event === 'transaction.updated') {
            const transaction = event.data?.transaction;
            
            if (!transaction) {
                return res.status(200).json({ message: 'No transaction data' });
            }

            const txStatus = transaction.status;
            const txReference = transaction.reference;
            const txId = transaction.id;
            const txAmount = transaction.amount_in_cents ? transaction.amount_in_cents / 100 : 0;

            console.log(`💳 Transacción ${txId}: Estado=${txStatus}, Ref=${txReference}, Monto=$${txAmount}`);

            if (txStatus === 'APPROVED') {
                // Buscar el pago por referencia de Wompi
                const payResult = await db.query(`
                    SELECT p.*, c.business_name 
                    FROM crm_payments p 
                    JOIN crm_clients c ON p.client_id = c.id
                    WHERE p.wompi_reference = $1 OR p.wompi_link_id = $2
                `, [txReference, transaction.payment_link_id]);

                if (payResult.rows.length > 0) {
                    const payment = payResult.rows[0];

                    // Marcar como pagado
                    await db.query(`
                        UPDATE crm_payments 
                        SET status = 'paid', 
                            payment_method = 'wompi',
                            payment_date = NOW(),
                            wompi_transaction_id = $1,
                            notes = COALESCE(notes, '') || ' | Pago Wompi confirmado automáticamente',
                            updated_at = NOW()
                        WHERE id = $2
                    `, [txId, payment.id]);

                    // Reactivar cliente
                    await db.query(`
                        UPDATE crm_clients 
                        SET payment_status = 'active', last_payment_date = NOW()
                        WHERE id = $1
                    `, [payment.client_id]);

                    // Log
                    await db.query(`
                        INSERT INTO crm_activity_log (client_id, activity_type, description, metadata, performed_by)
                        VALUES ($1, 'wompi_payment_confirmed', $2, $3, 'wompi_webhook')
                    `, [
                        payment.client_id,
                        `✅ Pago de $${txAmount} confirmado automáticamente vía Wompi para ${payment.period_month}/${payment.period_year}`,
                        JSON.stringify({ transaction_id: txId, reference: txReference, amount: txAmount })
                    ]);

                    console.log(`✅ Pago #${payment.id} de ${payment.business_name} marcado como PAGADO`);
                } else {
                    console.warn(`⚠️ No se encontró pago para referencia: ${txReference}`);
                }
            } else if (txStatus === 'DECLINED' || txStatus === 'ERROR' || txStatus === 'VOIDED') {
                // Log de transacción fallida
                const payResult = await db.query(`
                    SELECT p.client_id FROM crm_payments p 
                    WHERE p.wompi_reference = $1 OR p.wompi_link_id = $2
                `, [txReference, transaction.payment_link_id]);

                if (payResult.rows.length > 0) {
                    await db.query(`
                        INSERT INTO crm_activity_log (client_id, activity_type, description, metadata, performed_by)
                        VALUES ($1, 'wompi_payment_failed', $2, $3, 'wompi_webhook')
                    `, [
                        payResult.rows[0].client_id,
                        `❌ Transacción Wompi ${txStatus}: $${txAmount}`,
                        JSON.stringify({ transaction_id: txId, status: txStatus, reference: txReference })
                    ]);
                }
            }
        }

        // Siempre responder 200 para que Wompi no reintente
        res.status(200).json({ success: true, message: 'Webhook procesado' });

    } catch (error) {
        console.error('❌ Error en Wompi Webhook:', error);
        // Aun con error, responder 200 para evitar reintentos
        res.status(200).json({ success: false, error: error.message });
    }
});

export default router;
