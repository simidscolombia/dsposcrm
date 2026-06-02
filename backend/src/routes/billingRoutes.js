import express from 'express';
import db from '../config/database.js';
import adminService from '../services/adminService.js';
import boldService from '../services/boldService.js';

const router = express.Router();

// ============================================
// GET /api/billing/months
// Obtener todos los meses de cobro de un cliente (opcional por año)
// ============================================
router.get('/months', async (req, res) => {
    try {
        const { client_id, year } = req.query;

        if (!client_id) {
            return res.status(400).json({ success: false, error: 'El parámetro client_id es requerido' });
        }

        let query = `
            SELECT * FROM client_billing_months 
            WHERE client_id = $1
        `;
        const params = [parseInt(client_id)];

        if (year) {
            query += ' AND year = $2';
            params.push(parseInt(year));
        }

        query += ' ORDER BY year DESC, month DESC';

        const result = await db.query(query, params);
        res.json({ success: true, months: result.rows });
    } catch (error) {
        console.error('[BillingRoutes] Error al obtener meses:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// PUT /api/billing/months/:id
// Actualizar el estado de un mes específico (pago manual, cortesía, etc.)
// ============================================
router.put('/months/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, amount, payment_method, notes, paid_date } = req.body;

        // Validar estado
        const validStatuses = ['paid', 'pending', 'gifted', 'future'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, error: 'Estado de pago no válido' });
        }

        // Obtener mes antes del cambio para auditar
        const preCheck = await db.query('SELECT * FROM client_billing_months WHERE id = $1', [id]);
        if (preCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Registro de mes no encontrado' });
        }
        const currentMonth = preCheck.rows[0];

        // Construir campos a actualizar
        const updates = [];
        const params = [];
        let i = 1;

        if (status !== undefined) {
            updates.push(`status = $${i++}`);
            params.push(status);
            
            // Auto ajustar paid_date si cambia a paid
            if (status === 'paid' && !currentMonth.paid_date) {
                updates.push(`paid_date = $${i++}`);
                params.push(paid_date ? new Date(paid_date) : new Date());
            } else if (status !== 'paid') {
                updates.push(`paid_date = $${i++}`);
                params.push(null);
            }
        }

        if (amount !== undefined) {
            updates.push(`amount = $${i++}`);
            params.push(amount);
        }

        if (payment_method !== undefined) {
            updates.push(`payment_method = $${i++}`);
            params.push(payment_method);
        }

        if (notes !== undefined) {
            updates.push(`notes = $${i++}`);
            params.push(notes);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, error: 'No se enviaron campos para actualizar' });
        }

        params.push(id);
        const query = `
            UPDATE client_billing_months 
            SET ${updates.join(', ')} 
            WHERE id = $${i} 
            RETURNING *
        `;

        const result = await db.query(query, params);
        const updatedMonth = result.rows[0];

        // Log de actividad
        await db.query(`
            INSERT INTO crm_activity_log (client_id, activity_type, description, performed_by)
            VALUES ($1, 'billing_month_updated', $2, 'admin')
        `, [
            updatedMonth.client_id, 
            `Mes ${updatedMonth.month}/${updatedMonth.year} actualizado manualmente a: ${updatedMonth.status} (Monto: $${updatedMonth.amount})`
        ]);

        // Sincronizar estado general del cliente si todos sus meses pendientes están en verde/azul
        const pendingCheck = await db.query(`
            SELECT COUNT(*) FROM client_billing_months 
            WHERE client_id = $1 AND status = 'pending'
        `, [updatedMonth.client_id]);

        const hasPending = parseInt(pendingCheck.rows[0].count) > 0;
        const newClientStatus = hasPending ? 'grace' : 'active'; // Si debe, estado en mora/gracia. Si no debe, activo.

        await db.query(`
            UPDATE crm_clients 
            SET payment_status = $1, 
                last_payment_date = CASE WHEN $2 = 'paid' THEN NOW() ELSE last_payment_date END
            WHERE id = $3
        `, [newClientStatus, status, updatedMonth.client_id]);

        res.json({ success: true, month: updatedMonth, client_payment_status: newClientStatus });
    } catch (error) {
        console.error('[BillingRoutes] Error al actualizar mes:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POST /api/billing/generate
// Disparar la generación automática de meses pendientes
// ============================================
router.post('/generate', async (req, res) => {
    try {
        const result = await db.query('SELECT generate_pending_months() AS meses_generados');
        const count = result.rows[0].meses_generados;
        res.json({ success: true, message: `Se procesó la generación automática: ${count} meses creados o validados.` });
    } catch (error) {
        console.error('[BillingRoutes] Error en generación de meses:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET /api/billing/summary/:client_id
// Resumen de estado de cobros de un cliente específico
// ============================================
router.get('/summary/:client_id', async (req, res) => {
    try {
        const { client_id } = req.params;
        const result = await db.query('SELECT * FROM client_payment_summary WHERE client_id = $1', [client_id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Resumen no encontrado' });
        }
        res.json({ success: true, summary: result.rows[0] });
    } catch (error) {
        console.error('[BillingRoutes] Error al obtener resumen:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET /api/billing/admin-invoices
// Consultar facturas reales de admin.poslatino.com por NIT
// ============================================
router.get('/admin-invoices', async (req, res) => {
    try {
        const { nit, desde = 0, limite = 50 } = req.query;

        if (!nit) {
            return res.status(400).json({ success: false, error: 'El NIT es requerido' });
        }

        const data = await adminService.getFacturasCliente(nit, desde, limite);
        res.json({ success: true, ...data });
    } catch (error) {
        console.error('[BillingRoutes] Error consultando facturas admin:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POST /api/billing/months/:id/create-admin-invoice
// Crear factura oficial en admin.poslatino.com para un mes específico
// ============================================
router.post('/months/:id/create-admin-invoice', async (req, res) => {
    try {
        const { id } = req.params;
        const { generar_electronica = false } = req.body;

        // Obtener datos del mes y cliente
        const monthRes = await db.query(`
            SELECT b.*, c.nit, c.business_name 
            FROM client_billing_months b
            JOIN crm_clients c ON b.client_id = c.id
            WHERE b.id = $1
        `, [id]);

        if (monthRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Mes de facturación no encontrado' });
        }

        const billingData = monthRes.rows[0];

        if (billingData.status === 'gifted') {
            return res.status(400).json({ success: false, error: 'No se puede facturar un mes marcado como cortesía' });
        }

        if (billingData.admin_invoice_id) {
            return res.status(400).json({ success: false, error: 'Este mes ya tiene una factura vinculada en admin' });
        }

        // Llamar a admin para crear la factura
        const descFactura = `Mensualidad Cloud SIMIDS - Mes ${billingData.month}/${billingData.year}`;
        
        const adminRes = await adminService.crearFacturaMensualidad({
            nit: billingData.nit,
            nombre_cliente: billingData.business_name,
            monto: billingData.amount,
            descripcion: descFactura,
            mes: billingData.month,
            anio: billingData.year,
            metodo_pago: billingData.payment_method || 'transferencia',
            generar_electronica
        });

        if (!adminRes.ok) {
            return res.status(500).json({ success: false, error: adminRes.msg || 'Error al crear la factura en admin.poslatino.com' });
        }

        const adminFactura = adminRes.factura;

        // Vincular ID de factura y actualizar estado
        await db.query(`
            UPDATE client_billing_months 
            SET admin_invoice_id = $1, 
                admin_invoice_num = $2,
                status = CASE WHEN status = 'pending' AND $3 = true THEN 'paid' ELSE status END,
                updated_at = NOW()
            WHERE id = $4
        `, [adminFactura.id, adminFactura.numero, billingData.status === 'paid', id]);

        res.json({
            success: true,
            message: 'Factura vinculada y creada en admin.poslatino.com exitosamente',
            factura: adminFactura
        });

    } catch (error) {
        console.error('[BillingRoutes] Error creando factura admin:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POST /api/billing/months/:id/mark-paid
// Marcar factura de admin como pagada y emitir factura electrónica DIAN
// ============================================
router.post('/months/:id/mark-paid', async (req, res) => {
    try {
        const { id } = req.params;
        const { metodo_pago = 'transferencia' } = req.body;

        // 1. Obtener registro de mes
        const monthRes = await db.query(`
            SELECT b.*, c.nit, c.business_name 
            FROM client_billing_months b
            JOIN crm_clients c ON b.client_id = c.id
            WHERE b.id = $1
        `, [id]);

        if (monthRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Registro de mes no encontrado' });
        }

        const billingData = monthRes.rows[0];

        if (!billingData.admin_invoice_id) {
            return res.status(400).json({ success: false, error: 'Este mes no tiene una factura creada en admin' });
        }

        // 2. Marcar como pagada en el Admin POS
        const payRes = await adminService.marcarFacturaPagada(billingData.admin_invoice_id, metodo_pago);
        if (!payRes.ok) {
            return res.status(500).json({ success: false, error: payRes.msg || 'Error al marcar factura como pagada en admin' });
        }

        // 3. Emitir Factura Electrónica DIAN
        const dianRes = await adminService.emitirFacturaElectronica(billingData.admin_invoice_id);
        if (!dianRes.ok) {
            // Nota: Aunque falle la emisión DIAN, el pago ya se registró. Informamos del error DIAN.
            // Actualizamos el estado del mes en base de datos CRM a pagado igualmente
            await db.query(`
                UPDATE client_billing_months 
                SET status = 'paid',
                    payment_method = $1,
                    paid_date = NOW(),
                    updated_at = NOW()
                WHERE id = $2
            `, [metodo_pago, id]);

            // Actualizar estado de pago general del cliente
            await db.query(`
                UPDATE crm_clients 
                SET payment_status = 'active',
                    last_payment_date = NOW()
                WHERE id = $1
            `, [billingData.client_id]);

            return res.json({
                success: true,
                warning: 'Factura marcada como pagada, pero falló la emisión a la DIAN',
                error_dian: dianRes.msg || dianRes.errors,
                factura_pagada: payRes.factura
            });
        }

        // 4. Si todo sale bien, guardar la información y actualizar estado a pagado
        await db.query(`
            UPDATE client_billing_months 
            SET status = 'paid',
                payment_method = $1,
                paid_date = NOW(),
                updated_at = NOW()
            WHERE id = $2
        `, [metodo_pago, id]);

        // Actualizar crm_clients
        await db.query(`
            UPDATE crm_clients 
            SET payment_status = 'active',
                last_payment_date = NOW()
            WHERE id = $1
        `, [billingData.client_id]);

        // Log de actividad
        await db.query(`
            INSERT INTO crm_activity_log (client_id, activity_type, description, performed_by)
            VALUES ($1, 'billing_paid_dian', $2, 'admin')
        `, [
            billingData.client_id, 
            `Factura del mes ${billingData.month}/${billingData.year} pagada (${metodo_pago}) y emitida a la DIAN. CUFE: ${dianRes.cufe}`
        ]);

        res.json({
            success: true,
            message: 'Factura pagada y enviada a la DIAN exitosamente',
            factura_pagada: payRes.factura,
            dian: {
                cufe: dianRes.cufe,
                pdf_url: dianRes.pdf_url,
                numero_dian: dianRes.number,
                prefijo: dianRes.prefix
            }
        });

    } catch (error) {
        console.error('[BillingRoutes] Error al marcar como pagado y enviar a la DIAN:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POST /api/billing/months/:id/emit-dian
// Solo emitir factura electrónica a la DIAN (para facturas ya pagadas/cobradas)
// ============================================
router.post('/months/:id/emit-dian', async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Obtener registro de mes
        const monthRes = await db.query(`
            SELECT b.*, c.nit, c.business_name 
            FROM client_billing_months b
            JOIN crm_clients c ON b.client_id = c.id
            WHERE b.id = $1
        `, [id]);

        if (monthRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Registro de mes no encontrado' });
        }

        const billingData = monthRes.rows[0];

        if (!billingData.admin_invoice_id) {
            return res.status(400).json({ success: false, error: 'Este mes no tiene una factura creada en admin' });
        }

        // 2. Emitir Factura Electrónica DIAN
        const dianRes = await adminService.emitirFacturaElectronica(billingData.admin_invoice_id);
        if (!dianRes.ok) {
            return res.status(500).json({ success: false, error: dianRes.msg || 'Error al emitir factura a la DIAN' });
        }

        res.json({
            success: true,
            message: 'Factura electrónica emitida a la DIAN exitosamente',
            dian: {
                cufe: dianRes.cufe,
                pdf_url: dianRes.pdf_url,
                numero_dian: dianRes.number,
                prefijo: dianRes.prefix
            }
        });

    } catch (error) {
        console.error('[BillingRoutes] Error al emitir a la DIAN:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// ============================================
// POST /api/billing/months/:id/generate-bold-link
// Generar enlace de pago Bold.co para un mes
// ============================================
router.post('/months/:id/generate-bold-link', async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener datos del mes y cliente
        const monthRes = await db.query(`
            SELECT b.*, c.nit, c.business_name 
            FROM client_billing_months b
            JOIN crm_clients c ON b.client_id = c.id
            WHERE b.id = $1
        `, [id]);

        if (monthRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Mes de facturación no encontrado' });
        }

        const billingData = monthRes.rows[0];

        if (billingData.status === 'paid' || billingData.status === 'gifted') {
            return res.status(400).json({ success: false, error: 'Este periodo ya se encuentra pagado o marcado como cortesía' });
        }

        // Si ya tiene link generado, lo retornamos para no duplicar en pasarela
        if (billingData.bold_link_url) {
            return res.json({
                success: true,
                message: 'Link de pago recuperado correctamente',
                bold_link_url: billingData.bold_link_url,
                bold_link_id: billingData.bold_link_id
            });
        }

        // Crear link en Bold
        const boldRes = await boldService.crearLinkPagoBold({
            billingMonthId: billingData.id,
            businessName: billingData.business_name,
            nit: billingData.nit,
            amount: billingData.amount,
            month: billingData.month,
            year: billingData.year
        });

        if (!boldRes.success) {
            return res.status(500).json({ success: false, error: boldRes.error || 'Error al generar el link de pago en Bold' });
        }

        // Guardar en base de datos
        await db.query(`
            UPDATE client_billing_months 
            SET bold_link_id = $1, 
                bold_link_url = $2,
                bold_transaction_id = $3, -- Guardar la referencia única temporalmente
                updated_at = NOW()
            WHERE id = $4
        `, [boldRes.link_id, boldRes.payment_url, boldRes.reference, id]);

        res.json({
            success: true,
            message: boldRes.simulated ? 'Enlace de pago simulado generado exitosamente' : 'Enlace de pago Bold generado exitosamente',
            bold_link_url: boldRes.payment_url,
            bold_link_id: boldRes.link_id
        });

    } catch (error) {
        console.error('[BillingRoutes] Error generando link Bold:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET /api/billing/admin-invoices/:invoiceId/pdf
// Proxy para descargar/servir PDF de factura de admin.poslatino.com
// ============================================
router.get('/admin-invoices/:invoiceId/pdf', async (req, res) => {
    try {
        const { invoiceId } = req.params;

        const result = await adminService.getFacturaPDF(invoiceId);

        if (!result.ok) {
            return res.status(500).json({ success: false, error: result.msg || 'Error obteniendo PDF del servidor admin' });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="factura-${invoiceId}.pdf"`);
        res.send(result.buffer);
    } catch (error) {
        console.error('[BillingRoutes] Error descargando PDF:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET /api/billing/alerts
// Obtener alertas de facturación activas
// ============================================
router.get('/alerts', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT a.*, c.business_name, c.whatsapp, c.nit, b.month, b.year, b.amount
            FROM crm_billing_alerts a
            JOIN crm_clients c ON a.client_id = c.id
            JOIN client_billing_months b ON a.billing_month_id = b.id
            ORDER BY a.created_at DESC
        `);
        res.json({ success: true, alerts: result.rows });
    } catch (error) {
        console.error('[BillingRoutes] Error al obtener alertas:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POST /api/billing/alerts/:id/resolve
// Resolver una alerta (aprobar o rechazar cortesía)
// ============================================
router.post('/alerts/:id/resolve', async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'approve' | 'reject'

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, error: 'Acción no válida' });
        }

        // Obtener alerta
        const alertRes = await db.query(`
            SELECT a.*, c.business_name, c.whatsapp, b.month, b.year
            FROM crm_billing_alerts a
            JOIN crm_clients c ON a.client_id = c.id
            JOIN client_billing_months b ON a.billing_month_id = b.id
            WHERE a.id = $1
        `, [id]);

        if (alertRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Alerta no encontrada' });
        }

        const alertData = alertRes.rows[0];
        const statusValue = action === 'approve' ? 'approved' : 'rejected';

        // Actualizar alerta
        await db.query(`
            UPDATE crm_billing_alerts 
            SET status = $1, updated_at = NOW() 
            WHERE id = $2
        `, [statusValue, id]);

        let messageText = '';
        
        if (alertData.alert_type === 'courtesy_request') {
            if (action === 'approve') {
                // Marcar mes como cortesía ('gifted')
                await db.query(`
                    UPDATE client_billing_months 
                    SET status = 'gifted', updated_at = NOW() 
                    WHERE id = $1
                `, [alertData.billing_month_id]);

                messageText = `✅ ¡Hola, ${alertData.business_name}! Te confirmamos que tu solicitud de mes de cortesía para el período *${alertData.month}/${alertData.year}* ha sido APROBADA. Que tengas un excelente día.`;
            } else {
                messageText = `❌ Hola, ${alertData.business_name}. Te informamos que tu solicitud de mes de cortesía para el período *${alertData.month}/${alertData.year}* no pudo ser aprobada en esta ocasión. Por favor ponte al día con el pago correspondiente.`;
            }
        }

        // Enviar WhatsApp al cliente informando el resultado
        if (messageText) {
            try {
                const whatsappService = (await import('../services/whatsappService.js')).default;
                const phoneFormatted = whatsappService.formatPhoneNumber(alertData.whatsapp);
                await whatsappService.sendTextMessage(phoneFormatted, messageText);
                
                // Log el mensaje saliente
                await db.query(`
                    INSERT INTO crm_whatsapp_log (phone, message, direction, status)
                    VALUES ($1, $2, 'outbound', 'sent')
                `, [phoneFormatted, messageText.substring(0, 500)]);
            } catch (waErr) {
                console.error('[BillingRoutes] Error enviando notificación de resolución:', waErr.message);
            }
        }

        res.json({ 
            success: true, 
            message: `Alerta resuelta con éxito (${statusValue})` 
        });

    } catch (error) {
        console.error('[BillingRoutes] Error al resolver alerta:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Helper para obtener el subdominio limpio
const getSubdomainFromUrl = (url) => {
    if (!url) return null;
    let cleaned = url.toLowerCase().trim().replace(/^(https?:\/\/)?(www\.)?/, '');
    const part = cleaned.split('.')[0];
    return part || null;
};

router.get('/cross-check', async (req, res) => {
    try {
        // 1. Obtener todos los clientes Cloud/Cloud_FE del CRM
        const clientsRes = await db.query(`
            SELECT * FROM crm_clients 
            WHERE plan_type IN ('cloud', 'cloud_fe')
        `);
        const clients = clientsRes.rows;

        // 2. Obtener todos los meses de cobro del CRM
        const monthsRes = await db.query(`
            SELECT * FROM client_billing_months 
            ORDER BY year DESC, month DESC
        `);
        const billingMonths = monthsRes.rows;

        // 3. Obtener todas las facturas del Admin (tanto Cloud como Local)
        const adminInvoicesRes = await adminService.getTodasFacturasAdmin(0, 5000, '');
        const adminInvoices = adminInvoicesRes.ok ? adminInvoicesRes.facturas : [];

        // 4. Mapear subdominios y NITs para el cruce inteligente
        const invoicesByClient = {};
        const unlinkedInvoices = [];

        const clientSubdomains = clients.map(c => ({
            id: c.id,
            nit: c.nit,
            subdomain: getSubdomainFromUrl(c.cloud_url)
        })).filter(c => c.subdomain);

        adminInvoices.forEach(inv => {
            const note = (inv.nota || '').toLowerCase();
            const clientNit = inv.cliente?.nit;
            const { base: invoiceNitBase } = adminService.normalizarNIT(clientNit);

            let matchedClient = null;

            // A. Primero intentar cruce por subdominio en la observación/nota
            for (const cs of clientSubdomains) {
                if (note.includes(cs.subdomain)) {
                    matchedClient = cs;
                    break;
                }
            }

            // B. Fallback: Cruce por NIT
            if (!matchedClient && invoiceNitBase) {
                const found = clients.find(c => {
                    const { base: clientNitBase } = adminService.normalizarNIT(c.nit);
                    return clientNitBase === invoiceNitBase;
                });
                if (found) {
                    matchedClient = { id: found.id, subdomain: getSubdomainFromUrl(found.cloud_url) };
                }
            }

            if (matchedClient) {
                if (!invoicesByClient[matchedClient.id]) {
                    invoicesByClient[matchedClient.id] = [];
                }
                invoicesByClient[matchedClient.id].push(inv);
            } else {
                // Si la nota tiene indicios de ser de la nube (contiene poslatino o similar) pero no se enlazó
                if (note.includes('poslatino') || note.includes('nube') || note.includes('cloud') || note.includes('.com') || note.includes('.co')) {
                    unlinkedInvoices.push(inv);
                }
            }
        });

        // 5. Organizar meses de cobro por client_id
        const monthsByClientId = {};
        billingMonths.forEach(m => {
            if (!monthsByClientId[m.client_id]) {
                monthsByClientId[m.client_id] = [];
            }
            monthsByClientId[m.client_id].push(m);
        });

        // 6. Construir reporte comparativo
        const report = clients.map(client => {
            const cMonths = monthsByClientId[client.id] || [];
            const pendingMonths = cMonths.filter(m => m.status === 'pending');
            const paidMonths = cMonths.filter(m => m.status === 'paid');
            const giftedMonths = cMonths.filter(m => m.status === 'gifted');

            // Facturas vinculadas por el algoritmo
            const cInvoices = invoicesByClient[client.id] || [];
            const latestInvoice = cInvoices.length > 0 ? cInvoices[0] : null;

            let latestBillingMonthStr = 'N/A';
            if (cMonths.length > 0) {
                const latest = cMonths[0]; // ordenados desc
                latestBillingMonthStr = `${latest.month.toString().padStart(2, '0')}/${latest.year}`;
            }

            // Datos incompletos
            const missingFields = [];
            if (!client.nit) missingFields.push('NIT');
            if (!client.email) missingFields.push('email');
            if (!client.whatsapp) missingFields.push('whatsapp');
            if (!client.cloud_url) missingFields.push('cloud_url');
            const hasCompleteData = missingFields.length === 0;

            // Determinar estado de cobro
            let statusCheck = 'Al día';
            if (cMonths.length === 0) {
                statusCheck = 'Sin registrar meses';
            } else if (pendingMonths.length > 0) {
                // Verificar si alguno de los meses pendientes no tiene factura vinculada en CRM ni tampoco en el cruce de admin
                const hasUninvoicedPending = pendingMonths.some(pm => {
                    // Si no tiene factura vinculada por ID en client_billing_months
                    if (!pm.admin_invoice_id) {
                        // Buscar si existe alguna factura en el cruce para este año/mes
                        const hasInvForMonth = cInvoices.some(inv => {
                            const invDate = new Date(inv.fecha);
                            return invDate.getFullYear() === pm.year && (invDate.getMonth() + 1) === pm.month;
                        });
                        return !hasInvForMonth;
                    }
                    return false;
                });

                if (hasUninvoicedPending) {
                    statusCheck = 'Sin facturar';
                } else {
                    statusCheck = 'En mora';
                }
            }

            return {
                id: client.id,
                business_name: client.business_name,
                contact_name: client.contact_name || '',
                nit: client.nit || '',
                plan_type: client.plan_type,
                monthly_amount: client.monthly_amount,
                cloud_url: client.cloud_url || '',
                payment_status: client.payment_status,
                whatsapp: client.whatsapp || '',
                email: client.email || '',
                latest_billing_month: latestBillingMonthStr,
                stats: {
                    total_months: cMonths.length,
                    pending: pendingMonths.length,
                    paid: paidMonths.length,
                    gifted: giftedMonths.length
                },
                latest_invoice: latestInvoice ? {
                    id: latestInvoice.id,
                    numero: latestInvoice.numero,
                    fecha: latestInvoice.fecha,
                    monto: latestInvoice.monto,
                    tipo_pago: latestInvoice.tipo_pago,
                    es_credito: latestInvoice.es_credito,
                    es_electronica: latestInvoice.es_electronica,
                    prefijo: latestInvoice.prefijo,
                    numero_dian: latestInvoice.numero_dian,
                    cufe: latestInvoice.cufe,
                    pdf_url: latestInvoice.pdf_url,
                    nota: latestInvoice.nota
                } : null,
                invoices: cInvoices.map(inv => ({
                    id: inv.id,
                    numero: inv.numero,
                    fecha: inv.fecha,
                    monto: inv.monto,
                    tipo_pago: inv.tipo_pago,
                    es_credito: inv.es_credito,
                    es_electronica: inv.es_electronica,
                    prefijo: inv.prefijo,
                    numero_dian: inv.numero_dian,
                    cufe: inv.cufe,
                    pdf_url: inv.pdf_url,
                    nota: inv.nota
                })),
                data_completeness: {
                    complete: hasCompleteData,
                    missing: missingFields
                },
                status_check: statusCheck
            };
        });

        // 7. Calcular estadísticas generales
        const stats = {
            total_clients: report.length,
            al_dia: report.filter(r => r.status_check === 'Al día').length,
            en_mora: report.filter(r => r.status_check === 'En mora').length,
            sin_facturar: report.filter(r => r.status_check === 'Sin facturar').length,
            sin_meses: report.filter(r => r.status_check === 'Sin registrar meses').length,
            datos_incompletos: report.filter(r => !r.data_completeness.complete).length
        };

        res.json({
            success: true,
            stats,
            report,
            unlinkedInvoices: unlinkedInvoices.slice(0, 100).map(inv => ({
                id: inv.id,
                numero: inv.numero,
                fecha: inv.fecha,
                monto: inv.monto,
                tipo_pago: inv.tipo_pago,
                es_credito: inv.es_credito,
                es_electronica: inv.es_electronica,
                prefijo: inv.prefijo,
                numero_dian: inv.numero_dian,
                cufe: inv.cufe,
                pdf_url: inv.pdf_url,
                nota: inv.nota,
                cliente: inv.cliente
            }))
        });

    } catch (error) {
        console.error('[BillingRoutes] Error en reporte de cruce masivo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;

