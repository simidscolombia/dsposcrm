import express from 'express';
import multer from 'multer';
import fs from 'fs';
import csvParser from 'csv-parser';
import db from '../config/database.js';

import os from 'os';
import path from 'path';
import { ZipArchive } from 'archiver';

const router = express.Router();
const upload = multer({ dest: os.tmpdir() + '/' });

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
            business_name, contact_name, whatsapp, email, city, address, nit, legal_representative,
            plan_type, monthly_amount, billing_day, pos_version, server_name,
            cloud_url, anydesk_id, advisor_id, notes, priority, started_at,
            install_type, subdomain, server_id, cluster_id, db_name, distributor_id, technician_id
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
                business_name, contact_name, whatsapp, email, city, address, nit, legal_representative,
                plan_type, monthly_amount, billing_day, pos_version, server_name,
                cloud_url, anydesk_id, advisor_id, notes, priority, started_at, next_billing_date,
                install_type, subdomain, server_id, cluster_id, db_name, distributor_id, technician_id
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
                      DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '27 days',
                      $20,$21,$22,$23,$24,$25,$26)
            RETURNING *
        `, [
            business_name, contact_name, whatsapp, email, city, address, nit, legal_representative,
            plan_type || 'local', amount, billing_day || 28, pos_version,
            server_name, cloud_url, anydesk_id, advisor_id, notes, priority || 'normal',
            started_at || new Date(),
            install_type || 'local_pc',
            subdomain || null,
            server_id || null,
            cluster_id || null,
            db_name || null,
            distributor_id || null,
            technician_id || null
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
// POST /api/clients/import
// Importar CRM Clientes desde un archivo CSV
// ============================================
router.post('/import', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No se subió ningún archivo' });
        }

        const results = [];
        let created = 0;
        let skipped = 0;
        const errors = [];

        fs.createReadStream(req.file.path)
            .pipe(csvParser())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                // Remove the temp file
                fs.unlinkSync(req.file.path);

                for (const row of results) {
                    try {
                        // Extract based on likely Spanish headers from their Excel
                        const rawName = row['NUBES'] || row['NEGOCIO'] || row['business_name'] || row['nombre'];
                        if (!rawName) continue; // Skip empty rows

                        // Check duplicates
                        const duplicateCheck = await db.query(
                            'SELECT id FROM crm_clients WHERE business_name ILIKE $1',
                            [rawName.trim()]
                        );
                        if (duplicateCheck.rows.length > 0) {
                            skipped++;
                            continue;
                        }

                        // Determine Plan
                        let plan = 'cloud';
                        const rawFE = (row['F.E.'] || row['FE'] || '').toString().toUpperCase();
                        if (rawFE === 'SI' || rawFE === 'SÍ') plan = 'cloud_fe';
                        if (rawFE === 'NO' && row['ESTADO'] === 'INACTIVO') plan = 'local';

                        // Parse amount
                        let amount = 0;
                        const rawAmount = row['MENSUALIDAD'] || row['Monto'] || '0';
                        const cleanAmount = rawAmount.toString().replace(/[$.,\s]/g, '');
                        if (!isNaN(cleanAmount) && cleanAmount !== '') amount = parseInt(cleanAmount);
                        if (amount === 0 && plan !== 'local') amount = 50000; // Default if unclear

                        await db.query(`
                            INSERT INTO crm_clients (
                                business_name, 
                                contact_name, 
                                whatsapp, 
                                city, 
                                plan_type, 
                                monthly_amount, 
                                cloud_url,
                                is_active
                            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
                        `, [
                            rawName.trim(),
                            row['CONTACTO'] || row['contact_name'] || null,
                            row['TELEFONO'] || row['whatsapp'] || null,
                            row['CIUDAD'] || row['city'] || null,
                            plan,
                            amount,
                            row['NUBES'] || null, // Assuming Nubes col holds the URL
                            (row['ESTADO'] || '').toUpperCase() === 'ACTIVO' ? true : false
                        ]);
                        created++;
                    } catch (e) {
                        errors.push({ row: row['NUBES'] || 'fila', error: e.message });
                    }
                }

                res.json({
                    success: true,
                    message: `Importación completada: ${created} agregados, ${skipped} omitidos (ya existían).`,
                    created,
                    skipped,
                    errors: errors.length > 0 ? errors : undefined
                });
            });

    } catch (error) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
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
            'business_name', 'contact_name', 'whatsapp', 'email', 'city', 'address', 'nit', 'legal_representative',
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
// POST /api/clients/:id/status-notify
// Enviar mensajes estandarizados de estado (Nube a Local, Desconectado)
// ============================================
router.post('/:id/status-notify', async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.body; // 'downgrade_to_local' or 'long_disconnected'

        const clientReq = await db.query('SELECT business_name, whatsapp FROM crm_clients WHERE id = $1', [id]);
        if (clientReq.rows.length === 0) return res.status(404).json({ success: false, error: 'Cliente no encontrado' });

        const client = clientReq.rows[0];
        let messageLog = '';

        if (type === 'downgrade_to_local') {
            messageLog = `Mensaje enviado a ${client.whatsapp}: "Confirmamos tu solicitud de baja de la nube. Puedes continuar usando Discovery POS de manera local y gratuita. Si deseas volver a los beneficios en la nube, contáctanos."`;

            // Si le damos de baja automáticamente lo bajamos a plan_type 'local' y monthly_amount 0
            await db.query(`UPDATE crm_clients SET plan_type = 'local', monthly_amount = 0, cloud_url = NULL, updated_at = NOW() WHERE id = $1`, [id]);
        }
        else if (type === 'long_disconnected') {
            messageLog = `Mensaje enviado a ${client.whatsapp}: "Notamos que llevas un tiempo sin utilizar nuestro sistema en la nube. Recuerda que puedes seguir utilizando Discovery POS en modo local sin mensualidades. ¡Estamos para ayudarte!"`;
        }
        else {
            return res.status(400).json({ success: false, error: 'Tipo de notificación inválido' });
        }

        // Log the activity
        await db.query(`
            INSERT INTO crm_activity_log (client_id, activity_type, description, performed_by)
            VALUES ($1, 'status_notification_sent', $2, 'admin')
        `, [id, messageLog]);

        res.json({ success: true, message: messageLog });
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

// ============================================
// GET /api/clients/:id/provision/local
// Generar instalador local para Windows
// ============================================
router.get('/:id/provision/local', async (req, res) => {
    try {
        const { id } = req.params;
        const clientReq = await db.query('SELECT * FROM crm_clients WHERE id = $1', [id]);
        if (clientReq.rows.length === 0) return res.status(404).json({ success: false, error: 'Cliente no encontrado' });

        const client = clientReq.rows[0];
        
        // Define paths
        const zipName = `Instalador_SIMIDS_${client.business_name.replace(/[^a-zA-Z0-9]/g, '')}.zip`;
        const templatesDir = path.join(process.cwd(), 'templates');
        const batFilePath = path.join(templatesDir, 'install.bat');

        // Paths to official codebase
        const isLocal = process.env.NODE_ENV !== 'production';
        const sourceBackendPath = isLocal 
            ? path.join(process.cwd(), '..', '..', 'SIMIDS-OFFICIAL', 'simidspos-backend')
            : '/var/www/simids-pos/backend';
            
        const sourceFrontendPath = isLocal 
            ? path.join(process.cwd(), '..', '..', 'SIMIDS-OFFICIAL', 'simidspos-frontend')
            : '/var/www/simids-pos/frontend';

        res.attachment(zipName);
        const archive = new ZipArchive({ zlib: { level: 9 } }); // Maximum compression

        archive.on('error', (err) => {
            console.error('Archiver error:', err);
            res.status(500).end();
        });

        archive.pipe(res);

        // Add the install.bat script at the root of the ZIP
        if (fs.existsSync(batFilePath)) {
            archive.file(batFilePath, { name: 'Instalador_SIMIDS.bat' });
        } else {
            archive.append('@echo off\\necho Error: install.bat no encontrado en el servidor\\npause', { name: 'Instalador_SIMIDS.bat' });
        }

        // Add README
        const readme = `SIMIDS POS - Instalador Local para ${client.business_name}
        
Instrucciones:
1. Extraiga esta carpeta en el disco C: de la computadora (Recomendado: C:\\SIMIDS_POS\\).
2. Haga doble clic en el archivo "Instalador_SIMIDS.bat".
3. Espere a que la instalacion termine automaticamente.
4. El sistema abrira la caja en el navegador de inmediato.
`;
        archive.append(readme, { name: 'LEER_PRIMERO.txt' });

        // Add custom local .env file
        const customEnv = `PORT=3000
MONGODB_URI=mongodb://localhost:27017/simids_${client.business_name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}
JWT_SECRET=local_secret_${Date.now()}
CLIENT_ID=${client.id}
TENANT_NAME=${client.business_name}
NODE_ENV=production
`;
        archive.append(customEnv, { name: 'simidspos-backend/.env' });

        // Stream the actual codebase directories into the zip
        if (fs.existsSync(sourceBackendPath)) {
            // Ignore node_modules to make zip smaller and faster
            archive.directory(sourceBackendPath, 'simidspos-backend', (entry) => {
                if (entry.name.includes('node_modules')) return false;
                return entry;
            });
        }
        
        if (fs.existsSync(sourceFrontendPath)) {
            archive.directory(sourceFrontendPath, 'simidspos-frontend', (entry) => {
                if (entry.name.includes('node_modules')) return false;
                return entry;
            });
        }

        await archive.finalize();
        
        // Log activity
        await db.query(`
            INSERT INTO crm_activity_log (client_id, activity_type, description, performed_by)
            VALUES ($1, 'installer_generated', $2, 'admin')
        `, [client.id, `Generado Instalador Local para Windows`]);

    } catch (error) {
        console.error('Error generating provision zip:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// ============================================
// POST /api/clients/sync-from-infra
// Sync a single infrastructure client to crm_clients
// ============================================
router.post('/sync-from-infra', async (req, res) => {
    try {
        const { infra_client_id } = req.body;
        if (!infra_client_id) return res.status(400).json({ success: false, error: 'infra_client_id requerido' });

        // Check if already synced
        const existing = await db.query('SELECT id FROM crm_clients WHERE infra_client_id = $1', [infra_client_id]);
        if (existing.rows.length > 0) {
            return res.json({ success: true, message: 'Cliente ya sincronizado', client_id: existing.rows[0].id });
        }

        // Get infra client data
        const infra = await db.query('SELECT * FROM infrastructure_pos_clients WHERE id = $1', [infra_client_id]);
        if (infra.rows.length === 0) return res.status(404).json({ success: false, error: 'Cliente de infraestructura no encontrado' });

        const ic = infra.rows[0];

        // Insert into crm_clients
        const result = await db.query(`
            INSERT INTO crm_clients (
                business_name, cloud_url, plan_type, install_type, subdomain, 
                server_id, cluster_id, db_name, infra_client_id, audit_status,
                is_active, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'approved', true, NOW())
            RETURNING *
        `, [
            ic.owner_name || ic.name,
            ic.domain ? `https://${ic.domain}` : null,
            ic.plan_type || 'cloud',
            'cloud',
            ic.name,
            ic.server_id,
            ic.cluster_id,
            ic.db_name,
            ic.id
        ]);

        res.json({ success: true, message: 'Cliente sincronizado exitosamente', client: result.rows[0] });
    } catch (error) {
        console.error('Error syncing client:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POST /api/clients/generate-link
// Generate a temporary install token link
// ============================================
router.post('/generate-link', async (req, res) => {
    try {
        const { install_type = 'cloud', expires_hours = 72 } = req.body;
        const crypto = await import('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + expires_hours * 60 * 60 * 1000);

        await db.query(
            'INSERT INTO install_tokens (token, install_type, expires_at) VALUES ($1, $2, $3)',
            [token, install_type, expiresAt]
        );

        const baseUrl = process.env.FRONTEND_URL || 'https://crm.simids.app';
        res.json({
            success: true,
            token,
            url: `${baseUrl}/#/instalar/${token}`,
            expires_at: expiresAt
        });
    } catch (error) {
        console.error('Error generating link:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
