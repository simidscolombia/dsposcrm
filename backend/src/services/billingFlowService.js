/**
 * billingFlowService.js
 * Servicio unificado para el procesamiento de pagos confirmados.
 * Maneja la sincronización entre CRM (PostgreSQL), Admin POS (MongoDB) y WhatsApp.
 */

import db from '../config/database.js';
import adminService from './adminService.js';
import whatsappService from './whatsappService.js';
import jwt from 'jsonwebtoken';

class BillingFlowService {
    /**
     * Procesa un pago exitoso confirmado (desde Bold, Wompi o Pago Manual)
     * @param {Object} params
     * @param {number} params.billingMonthId - ID de client_billing_months (opcional si se pasan clientId, year, month)
     * @param {number} params.clientId - ID del cliente (opcional si se pasa billingMonthId)
     * @param {number} params.year - Año (opcional si se pasa billingMonthId)
     * @param {number} params.month - Mes (opcional si se pasa billingMonthId)
     * @param {string} params.paymentMethod - 'bold' | 'wompi' | 'transferencia' | etc.
     * @param {string} params.gatewayTransactionId - ID de transacción de la pasarela (opcional)
     * @param {string} params.reference - Referencia de pago única (opcional)
     * @param {number} params.amount - Monto pagado (opcional)
     */
    async processSuccessfulPayment({
        billingMonthId,
        clientId,
        year,
        month,
        paymentMethod,
        gatewayTransactionId = '',
        reference = '',
        amount = null
    }) {
        try {
            console.log(`[BillingFlowService] 🔄 Iniciando procesamiento de pago exitoso. Método: ${paymentMethod}, Ref: ${reference}`);

            let monthRecord = null;
            let finalBillingMonthId = billingMonthId;
            let finalClientId = clientId;
            let finalYear = year;
            let finalMonth = month;

            // 1. Obtener la información del mes y cliente en PostgreSQL
            if (finalBillingMonthId) {
                const monthRes = await db.query(
                    `SELECT b.*, c.business_name, c.nit, c.whatsapp, c.has_electronic_billing 
                     FROM client_billing_months b
                     JOIN crm_clients c ON b.client_id = c.id
                     WHERE b.id = $1`,
                    [finalBillingMonthId]
                );
                if (monthRes.rows.length > 0) {
                    monthRecord = monthRes.rows[0];
                    finalClientId = monthRecord.client_id;
                    finalYear = monthRecord.year;
                    finalMonth = monthRecord.month;
                }
            } else if (finalClientId && finalYear && finalMonth) {
                const monthRes = await db.query(
                    `SELECT b.*, c.business_name, c.nit, c.whatsapp, c.has_electronic_billing 
                     FROM client_billing_months b
                     JOIN crm_clients c ON b.client_id = c.id
                     WHERE b.client_id = $1 AND b.year = $2 AND b.month = $3`,
                    [finalClientId, finalYear, finalMonth]
                );
                if (monthRes.rows.length > 0) {
                    monthRecord = monthRes.rows[0];
                    finalBillingMonthId = monthRecord.id;
                }
            }

            if (!monthRecord) {
                // Si no hay registro de client_billing_months, necesitamos buscar los datos del cliente al menos
                const clientRes = await db.query('SELECT business_name, nit, whatsapp, has_electronic_billing FROM crm_clients WHERE id = $1', [finalClientId]);
                if (clientRes.rows.length === 0) {
                    throw new Error(`Cliente #${finalClientId} no encontrado`);
                }
                const client = clientRes.rows[0];
                monthRecord = {
                    client_id: finalClientId,
                    year: finalYear,
                    month: finalMonth,
                    amount: amount,
                    business_name: client.business_name,
                    nit: client.nit,
                    whatsapp: client.whatsapp,
                    has_electronic_billing: client.has_electronic_billing
                };
            }

            const clientName = monthRecord.business_name;
            const clientNit = monthRecord.nit;
            const clientWhatsapp = monthRecord.whatsapp;
            const hasElectronicBilling = monthRecord.has_electronic_billing === true;
            const paymentAmount = amount || monthRecord.amount || 0;
            const periodStr = `${finalMonth.toString().padStart(2, '0')}/${finalYear}`;

            console.log(`[BillingFlowService] Cliente: ${clientName} | Período: ${periodStr} | Monto: $${paymentAmount} | F.E: ${hasElectronicBilling}`);

            // Evitar duplicados: Si ya está pagado en client_billing_months
            if (monthRecord.id && monthRecord.status === 'paid') {
                console.log(`[BillingFlowService] El período ${periodStr} ya estaba marcado como pagado en client_billing_months.`);
            } else {
                // 2. Si el mes no tiene factura vinculada en Admin POS, crear una de forma automática (credito: true por defecto)
                let adminInvoiceId = monthRecord.admin_invoice_id;
                let adminInvoiceNum = monthRecord.admin_invoice_num;

                if (!adminInvoiceId) {
                    console.log(`[BillingFlowService] Factura en Admin POS no existe para período ${periodStr}. Creando...`);
                    const descFactura = `Mensualidad POS Cloud SIMIDS - Mes ${periodStr}`;
                    const createRes = await adminService.crearFacturaMensualidad({
                        nit: clientNit,
                        nombre_cliente: clientName,
                        monto: paymentAmount,
                        descripcion: descFactura,
                        mes: finalMonth,
                        anio: finalYear,
                        metodo_pago: paymentMethod,
                        generar_electronica: hasElectronicBilling
                    });

                    if (createRes.ok) {
                        adminInvoiceId = createRes.factura.id;
                        adminInvoiceNum = createRes.factura.numero;
                        console.log(`[BillingFlowService] Factura pre-creada en Admin POS. ID: ${adminInvoiceId}, Num: ${adminInvoiceNum}`);
                    } else {
                        console.error(`[BillingFlowService] ⚠️ No se pudo pre-crear factura en Admin POS: ${createRes.msg}`);
                    }
                }

                // 3. Actualizar estado del mes en client_billing_months a 'paid'
                if (finalBillingMonthId) {
                    let notesUpdate = ` | Pago confirmado vía ${paymentMethod}`;
                    if (gatewayTransactionId) notesUpdate += ` (Tx: ${gatewayTransactionId})`;
                    if (reference) notesUpdate += ` (Ref: ${reference})`;

                    await db.query(`
                        UPDATE client_billing_months
                        SET status = 'paid',
                            paid_date = NOW(),
                            payment_method = $1,
                            bold_transaction_id = COALESCE(bold_transaction_id, $2),
                            bold_link_id = COALESCE(bold_link_id, $3),
                            admin_invoice_id = COALESCE(admin_invoice_id, $4),
                            admin_invoice_num = COALESCE(admin_invoice_num, $5),
                            notes = COALESCE(notes, '') || $6,
                            updated_at = NOW()
                        WHERE id = $7
                    `, [
                        paymentMethod,
                        paymentMethod === 'bold' ? gatewayTransactionId : null,
                        paymentMethod === 'bold' ? reference : null,
                        adminInvoiceId,
                        adminInvoiceNum,
                        notesUpdate,
                        finalBillingMonthId
                    ]);
                    console.log(`[BillingFlowService] client_billing_months actualizado a 'paid'`);
                }

                // 4. Actualizar tabla legacy crm_payments si existe el registro o crear uno
                let checkCrmPayment = await db.query(
                    `SELECT id, status FROM crm_payments WHERE client_id = $1 AND period_month = $2 AND period_year = $3`,
                    [finalClientId, finalMonth, finalYear]
                );

                let notesPayment = `Pago confirmado vía ${paymentMethod}`;
                if (gatewayTransactionId) notesPayment += ` (Tx: ${gatewayTransactionId})`;

                if (checkCrmPayment.rows.length > 0) {
                    const crmPayment = checkCrmPayment.rows[0];
                    if (crmPayment.status !== 'paid') {
                        await db.query(`
                            UPDATE crm_payments
                            SET status = 'paid',
                                payment_method = $1,
                                payment_date = NOW(),
                                wompi_transaction_id = CASE WHEN $1 = 'wompi' THEN $2 ELSE wompi_transaction_id END,
                                wompi_reference = CASE WHEN $1 = 'wompi' THEN $3 ELSE wompi_reference END,
                                notes = COALESCE(notes, '') || ' | ' || $4,
                                updated_at = NOW()
                            WHERE id = $5
                        `, [paymentMethod, gatewayTransactionId, reference, notesPayment, crmPayment.id]);
                        console.log(`[BillingFlowService] crm_payments legacy actualizado a 'paid'`);
                    }
                } else {
                    // Si no existe el registro en crm_payments, lo insertamos para mantener coherencia
                    await db.query(`
                        INSERT INTO crm_payments (
                            client_id, period_month, period_year, amount, status, 
                            payment_method, payment_date, wompi_transaction_id, wompi_reference, notes
                        ) VALUES ($1, $2, $3, $4, 'paid', $5, NOW(), $6, $7, $8)
                    `, [
                        finalClientId, finalMonth, finalYear, paymentAmount, paymentMethod,
                        paymentMethod === 'wompi' ? gatewayTransactionId : null,
                        paymentMethod === 'wompi' ? reference : null,
                        notesPayment
                    ]);
                    console.log(`[BillingFlowService] Nuevo registro insertado en crm_payments`);
                }

                // 5. Actualizar estado de la factura en el Admin POS a pagada (credito: false, registrar payments)
                if (adminInvoiceId) {
                    console.log(`[BillingFlowService] Marcando factura ${adminInvoiceId} como pagada en Admin POS...`);
                    const payRes = await adminService.marcarFacturaPagada(adminInvoiceId, paymentMethod);
                    if (payRes.ok) {
                        console.log(`[BillingFlowService] Factura marcada como pagada en Admin POS.`);
                    } else {
                        console.error(`[BillingFlowService] ⚠️ Error marcando factura como pagada en Admin POS: ${payRes.msg}`);
                    }
                }

                // 6. Si el cliente tiene F.E., emitir a la DIAN a través de Dataico
                let dianSuccess = false;
                let dianInfo = null;

                if (adminInvoiceId && hasElectronicBilling) {
                    console.log(`[BillingFlowService] Emitiendo Factura Electrónica a la DIAN para factura ${adminInvoiceId}...`);
                    const dianRes = await adminService.emitirFacturaElectronica(adminInvoiceId);
                    if (dianRes.ok) {
                        dianSuccess = true;
                        dianInfo = {
                            cufe: dianRes.cufe,
                            pdf_url: dianRes.pdf_url,
                            numero_dian: dianRes.number,
                            prefijo: dianRes.prefix
                        };
                        console.log(`[BillingFlowService] Factura Electrónica emitida con éxito. CUFE: ${dianRes.cufe}`);
                    } else {
                        console.error(`[BillingFlowService] ⚠️ Error emitiendo factura electrónica a la DIAN:`, dianRes.msg || dianRes.errors);
                    }
                }

                // 7. Enviar WhatsApp de confirmación de pago y PDF
                if (clientWhatsapp) {
                    const phoneFormatted = whatsappService.formatPhoneNumber(clientWhatsapp);
                    
                    // Elegir PDF URL: Si la DIAN fue exitosa, usar el PDF de Dataico.
                    // Si no, usar el proxy PDF del CRM que genera el PDF local del POS.
                    let pdfUrl = null;
                    if (dianSuccess && dianInfo?.pdf_url) {
                        pdfUrl = dianInfo.pdf_url;
                    } else if (adminInvoiceId) {
                        // Generar token firmado
                        const token = jwt.sign(
                            { id: 0, role: 'admin', username: 'system' }, 
                            process.env.JWT_SECRET || 'secret_pos_2025',
                            { expiresIn: '30d' }
                        );
                        const baseUrl = process.env.CRM_URL || 'http://localhost:4050';
                        pdfUrl = `${baseUrl}/api/billing/admin-invoices/${adminInvoiceId}/pdf?token=${token}`;
                    }

                    const cleanAmountStr = parseFloat(paymentAmount).toLocaleString('es-CO');
                    let waMessage = `✅ *PAGO CONFIRMADO* — SIMIDS POS\n\n¡Hola, ${clientName}! 👋\n\nTe confirmamos que hemos recibido con éxito tu pago de *$${cleanAmountStr}* correspondiente a la mensualidad de tu servicio POS Cloud para el período *${periodStr}*.\n\n`;
                    
                    if (dianSuccess && dianInfo) {
                        waMessage += `📄 *Factura Electrónica Oficial DIAN*\nPrefijo: ${dianInfo.prefijo} | Número: ${dianInfo.numero_dian}\nCUFE: ${dianInfo.cufe}\n\n`;
                    }
                    
                    waMessage += `Adjunto en este chat encontrarás el archivo PDF correspondiente.\n\n¡Gracias por estar al día y por confiar en nosotros! 🚀`;

                    try {
                        console.log(`[BillingFlowService] Enviando confirmación WhatsApp a ${phoneFormatted}...`);
                        await whatsappService.sendTextMessage(phoneFormatted, waMessage);
                        
                        if (pdfUrl) {
                            await new Promise(r => setTimeout(r, 2000));
                            const pdfName = dianSuccess ? `Factura_Electronica_${periodStr.replace('/', '_')}.pdf` : `Factura_POS_${periodStr.replace('/', '_')}.pdf`;
                            await whatsappService.sendDocument(phoneFormatted, pdfUrl, pdfName);
                        }

                        // Guardar en log de WhatsApp
                        await db.query(`
                            INSERT INTO crm_whatsapp_log (phone, message, direction, status)
                            VALUES ($1, $2, 'outbound', 'sent')
                        `, [phoneFormatted, `Confirmación de pago enviada para mes ${periodStr}`]);
                    } catch (waErr) {
                        console.error('[BillingFlowService] Error enviando WhatsApp:', waErr.message);
                    }
                }

                // 8. Log de actividad general
                await db.query(`
                    INSERT INTO crm_activity_log (client_id, activity_type, description, performed_by)
                    VALUES ($1, 'payment_flow_completed', $2, 'billing_flow_service')
                `, [
                    finalClientId,
                    `Flujo de facturación completado para mes ${periodStr} (${paymentMethod}). Monto: $${paymentAmount}. DIAN emitido: ${dianSuccess}`
                ]);

                // 9. Actualizar estado general del cliente
                const pendingCheck = await db.query(
                    `SELECT COUNT(*) FROM client_billing_months WHERE client_id = $1 AND status = 'pending'`,
                    [finalClientId]
                );
                const hasPending = parseInt(pendingCheck.rows[0].count) > 0;
                const newClientStatus = hasPending ? 'grace' : 'active';

                await db.query(
                    `UPDATE crm_clients SET payment_status = $1, last_payment_date = NOW() WHERE id = $2`,
                    [newClientStatus, finalClientId]
                );
                console.log(`[BillingFlowService] Estado del cliente #${finalClientId} actualizado a: ${newClientStatus}`);
            }

            return {
                success: true,
                client_id: finalClientId,
                period: periodStr,
                amount: paymentAmount
            };

        } catch (error) {
            console.error('[BillingFlowService] ❌ Error en processSuccessfulPayment:', error);
            throw error;
        }
    }
}

export default new BillingFlowService();
