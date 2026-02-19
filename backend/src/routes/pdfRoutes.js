
import express from 'express';
import pdfController from '../controllers/pdfController.js';

const router = express.Router();

// Ruta dummy por ahora
router.post('/generate', pdfController.generateQuotePdf);

export default router;
