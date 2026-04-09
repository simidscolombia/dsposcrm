import express from 'express';
import cloudController from '../controllers/cloudController.js';

const router = express.Router();

// Listar instancias cloud
router.get('/instances', cloudController.getInstances);

// Crear nueva instancia
router.post('/deploy', cloudController.deployInstance);

// Reiniciar / Eliminar (Acciones rápidas)
router.post('/action', cloudController.executeAction);

export default router;
