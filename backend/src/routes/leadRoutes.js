import express from 'express';
import leadController from '../controllers/leadController.js';

const router = express.Router();

router.post('/', (req, res) => leadController.create(req, res));
router.get('/', (req, res) => leadController.getAll(req, res));

export default router;
