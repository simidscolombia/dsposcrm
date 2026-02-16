import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aiRoutes from './routes/aiRoutes.js';
import productRoutes from './routes/productRoutes.js';
import leadRoutes from './routes/leadRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4050; // Changed port to avoid conflicts

app.use(cors({
  origin: [
    'https://discovery-systems-pos.vercel.app',
    'https://discovery-systems-pos-git-main-simidscolombia.vercel.app',
    'http://localhost:5173', // Local frontend development
    'http://localhost:5174', // New port to avoid cache
    'http://localhost:5176', // Last used development port
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5176'
  ],
  credentials: true
}));
app.use(express.json());

// Rutas
app.use('/api/ai', aiRoutes);
app.use('/api/products', productRoutes);
app.use('/api/leads', leadRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    message: 'Discovery Systems POS Backend funcionando correctamente'
  });
});

app.listen(PORT, () => {
  console.log('🚀 Servidor Discovery Systems corriendo en puerto ' + PORT);
  console.log('✅ Health check: http://localhost:' + PORT + '/health');
  console.log('🤖 AI API: http://localhost:' + PORT + '/api/ai');
});
