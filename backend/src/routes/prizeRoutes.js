
import express from 'express';
import prizeController from '../controllers/prizeController.js';

const router = express.Router();

router.get('/', (req, res) => prizeController.getAll(req, res));
router.post('/', (req, res) => prizeController.create(req, res));
router.put('/:id', (req, res) => prizeController.update(req, res));
router.delete('/:id', (req, res) => prizeController.delete(req, res));

export default router;
