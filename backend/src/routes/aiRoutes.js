import express from 'express';
import aiController from '../controllers/aiController.js';

const router = express.Router();

// Ruta para analizar descripción del negocio
router.post('/analyze-business', aiController.analyzeBusinessDescription);

// Ruta para generar cotización personalizada
router.post('/generate-quote', aiController.generatePersonalizedQuote);

// Ruta para chatbot
router.post('/chatbot', aiController.chatbotResponse);

// Ruta para estadísticas de IA
router.get('/stats', aiController.getAIStats);

// Ruta para resumen de costos
router.get('/cost-summary', aiController.getCostSummary);

export default router;
