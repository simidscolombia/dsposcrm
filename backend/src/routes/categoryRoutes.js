import express from 'express';
import categoryController from '../controllers/categoryController.js';

const router = express.Router();

router.get('/', (req, res) => categoryController.getAll(req, res));
router.post('/', (req, res) => categoryController.create(req, res));
router.put('/:id', (req, res) => categoryController.update(req, res));
router.delete('/:id', (req, res) => categoryController.delete(req, res));

export default router;
