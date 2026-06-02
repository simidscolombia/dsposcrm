import express from 'express';
import db from '../config/database.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// ============================================
// GET /api/users
// Obtener todos los usuarios
// ============================================
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, name, username, role, is_active, created_at 
            FROM crm_users 
            ORDER BY created_at DESC
        `);
        res.json({ success: true, users: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POST /api/users
// Crear un nuevo usuario
// ============================================
router.post('/', async (req, res) => {
    try {
        const { name, username, password, role } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({ success: false, error: 'Usuario, contraseña y rol son obligatorios' });
        }

        // Verificar si el username ya existe
        const check = await db.query('SELECT id FROM crm_users WHERE username = $1', [username]);
        if (check.rows.length > 0) {
            return res.status(400).json({ success: false, error: 'El nombre de usuario ya está en uso' });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const result = await db.query(`
            INSERT INTO crm_users (name, username, password_hash, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, username, role, is_active, created_at
        `, [name || username, username, password_hash, role]);

        res.json({ success: true, message: 'Usuario creado exitosamente', user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// PUT /api/users/:id
// Actualizar usuario (y cambiar contraseña si se envía)
// ============================================
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, username, password, role, is_active } = req.body;

        if (password) {
            const password_hash = await bcrypt.hash(password, 10);
            await db.query(`
                UPDATE crm_users 
                SET name = $1, username = $2, password_hash = $3, role = $4, is_active = $5, updated_at = NOW()
                WHERE id = $6
            `, [name, username, password_hash, role, is_active, id]);
        } else {
            await db.query(`
                UPDATE crm_users 
                SET name = $1, username = $2, role = $3, is_active = $4, updated_at = NOW()
                WHERE id = $5
            `, [name, username, role, is_active, id]);
        }

        res.json({ success: true, message: 'Usuario actualizado exitosamente' });
    } catch (error) {
        if (error.code === '23505') { // unique violation
            return res.status(400).json({ success: false, error: 'El nombre de usuario ya está en uso' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// DELETE /api/users/:id
// Desactivar/Eliminar usuario
// ============================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // En lugar de borrar, lo desactivamos por seguridad
        await db.query(`UPDATE crm_users SET is_active = false WHERE id = $1`, [id]);
        res.json({ success: true, message: 'Usuario desactivado' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
