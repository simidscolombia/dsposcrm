import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aiRoutes from './routes/aiRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/ai', aiRoutes);

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
