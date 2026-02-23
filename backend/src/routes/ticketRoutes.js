import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// ============================================
// GET /api/tickets
// Listar tickets con filtros
// ============================================
router.get('/', async (req, res) => {
    try {
        const { status, priority, client_id, assigned_to, limit = 50, offset = 0 } = req.query;

        let query = `
            SELECT t.*,
                   c.business_name as client_name,
                   c.whatsapp as client_whatsapp,
                   c.plan_type as client_plan,
                   c.anydesk_id as client_anydesk,
                   a.name as assigned_name
            FROM crm_tickets t
            LEFT JOIN crm_clients c ON t.client_id = c.id
            LEFT JOIN crm_advisors a ON t.assigned_to = a.id
        `;
        const conditions = [];
        const params = [];
        let i = 1;

        if (status && status !== 'all') {
            conditions.push(`t.status = $${i++}`);
            params.push(status);
        }
        if (priority && priority !== 'all') {
            conditions.push(`t.priority = $${i++}`);
            params.push(priority);
        }
        if (client_id) {
            conditions.push(`t.client_id = $${i++}`);
            params.push(parseInt(client_id));
        }
        if (assigned_to) {
            conditions.push(`t.assigned_to = $${i++}`);
            params.push(parseInt(assigned_to));
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ` ORDER BY
            CASE t.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END,
            t.created_at DESC
            LIMIT $${i++} OFFSET $${i++}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await db.query(query, params);

        // Stats rápidas
        const stats = await db.query(`
            SELECT 
                COUNT(*) FILTER (WHERE status = 'open') as open_count,
                COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
                COUNT(*) FILTER (WHERE status = 'waiting_client') as waiting_count,
                COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
                COUNT(*) FILTER (WHERE status = 'closed') as closed_count,
                COUNT(*) FILTER (WHERE priority = 'critical' AND status NOT IN ('resolved','closed')) as critical_active,
                COUNT(*) as total
            FROM crm_tickets
        `);

        res.json({
            success: true,
            tickets: result.rows,
            stats: stats.rows[0]
        });
    } catch (error) {
        console.error('Error listando tickets:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET /api/tickets/stats
// Estadísticas detalladas de soporte
// ============================================
router.get('/stats', async (req, res) => {
    try {
        // Tiempo promedio de resolución
        const avgResolution = await db.query(`
            SELECT 
                AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as avg_hours,
                AVG(satisfaction_rating) as avg_satisfaction,
                COUNT(*) FILTER (WHERE resolved_at IS NOT NULL) as total_resolved
            FROM crm_tickets
            WHERE resolved_at IS NOT NULL
        `);

        // Por categoría
        const byCategory = await db.query(`
            SELECT category, COUNT(*) as count
            FROM crm_tickets
            GROUP BY category
            ORDER BY count DESC
        `);

        // Tickets este mes
        const thisMonth = await db.query(`
            SELECT COUNT(*) as count
            FROM crm_tickets
            WHERE created_at >= DATE_TRUNC('month', NOW())
        `);

        res.json({
            success: true,
            avgResolutionHours: parseFloat(avgResolution.rows[0]?.avg_hours || 0).toFixed(1),
            avgSatisfaction: parseFloat(avgResolution.rows[0]?.avg_satisfaction || 0).toFixed(1),
            totalResolved: parseInt(avgResolution.rows[0]?.total_resolved || 0),
            byCategory: byCategory.rows,
            thisMonthCount: parseInt(thisMonth.rows[0]?.count || 0)
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET /api/tickets/:id
// Detalle de un ticket
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const ticket = await db.query(`
            SELECT t.*,
                   c.business_name as client_name,
                   c.whatsapp as client_whatsapp,
                   c.anydesk_id as client_anydesk,
                   c.cloud_url as client_cloud_url,
                   c.plan_type as client_plan,
                   a.name as assigned_name,
                   r.name as resolved_by_name
            FROM crm_tickets t
            LEFT JOIN crm_clients c ON t.client_id = c.id
            LEFT JOIN crm_advisors a ON t.assigned_to = a.id
            LEFT JOIN crm_advisors r ON t.resolved_by = r.id
            WHERE t.id = $1
        `, [id]);

        if (ticket.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Ticket no encontrado' });
        }

        // Actividad del ticket
        const activity = await db.query(`
            SELECT * FROM crm_activity_log
            WHERE metadata->>'ticket_id' = $1
            ORDER BY created_at DESC
            LIMIT 20
        `, [String(id)]);

        // Sugerencias de la base de conocimiento
        const suggestions = await db.query(`
            SELECT id, category, question, answer
            FROM crm_knowledge
            WHERE is_active = true
            AND (
                LOWER(category) = LOWER($1)
                OR LOWER(question) ILIKE '%' || LOWER($2) || '%'
                OR LOWER(keywords) ILIKE '%' || LOWER($2) || '%'
            )
            ORDER BY times_used DESC
            LIMIT 5
        `, [ticket.rows[0].category || '', ticket.rows[0].subject || '']);

        res.json({
            success: true,
            ticket: ticket.rows[0],
            activity: activity.rows,
            suggestions: suggestions.rows
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POST /api/tickets
// Crear nuevo ticket
// ============================================
router.post('/', async (req, res) => {
    try {
        const { client_id, subject, description, category, priority, assigned_to } = req.body;

        if (!client_id || !subject) {
            return res.status(400).json({ success: false, error: 'client_id y subject son requeridos' });
        }

        const result = await db.query(`
            INSERT INTO crm_tickets (client_id, subject, description, category, priority, assigned_to)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [
            client_id,
            subject,
            description || null,
            category || 'general',
            priority || 'medium',
            assigned_to || null
        ]);

        // Log de actividad
        await db.query(`
            INSERT INTO crm_activity_log (client_id, activity_type, description, metadata, performed_by)
            VALUES ($1, 'ticket_created', $2, $3, 'admin')
        `, [
            client_id,
            `Ticket #${result.rows[0].id} creado: ${subject}`,
            JSON.stringify({ ticket_id: result.rows[0].id, category, priority })
        ]);

        res.json({ success: true, ticket: result.rows[0] });
    } catch (error) {
        console.error('Error creando ticket:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// PUT /api/tickets/:id
// Actualizar ticket (estado, prioridad, asignación, resolución)
// ============================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const allowedFields = [
            'subject', 'description', 'category', 'status', 'priority', 'level',
            'assigned_to', 'resolution', 'satisfaction_rating', 'satisfaction_comment',
            'anydesk_session', 'anydesk_duration_min'
        ];

        const setClauses = [];
        const params = [];
        let paramIndex = 1;

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                setClauses.push(`${field} = $${paramIndex++}`);
                params.push(updates[field]);
            }
        }

        // Auto-set timestamps
        if (updates.status === 'in_progress' && !updates.first_response_at) {
            setClauses.push(`first_response_at = COALESCE(first_response_at, NOW())`);
        }
        if (updates.status === 'resolved') {
            setClauses.push(`resolved_at = NOW()`);
            if (updates.resolved_by) {
                setClauses.push(`resolved_by = $${paramIndex++}`);
                params.push(updates.resolved_by);
            }
        }

        setClauses.push('updated_at = NOW()');

        if (setClauses.length === 1) {
            return res.status(400).json({ success: false, error: 'No se proporcionaron campos para actualizar' });
        }

        params.push(parseInt(id));
        const result = await db.query(
            `UPDATE crm_tickets SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            params
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Ticket no encontrado' });
        }

        // Log de actividad
        const changes = Object.keys(updates).filter(k => allowedFields.includes(k)).join(', ');
        await db.query(`
            INSERT INTO crm_activity_log (client_id, activity_type, description, metadata, performed_by)
            VALUES ($1, 'ticket_updated', $2, $3, 'admin')
        `, [
            result.rows[0].client_id,
            `Ticket #${id} actualizado: ${changes}`,
            JSON.stringify({ ticket_id: parseInt(id), changes: updates })
        ]);

        // Si se resolvió con aprendizaje, guardar en knowledge base
        if (updates.status === 'resolved' && updates.resolution && updates.resolution_learned) {
            await db.query(`
                INSERT INTO crm_knowledge (category, question, answer, source, source_ticket_id, created_by)
                VALUES ($1, $2, $3, 'ticket', $4, 'admin')
            `, [
                result.rows[0].category || 'general',
                result.rows[0].subject,
                updates.resolution,
                parseInt(id)
            ]);
        }

        res.json({ success: true, ticket: result.rows[0] });
    } catch (error) {
        console.error('Error actualizando ticket:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET /api/tickets/knowledge/search
// Buscar en la base de conocimiento
// ============================================
router.get('/knowledge/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.json({ success: true, results: [] });
        }

        const result = await db.query(`
            SELECT id, category, question, answer, times_used
            FROM crm_knowledge
            WHERE is_active = true
            AND (
                LOWER(question) ILIKE '%' || LOWER($1) || '%'
                OR LOWER(answer) ILIKE '%' || LOWER($1) || '%'
                OR LOWER(keywords) ILIKE '%' || LOWER($1) || '%'
            )
            ORDER BY times_used DESC
            LIMIT 10
        `, [q]);

        res.json({ success: true, results: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
