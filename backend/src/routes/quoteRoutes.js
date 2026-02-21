import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// ============================================
// POST /api/quotes
// Guardar cotización completa (lead + quote + items + activity)
// ============================================
router.post('/', async (req, res) => {
    try {
        const {
            // Client data
            clientName,
            clientPhone,
            city,
            businessType,
            systemType,
            source, // 'web', 'whatsapp', 'facebook'

            // Products
            products, // Array of { id, name, category, price, quantity }

            // Prize
            prizeLabel,
            prizeDetail,
            discountPercent,
            discountAmount,

            // Totals
            subtotal,
            finalTotal,
        } = req.body;

        console.log('📋 Guardando cotización:', { clientName, clientPhone, city });

        // 1. Find or create lead
        let leadId = null;
        if (clientPhone) {
            // Check if lead already exists with this phone
            const existingLead = await db.query(
                'SELECT id FROM leads WHERE whatsapp = $1 LIMIT 1',
                [clientPhone]
            );

            if (existingLead.rows.length > 0) {
                leadId = existingLead.rows[0].id;
                // Update existing lead
                await db.query(`
                    UPDATE leads SET
                        name = COALESCE($1, name),
                        city = COALESCE($2, city),
                        business_type = COALESCE($3, business_type),
                        system_type = COALESCE($4, system_type),
                        pipeline_stage = CASE WHEN pipeline_stage = 'new' THEN 'quoted' ELSE pipeline_stage END,
                        prize_won = COALESCE($5, prize_won),
                        source = COALESCE($6, source),
                        last_contact_at = NOW(),
                        updated_at = NOW()
                    WHERE id = $7
                `, [clientName, city, businessType, systemType, prizeLabel, source || 'web', leadId]);
            } else {
                // Create new lead
                const newLead = await db.query(`
                    INSERT INTO leads (name, whatsapp, city, business_type, system_type, prize_won, pipeline_stage, source, status, last_contact_at)
                    VALUES ($1, $2, $3, $4, $5, $6, 'quoted', $7, 'new', NOW())
                    RETURNING id
                `, [
                    clientName || 'Cliente Web',
                    clientPhone,
                    city || null,
                    businessType || null,
                    systemType || null,
                    prizeLabel || null,
                    source || 'web'
                ]);
                leadId = newLead.rows[0].id;
            }
        } else {
            // No phone - just create a minimal lead
            const fallbackPhone = 'Sin Registro';
            const newLead = await db.query(`
                INSERT INTO leads (name, whatsapp, city, business_type, system_type, prize_won, pipeline_stage, source, status, last_contact_at)
                VALUES ($1, $2, $3, $4, $5, $6, 'quoted', $7, 'new', NOW())
                RETURNING id
            `, [
                clientName || 'Cliente Web',
                fallbackPhone,
                city || null,
                businessType || null,
                systemType || null,
                prizeLabel || null,
                source || 'web'
            ]);
            leadId = newLead.rows[0].id;
        }

        // 2. Find advisor by city
        let advisorId = null;
        if (city) {
            const advisor = await db.query(
                "SELECT id FROM crm_advisors WHERE LOWER(city) = LOWER($1) AND role = 'sales' AND is_active = true LIMIT 1",
                [city]
            );
            if (advisor.rows.length > 0) {
                advisorId = advisor.rows[0].id;
                // Assign advisor to lead
                await db.query('UPDATE leads SET advisor_id = $1 WHERE id = $2', [advisorId, leadId]);
            }
        }

        // 3. Fix foreign key if it points to legacy crm_leads instead of leads
        try {
            await db.query(`
                ALTER TABLE crm_quotes DROP CONSTRAINT IF EXISTS crm_quotes_lead_id_fkey;
            `);
        } catch (err) {
            console.error('Migration notice:', err);
        }

        // 4. Create quote
        const quote = await db.query(`
            INSERT INTO crm_quotes (
                lead_id, client_name, client_phone, client_city, client_business,
                system_type, total_amount, discount_percent, discount_amount, final_amount,
                prize_label, prize_detail, advisor_id, status, expires_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'sent', NOW() + INTERVAL '48 hours')
            RETURNING id
        `, [
            leadId,
            clientName || 'Cliente Web',
            clientPhone || null,
            city || null,
            businessType || null,
            systemType || null,
            subtotal || 0,
            discountPercent || 0,
            discountAmount || 0,
            finalTotal || subtotal || 0,
            prizeLabel || null,
            prizeDetail || null,
            advisorId
        ]);
        const quoteId = quote.rows[0].id;

        // 5. Save quote items
        if (products && products.length > 0) {
            for (const product of products) {
                await db.query(`
                    INSERT INTO crm_quote_items (quote_id, product_id, product_name, product_category, quantity, unit_price, subtotal)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [
                    quoteId,
                    product.id || null,
                    product.name || 'Producto',
                    product.category || null,
                    product.quantity || 1,
                    parseFloat(product.price) || 0,
                    (parseFloat(product.price) || 0) * (product.quantity || 1)
                ]);
            }
        }

        // 6. Log activity
        await db.query(`
            INSERT INTO crm_activity_log (lead_id, activity_type, description, metadata, performed_by)
            VALUES ($1, 'quote_created', $2, $3, 'system')
        `, [
            leadId,
            `Cotización #${quoteId} creada: ${(products || []).length} productos, Total: $${finalTotal}`,
            JSON.stringify({
                quote_id: quoteId,
                products_count: (products || []).length,
                subtotal,
                discount_percent: discountPercent,
                discount_amount: discountAmount,
                final_total: finalTotal,
                prize: prizeLabel,
                city,
                business_type: businessType,
                system_type: systemType
            })
        ]);

        // Also log the roulette prize
        if (prizeLabel) {
            await db.query(`
                INSERT INTO crm_activity_log (lead_id, activity_type, description, metadata, performed_by)
                VALUES ($1, 'roulette_played', $2, $3, 'system')
            `, [
                leadId,
                `Premio ganado: ${prizeLabel}`,
                JSON.stringify({ prize: prizeLabel, detail: prizeDetail, discount_percent: discountPercent })
            ]);
        }

        // 7. Schedule follow-up (2 hours after quote)
        await db.query(`
            INSERT INTO crm_followups (lead_id, type, scheduled_at, message_template, channel, sequence_step, max_steps)
            VALUES ($1, 'sales_followup', NOW() + INTERVAL '2 hours', $2, 'whatsapp', 1, 5)
        `, [
            leadId,
            `Hola ${clientName || ''}, ¿pudiste revisar tu cotización de Discovery Systems? Con tu premio ${prizeLabel || ''} tienes una oferta especial. ¿Tienes alguna pregunta? 😊`
        ]);

        console.log('✅ Cotización guardada:', { leadId, quoteId, products: (products || []).length });

        res.status(201).json({
            success: true,
            data: {
                lead_id: leadId,
                quote_id: quoteId,
                advisor_id: advisorId,
                items_count: (products || []).length,
                message: 'Cotización guardada exitosamente'
            }
        });

    } catch (error) {
        console.error('❌ Error guardando cotización:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET /api/quotes/:id
// Obtener cotización por ID
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const quote = await db.query('SELECT * FROM crm_quotes WHERE id = $1', [id]);
        if (quote.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Cotización no encontrada' });
        }

        const items = await db.query('SELECT * FROM crm_quote_items WHERE quote_id = $1', [id]);

        res.json({
            success: true,
            quote: quote.rows[0],
            items: items.rows
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET /api/quotes
// Listar todas las cotizaciones (para admin)
// ============================================
router.get('/', async (req, res) => {
    try {
        const { status, city, limit = 50, offset = 0 } = req.query;

        let query = `
            SELECT q.*, 
                   a.name as advisor_name,
                   (SELECT COUNT(*) FROM crm_quote_items WHERE quote_id = q.id) as items_count
            FROM crm_quotes q
            LEFT JOIN crm_advisors a ON q.advisor_id = a.id
        `;
        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (status) {
            conditions.push(`q.status = $${paramIndex++}`);
            params.push(status);
        }
        if (city) {
            conditions.push(`LOWER(q.client_city) = LOWER($${paramIndex++})`);
            params.push(city);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ` ORDER BY q.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await db.query(query, params);

        res.json({ success: true, quotes: result.rows, count: result.rows.length });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET /api/quotes/:id
// Obtener cotización por ID para Portal Cliente
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const quoteResult = await db.query('SELECT * FROM crm_quotes WHERE id = $1', [id]);

        if (quoteResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Cotización no encontrada' });
        }

        const quote = quoteResult.rows[0];
        const items = await db.query('SELECT * FROM crm_quote_items WHERE quote_id = $1', [id]);
        quote.items = items.rows;

        res.json({ success: true, quote });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// PUT /api/quotes/:id/confirm
// Confirmar pedido, agregar info de envío y pago
// ============================================
router.put('/:id/confirm', async (req, res) => {
    try {
        const { id } = req.params;
        const { shipping, paymentMethod } = req.body;

        // Auto-migrate schema dynamically inside the function
        try {
            await db.query(`
                ALTER TABLE crm_quotes 
                ADD COLUMN IF NOT EXISTS shipping_address VARCHAR(255),
                ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100),
                ADD COLUMN IF NOT EXISTS shipping_notes TEXT,
                ADD COLUMN IF NOT EXISTS payment_preference VARCHAR(50);
            `);
        } catch (migErr) {
            console.error('Migration non-critical error:', migErr);
        }

        const updateResult = await db.query(`
            UPDATE crm_quotes 
            SET status = 'accepted', 
                shipping_address = $1, 
                shipping_city = $2, 
                shipping_notes = $3, 
                payment_preference = $4 
            WHERE id = $5 
            RETURNING *
        `, [
            shipping?.address || null,
            shipping?.city || null,
            shipping?.notes || null,
            paymentMethod || null,
            id
        ]);

        if (updateResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Cotización no encontrada' });
        }

        // Marcar el lead como 'won' en el Pipeline o mover su estado
        const leadId = updateResult.rows[0].lead_id;
        if (leadId) {
            await db.query(`
                UPDATE leads SET pipeline_stage = 'won', status = 'contacted', updated_at = NOW() 
                WHERE id = $1
            `, [leadId]);

            await db.query(`
                INSERT INTO crm_activity_log (lead_id, activity_type, description, performed_by) 
                VALUES ($1, 'quote_accepted', 'El cliente confirmó la cotización desde su Portal Web', 'system')
            `, [leadId]);
        }

        res.json({ success: true, quote: updateResult.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
