import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// ============================================
// GET /api/distributors
// Listar todos los distribuidores con summary
// ============================================
router.get('/', async (req, res) => {
    try {
        const { search } = req.query;

        let query = `
            SELECT d.*, 
                   COUNT(c.id) as total_clients,
                   COALESCE(SUM(c.monthly_amount), 0) as total_managed_monthly,
                   COUNT(CASE WHEN c.is_active = true THEN 1 END) as active_clients
            FROM crm_distributors d
            LEFT JOIN crm_clients c ON c.distributor_id = d.id
        `;
        const conditions = [];
        const params = [];
        let i = 1;

        if (search) {
            conditions.push(`(LOWER(d.name) LIKE LOWER($${i}) OR LOWER(d.city) LIKE LOWER($${i}) OR d.whatsapp LIKE $${i})`);
            params.push(`%${search}%`);
            i++;
        }

        if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');

        query += ` GROUP BY d.id ORDER BY d.id ASC`;

        const result = await db.query(query, params);

        res.json({ success: true, distributors: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POST /api/distributors
// Crear un nuevo distribuidor
// ============================================
router.post('/', async (req, res) => {
    try {
        const { name, contact_name, whatsapp, city, commission_rate, is_active } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, error: 'El nombre es obligatorio' });
        }

        const result = await db.query(`
            INSERT INTO crm_distributors (name, contact_name, whatsapp, city, commission_rate, is_active)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [
            name, contact_name, whatsapp, city,
            commission_rate || 0, is_active !== false
        ]);

        res.status(201).json({ success: true, distributor: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// PUT /api/distributors/:id
// Editar un distribuidor
// ============================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, contact_name, whatsapp, city, commission_rate, is_active } = req.body;

        const result = await db.query(`
            UPDATE crm_distributors 
            SET name = COALESCE($1, name),
                contact_name = COALESCE($2, contact_name),
                whatsapp = COALESCE($3, whatsapp),
                city = COALESCE($4, city),
                commission_rate = COALESCE($5, commission_rate),
                is_active = COALESCE($6, is_active)
            WHERE id = $7
            RETURNING *
        `, [name, contact_name, whatsapp, city, commission_rate, is_active, id]);

        if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Distribuidor no encontrado' });

        res.json({ success: true, distributor: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// DELETE /api/distributors/:id
// Eliminar distribuidor (solo si no tiene clientes)
// ============================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const clients = await db.query('SELECT COUNT(*) FROM crm_clients WHERE distributor_id = $1', [id]);
        if (parseInt(clients.rows[0].count) > 0) {
            return res.status(400).json({ success: false, error: 'No se puede eliminar porque este distribuidor tiene clientes asignados. Transfiérelos primero a otro distribuidor.' });
        }

        await db.query('DELETE FROM crm_distributors WHERE id = $1', [id]);

        res.json({ success: true, message: 'Distribuidor eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
