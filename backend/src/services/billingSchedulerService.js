/**
 * billingSchedulerService.js
 * Servicio en segundo plano para verificar cobros pendientes y enviar
 * notificaciones automáticas por WhatsApp en los días 28, 1, 3 y 5 de cada mes.
 */

import db from '../config/database.js';
import adminService from './adminService.js';
import boldService from './boldService.js';
import whatsappService from './whatsappService.js';
import jwt from 'jsonwebtoken';

class BillingSchedulerService {
    constructor() {
        this.interval = null;
    }

    /**
     * Inicia el planificador periódico de recordatorios
     */
    start() {
        console.log('[BillingScheduler] 🚀 Iniciando servicio de cobros automáticos...');
        
        // Ejecución inmediata 10 segundos después del arranque
        setTimeout(() => {
            this.runProcess();
        }, 10000);

        // Ejecutar cada 1 hora (3600000 ms)
        this.interval = setInterval(() => {
            this.runProcess();
        }, 3600000);
    }

    /**
     * Detiene el planificador
     */
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            console.log('[BillingScheduler] 🛑 Servicio de cobros automáticos detenido.');
        }
    }

    /**
     * Ejecuta el proceso de sincronización y envío de alertas de cobro
     */
    async runProcess() {
        try {
            console.log('[BillingScheduler] 🔄 Ejecutando verificación de cobros...');
            
            // 1. Asegurar generación de meses pendientes
            await db.query('SELECT generate_pending_months()');

            const today = new Date();
            const currentDay = today.getDate();
            const currentMonth = today.getMonth() + 1; // 1-12
            const currentYear = today.getFullYear();

            // 2. Determinar acciones basadas en el día del mes
            if (currentDay >= 28) {
                // Notificar sobre el período SIGUIENTE (Día 28 preventivo)
                let targetMonth = currentMonth + 1;
                let targetYear = currentYear;
                if (targetMonth > 12) {
                    targetMonth = 1;
                    targetYear += 1;
                }
                await this.processReminders(targetYear, targetMonth, 28);
            }
            
            if (currentDay === 1 || currentDay === 2) {
                // Notificar día de vencimiento (Día 1)
                await this.processReminders(currentYear, currentMonth, 1);
            }
            
            if (currentDay === 3 || currentDay === 4) {
                // Segundo recordatorio (Día 3)
                await this.processReminders(currentYear, currentMonth, 3);
            }
            
            if (currentDay >= 5) {
                // Alerta de mora y potencial suspensión (Día 5)
                await this.processReminders(currentYear, currentMonth, 5);
            }

            console.log('[BillingScheduler] ✅ Verificación finalizada.');

        } catch (error) {
            console.error('[BillingScheduler] ❌ Error en ejecución del scheduler:', error);
        }
    }

    /**
     * Procesa y envía recordatorios para un año, mes y día de trigger específico
     */
    async processReminders(year, month, triggerDay) {
        try {
            const flagField = `reminder_day${triggerDay}_sent`;
            
            // Buscar meses pendientes que no tengan este recordatorio enviado
            const query = `
                SELECT b.*, c.business_name, c.whatsapp, c.nit, c.has_electronic_billing
                FROM client_billing_months b
                JOIN crm_clients c ON b.client_id = c.id
                WHERE b.year = $1 
                  AND b.month = $2 
                  AND b.status = 'pending'
                  AND b.${flagField} = false
                  AND c.is_active = true
            `;

            const result = await db.query(query, [year, month]);
            const pendingList = result.rows;

            if (pendingList.length === 0) {
                return;
            }

            console.log(`[BillingScheduler] 📨 Detectados ${pendingList.length} clientes pendientes para recordatorio Día ${triggerDay} (${month}/${year}).`);

            for (const billingData of pendingList) {
                try {
                    await this.sendSingleReminder(billingData, triggerDay, flagField);
                } catch (err) {
                    console.error(`[BillingScheduler] Error procesando cliente #${billingData.client_id} (${billingData.business_name}):`, err.message);
                }
            }

        } catch (error) {
            console.error(`[BillingScheduler] Error procesando recordatorios Día ${triggerDay}:`, error.message);
        }
    }

    /**
     * Genera links de cobro, facturas y envía el mensaje de WhatsApp a un cliente
     */
    async sendSingleReminder(billingData, triggerDay, flagField) {
        let boldLinkUrl = billingData.bold_link_url;
        let boldLinkId = billingData.bold_link_id;
        let boldTransactionId = billingData.bold_transaction_id;
        
        let adminInvoiceId = billingData.admin_invoice_id;
        let adminInvoiceNum = billingData.admin_invoice_num;

        // 1. Generar Link Bold si no existe
        if (!boldLinkUrl) {
            console.log(`[BillingScheduler] Generando link Bold para cliente #${billingData.client_id}...`);
            const boldRes = await boldService.crearLinkPagoBold({
                billingMonthId: billingData.id,
                businessName: billingData.business_name,
                nit: billingData.nit,
                amount: billingData.amount,
                month: billingData.month,
                year: billingData.year
            });

            if (boldRes.success) {
                boldLinkUrl = boldRes.payment_url;
                boldLinkId = boldRes.link_id;
                boldTransactionId = boldRes.reference;
                
                await db.query(`
                    UPDATE client_billing_months 
                    SET bold_link_id = $1, 
                        bold_link_url = $2,
                        bold_transaction_id = $3,
                        updated_at = NOW()
                    WHERE id = $4
                `, [boldLinkId, boldLinkUrl, boldTransactionId, billingData.id]);
            } else {
                throw new Error(`Fallo creación del link de pago Bold: ${boldRes.error}`);
            }
        }

        // 2. Generar Factura en admin.poslatino.com si no existe (y no es día 3 o 5 para evitar re-generar)
        if (!adminInvoiceId && (triggerDay === 28 || triggerDay === 1)) {
            console.log(`[BillingScheduler] Generando factura en admin para cliente #${billingData.client_id}...`);
            const descFactura = `Mensualidad POS Cloud SIMIDS - Mes ${billingData.month}/${billingData.year}`;
            
            const adminRes = await adminService.crearFacturaMensualidad({
                nit: billingData.nit,
                nombre_cliente: billingData.business_name,
                monto: billingData.amount,
                descripcion: descFactura,
                mes: billingData.month,
                anio: billingData.year,
                metodo_pago: 'bold',
                generar_electronica: billingData.has_electronic_billing === true
            });

            if (adminRes.ok) {
                adminInvoiceId = adminRes.factura.id;
                adminInvoiceNum = adminRes.factura.numero;

                await db.query(`
                    UPDATE client_billing_months 
                    SET admin_invoice_id = $1, 
                        admin_invoice_num = $2,
                        updated_at = NOW()
                    WHERE id = $3
                `, [adminInvoiceId, adminInvoiceNum, billingData.id]);
            } else {
                console.warn(`[BillingScheduler] ⚠️ No se pudo pre-crear factura en admin: ${adminRes.msg}. Se continuará solo con link de pago.`);
            }
        }

        // 3. Obtener URL del PDF de la factura proxy para WhatsApp si existe
        let pdfUrl = null;
        if (adminInvoiceId) {
            const token = jwt.sign(
                { id: 0, role: 'admin', username: 'system' }, 
                process.env.JWT_SECRET || 'simids_crm_secret_2026',
                { expiresIn: '30d' }
            );
            const baseUrl = process.env.CRM_URL || 'http://localhost:4050';
            pdfUrl = `${baseUrl}/api/billing/admin-invoices/${adminInvoiceId}/pdf?token=${token}`;
        }

        // 4. Formatear y construir el mensaje de WhatsApp según el día
        let text = '';
        const cleanAmount = parseFloat(billingData.amount).toLocaleString('es-CO');
        const periodStr = `${billingData.month}/${billingData.year}`;

        if (triggerDay === 28) {
            text = `¡Hola, ${billingData.business_name}! 👋\n\nTe informamos que tu factura de mensualidad POS Cloud para el período *${periodStr}* por valor de *$${cleanAmount}* ya está disponible.\n\nPuedes realizar tu pago de forma segura en línea aquí:\n🔗 ${boldLinkUrl}\n\nQuedamos atentos a tu pago. ¡Muchas gracias! 😊`;
        } else if (triggerDay === 1) {
            text = `⏰ *Recordatorio de Vencimiento* — SIMIDS POS\n\nHola, ${billingData.business_name} 👋.\nTe recordamos que hoy vence el plazo de pago para tu mensualidad POS Cloud (*${periodStr}*) por valor de *$${cleanAmount}*.\n\nPaga de forma segura aquí:\n🔗 ${boldLinkUrl}\n\nEvita suspensiones en el servicio y recargos. ¡Gracias por estar al día!`;
        } else if (triggerDay === 3) {
            text = `⚠️ *AVISO DE COBRO PENDIENTE* — SIMIDS POS\n\nHola, ${billingData.business_name}.\nTu mensualidad POS Cloud del mes *${periodStr}* ($${cleanAmount}) presenta *3 días de atraso*.\n\nPor favor, ponte al día realizando tu pago aquí:\n🔗 ${boldLinkUrl}\n\nSi ya realizaste el pago, ignora este mensaje.`;
        } else if (triggerDay === 5) {
            text = `🚨 *ALERTA DE SUSPENSIÓN CRÍTICA* — SIMIDS POS\n\nHola, ${billingData.business_name}.\nTu mensualidad POS Cloud (*${periodStr}*) presenta *5 días de atraso*.\n\nTu servicio entrará en proceso de *suspensión automática* en las próximas horas.\n\nEvita el bloqueo de tus cajas realizando tu pago de inmediato aquí:\n🔗 ${boldLinkUrl}\n\nSi requieres soporte, responde a este mensaje.`;
        }

        // 5. Enviar mensaje de WhatsApp
        console.log(`[BillingScheduler] Enviando WhatsApp Día ${triggerDay} a ${billingData.whatsapp}...`);
        const phoneFormatted = whatsappService.formatPhoneNumber(billingData.whatsapp);
        
        let sendResult;
        if (pdfUrl && (triggerDay === 28 || triggerDay === 1)) {
            // Enviar texto y luego el documento PDF
            sendResult = await whatsappService.sendTextMessage(phoneFormatted, text);
            await new Promise(r => setTimeout(r, 2000));
            await whatsappService.sendDocument(phoneFormatted, pdfUrl, `Factura_POS_${periodStr.replace('/', '_')}.pdf`);
        } else {
            // Solo enviar texto (Días 3 y 5)
            sendResult = await whatsappService.sendTextMessage(phoneFormatted, text);
        }

        // 6. Registrar log y actualizar el flag
        await db.query(`
            UPDATE client_billing_months 
            SET ${flagField} = true,
                updated_at = NOW()
            WHERE id = $1
        `, [billingData.id]);

        await db.query(`
            INSERT INTO crm_whatsapp_log (phone, message, direction, status)
            VALUES ($1, $2, 'outbound', 'sent')
        `, [phoneFormatted, `Recordatorio Día ${triggerDay} enviado para mes ${periodStr}`]);

        // 7. Si es Día 5, agregar alerta en base de datos para el administrador
        if (triggerDay === 5) {
            await db.query(`
                INSERT INTO crm_billing_alerts (client_id, billing_month_id, alert_type, reason, status)
                VALUES ($1, $2, 'overdue_critical', $3, 'pending')
                ON CONFLICT DO NOTHING
            `, [
                billingData.client_id, 
                billingData.id, 
                `Cliente ${billingData.business_name} presenta mora crítica (Día 5) para el mes ${periodStr}`
            ]);
            
            console.log(`[BillingScheduler] 🚨 Creada alerta de mora crítica para cliente #${billingData.client_id}.`);
        }

        console.log(`[BillingScheduler] ✅ Recordatorio Día ${triggerDay} completado para cliente #${billingData.client_id}.`);
    }
}

export default new BillingSchedulerService();
