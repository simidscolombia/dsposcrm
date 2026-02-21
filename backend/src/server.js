import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './config/database.js'; // Importar DB
import aiRoutes from './routes/aiRoutes.js';
import productRoutes from './routes/productRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import adminDbRoutes from './routes/adminDbRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import pdfRoutes from './routes/pdfRoutes.js'; // Restore missing import
import prizeRoutes from './routes/prizeRoutes.js'; // Nueva ruta de premios
import crmRoutes from './routes/crmRoutes.js'; // CRM completo
import quoteRoutes from './routes/quoteRoutes.js'; // Cotizaciones
import configRoutes from './routes/configRoutes.js'; // Configuración
import pipelineRoutes from './routes/pipelineRoutes.js'; // Pipeline ventas
import clientRoutes from './routes/clientRoutes.js'; // Clientes

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4050; // Changed port to avoid conflicts

app.use(cors({
  // ... (keep existing cors config)
}));
app.use(express.json());

// Rutas
app.use('/api/pdf', pdfRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/products', productRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/admin', adminDbRoutes); // Ruta para DB Init
app.use('/api/categories', categoryRoutes); // Ruta para Categorías
app.use('/api/prizes', prizeRoutes); // Ruta para Premios
app.use('/api/admin/crm', crmRoutes); // CRM completo
app.use('/api/quotes', quoteRoutes); // Cotizaciones
app.use('/api/config', configRoutes); // Configuración
app.use('/api/pipeline', pipelineRoutes); // Pipeline ventas
app.use('/api/clients', clientRoutes); // Clientes

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    message: 'Discovery Systems POS Backend funcionando correctamente'
  });
});

// Endpoint Temporal de Diagnóstico
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ status: 'OK', time: result.rows[0].now, config: 'Connection Successful' });
  } catch (err) {
    console.error('DB Error:', err);
    res.status(500).json({
      status: 'ERROR',
      message: err.message,
      code: err.code,
      detail: 'Revisa la contraseña y el Project ID'
    });
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log('🚀 Servidor Discovery Systems corriendo en puerto ' + PORT);
    console.log('✅ Health check: http://localhost:' + PORT + '/health');
    console.log('🤖 AI API: http://localhost:' + PORT + '/api/ai');
  });
}

export default app;
