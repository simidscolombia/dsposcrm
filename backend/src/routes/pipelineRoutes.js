import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// ============================================
// GET /api/pipeline
// Obtener leads agrupados por etapa del pipeline
// ============================================
router.get('/', async (req, res) => {
    try {
        const { city, advisor_id } = req.query;

        let query = `
            SELECT l.*, 
                   a.name as advisor_name,
                   (SELECT COUNT(*) FROM crm_quotes WHERE lead_id = l.id) as quotes_count,
                   (SELECT MAX(created_at) FROM crm_quotes WHERE lead_id = l.id) as last_quote_at,
                   (SELECT final_amount FROM crm_quotes WHERE lead_id = l.id ORDER BY created_at DESC LIMIT 1) as last_quote_amount
            FROM leads l
            LEFT JOIN crm_advisors a ON l.advisor_id = a.id
        `;
        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (city) {
            conditions.push(`LOWER(l.city) = LOWER($${paramIndex++})`);
            params.push(city);
        }
        if (advisor_id) {
            conditions.push(`l.advisor_id = $${paramIndex++}`);
            params.push(parseInt(advisor_id));
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY l.updated_at DESC';

        const result = await db.query(query, params);

        // Group by pipeline_stage
        const stages = {
            new: { label: 'Nuevos', icon: '🆕', color: '#3B82F6', leads: [] },
            contacted: { label: 'Contactados', icon: '📞', color: '#8B5CF6', leads: [] },
            quoted: { label: 'Cotizados', icon: '📋', color: '#F59E0B', leads: [] },
            demo: { label: 'Demo', icon: '🎬', color: '#EC4899', leads: [] },
            negotiating: { label: 'Negociando', icon: '🤝', color: '#F97316', leads: [] },
            won: { label: 'Ganados', icon: '🏆', color: '#10B981', leads: [] },
            lost: { label: 'Perdidos', icon: '❌', color: '#EF4444', leads: [] },
        };

        for (const lead of result.rows) {
            const stage = lead.pipeline_stage || 'new';
            if (stages[stage]) {
                stages[stage].leads.push(lead);
            } else {
                stages.new.leads.push(lead);
            }
        }

        // Summary
        const summary = {};
        for (const [key, value] of Object.entries(stages)) {
            summary[key] = value.leads.length;
        }

        res.json({ success: true, stages, summary, total: result.rows.length });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// PUT /api/pipeline/:id/stage
// Mover lead a otra etapa del pipeline (drag & drop)
// ============================================
router.put('/:id/stage', async (req, res) => {
    try {
        const { id } = req.params;
        const { stage, lost_reason } = req.body;

        const validStages = ['new', 'contacted', 'quoted', 'demo', 'negotiating', 'won', 'lost'];
        if (!validStages.includes(stage)) {
            return res.status(400).json({ success: false, error: 'Etapa inválida' });
        }

        let updateQuery = `
            UPDATE leads SET pipeline_stage = $1, updated_at = NOW()
        `;
        const params = [stage];
        let paramIndex = 2;

        if (stage === 'lost' && lost_reason) {
            updateQuery += `, lost_reason = $${paramIndex++}`;
            params.push(lost_reason);
        }

        updateQuery += ` WHERE id = $${paramIndex} RETURNING *`;
        params.push(parseInt(id));

        const result = await db.query(updateQuery, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Lead no encontrado' });
        }

        // Log activity
        await db.query(`
            INSERT INTO crm_activity_log (lead_id, activity_type, description, performed_by)
            VALUES ($1, 'pipeline_moved', $2, 'admin')
        `, [id, `Lead movido a etapa: ${stage}`]);

        res.json({ success: true, lead: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET /api/pipeline/:id
// Obtener detalle de un lead con timeline
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const lead = await db.query(`
            SELECT l.*, a.name as advisor_name, a.whatsapp as advisor_whatsapp
            FROM leads l
            LEFT JOIN crm_advisors a ON l.advisor_id = a.id
            WHERE l.id = $1
        `, [id]);

        if (lead.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Lead no encontrado' });
        }

        // Get quotes
        const quotes = await db.query(`
            SELECT q.*, 
                   (SELECT json_agg(json_build_object(
                       'name', qi.product_name,
                       'category', qi.product_category,
                       'quantity', qi.quantity,
                       'unit_price', qi.unit_price,
                       'subtotal', qi.subtotal
                   )) FROM crm_quote_items qi WHERE qi.quote_id = q.id) as items
            FROM crm_quotes q
            WHERE q.lead_id = $1
            ORDER BY q.created_at DESC
        `, [id]);

        // Get activity timeline
        const activities = await db.query(`
            SELECT * FROM crm_activity_log
            WHERE lead_id = $1
            ORDER BY created_at DESC
            LIMIT 50
        `, [id]);

        // Get messages
        const messages = await db.query(`
            SELECT * FROM crm_messages
            WHERE lead_id = $1
            ORDER BY created_at DESC
            LIMIT 50
        `, [id]);

        // Get follow-ups
        const followups = await db.query(`
            SELECT * FROM crm_followups
            WHERE lead_id = $1
            ORDER BY scheduled_at ASC
        `, [id]);

        res.json({
            success: true,
            lead: lead.rows[0],
            quotes: quotes.rows,
            activities: activities.rows,
            messages: messages.rows,
            followups: followups.rows
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// PUT /api/pipeline/:id
// Actualizar datos de un lead
// ============================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, whatsapp, email, city, business_type, notes, advisor_id, next_followup_at } = req.body;

        const result = await db.query(`
            UPDATE leads SET
                name = COALESCE($1, name),
                whatsapp = COALESCE($2, whatsapp),
                email = COALESCE($3, email),
                city = COALESCE($4, city),
                business_type = COALESCE($5, business_type),
                notes = COALESCE($6, notes),
                advisor_id = COALESCE($7, advisor_id),
                next_followup_at = COALESCE($8, next_followup_at),
                updated_at = NOW()
            WHERE id = $9
            RETURNING *
        `, [name, whatsapp, email, city, business_type, notes, advisor_id, next_followup_at, parseInt(id)]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Lead no encontrado' });
        }

        res.json({ success: true, lead: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
