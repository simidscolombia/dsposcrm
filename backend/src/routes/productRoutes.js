import express from 'express';
import productController from '../controllers/productController.js';

const router = express.Router();

// Scraper de Productos
router.post('/analyze-url', (req, res) => productController.analyzeUrl(req, res));

// CRUD Completo
router.get('/', (req, res) => productController.getAll(req, res));
router.post('/', productController.create);
router.put('/:id', productController.update);
router.delete('/:id', productController.delete);

export default router;
