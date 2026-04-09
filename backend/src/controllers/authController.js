import db from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

class AuthController {
    // Iniciar sesión
    async login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ success: false, error: 'Usuario y contraseña obligatorios' });
            }

            // Buscar usuario
            const result = await db.query('SELECT * FROM crm_users WHERE username = $1 AND is_active = true', [username]);
            const user = result.rows[0];

            if (!user) {
                return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
            }

            // Verificar contraseña
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
            }

            // Generar Token
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET || 'secret_pos_2025',
                { expiresIn: '24h' }
            );

            // No enviar el hash de la contraseña
            delete user.password_hash;

            res.json({
                success: true,
                message: 'Bienvenido ' + user.name,
                token,
                user
            });

        } catch (error) {
            console.error('Error in login:', error);
            res.status(500).json({ success: false, error: 'Error en el servidor' });
        }
    }

    // Obtener info del usuario actual (Validar token)
    async getMe(req, res) {
        try {
            const user = req.user; // Viene del middleware de auth
            res.json({ success: true, user });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Error obteniendo perfil' });
        }
    }
}

export default new AuthController();
