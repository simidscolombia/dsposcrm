import express from 'express';
import productController from '../controllers/productController.js';

const router = express.Router();

// CRUD Completo
router.get('/', productController.getAll);
router.post('/', productController.create);
router.put('/:id', productController.update);
router.delete('/:id', productController.delete);

export default router;
