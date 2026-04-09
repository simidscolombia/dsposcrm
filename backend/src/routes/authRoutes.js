import express from 'express';
import authController from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Ruta de Login
router.post('/login', authController.login);

// Ruta para verificar sesión
router.get('/me', authenticateToken, authController.getMe);

export default router;
