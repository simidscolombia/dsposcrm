import express from 'express';
import productController from '../controllers/productController.js';

const router = express.Router();

router.get('/', (req, res) => productController.getAll(req, res));

export default router;
