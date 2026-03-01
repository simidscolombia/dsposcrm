import express from 'express';
import { getAllRules, createRule, updateRule } from '../controllers/aiRuleController.js';

const router = express.Router();

router.get('/', getAllRules);
router.post('/', createRule);
router.put('/:id', updateRule);

export default router;
