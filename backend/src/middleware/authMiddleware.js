import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ success: false, error: 'Acceso denegado, token faltante' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'secret_pos_2025', (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, error: 'Sesión expirada o token inválido' });
        }
        req.user = user;
        next();
    });
};

// Middleware para validar que es admin
export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, error: 'Permiso denegado: Se requiere rol de administrador' });
    }
};
