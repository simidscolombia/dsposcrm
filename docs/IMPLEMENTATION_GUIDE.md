# 🚀 GUÍA DE IMPLEMENTACIÓN PASO A PASO
## Discovery Systems POS - Sistema Completo con IA

---

## 📋 TABLA DE CONTENIDOS

1. [Preparación del entorno](#1-preparación-del-entorno)
2. [Configuración de base de datos](#2-configuración-de-base-de-datos)
3. [Setup de Claude AI](#3-setup-de-claude-ai)
4. [Setup de WhatsApp (WAHA)](#4-setup-de-whatsapp-waha)
5. [Configuración del Backend](#5-configuración-del-backend)
6. [Configuración del Frontend](#6-configuración-del-frontend)
7. [Deploy a Railway + Vercel](#7-deploy-a-railway--vercel)
8. [Testing completo](#8-testing-completo)
9. [Monitoreo y mantenimiento](#9-monitoreo-y-mantenimiento)

---

## 1. PREPARACIÓN DEL ENTORNO

### 1.1 Requisitos previos
```bash
# Verificar versiones
node --version  # Debe ser v20+
npm --version   # Debe ser v9+
git --version   # Cualquier versión reciente
```

### 1.2 Clonar/Actualizar repositorio
```bash
# Si ya tienes el repo
cd discovery-systems-pos
git pull origin main

# Si es nuevo
git clone <tu-repo-url>
cd discovery-systems-pos
```

### 1.3 Estructura de carpetas
```bash
# Crear estructura si no existe
mkdir -p backend/src/{config,controllers,models,routes,services,middleware,templates,utils}
mkdir -p backend/migrations
mkdir -p frontend/src/{components,pages,hooks,services,styles}
mkdir -p docs
```

---

## 2. CONFIGURACIÓN DE BASE DE DATOS

### 2.1 PostgreSQL local (para desarrollo)
```bash
# Instalar PostgreSQL (si no lo tienes)
# macOS
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# Descargar desde: https://www.postgresql.org/download/windows/
```

### 2.2 Crear base de datos
```bash
# Conectar a PostgreSQL
psql postgres

# Crear base de datos y usuario
CREATE DATABASE discovery_pos;
CREATE USER discovery_user WITH ENCRYPTED PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE discovery_pos TO discovery_user;
\q
```

### 2.3 Ejecutar migraciones
```bash
cd backend

# Copiar las migraciones (ya las tienes)
# 001_update_leads_table.sql
# 002_create_appointments_table.sql
# 003_create_ai_interactions_table.sql
# 004_create_analytics_events_table.sql

# Ejecutar migraciones
psql -U discovery_user -d discovery_pos -f migrations/001_update_leads_table.sql
psql -U discovery_user -d discovery_pos -f migrations/002_create_appointments_table.sql
psql -U discovery_user -d discovery_pos -f migrations/003_create_ai_interactions_table.sql
psql -U discovery_user -d discovery_pos -f migrations/004_create_analytics_events_table.sql
```

### 2.4 Verificar tablas
```sql
-- Conectar y verificar
psql -U discovery_user -d discovery_pos

-- Ver tablas
\dt

-- Deberías ver:
-- leads
-- quotes
-- prizes
-- appointments
-- ai_interactions
-- analytics_events

-- Ver vistas
\dv

-- Deberías ver:
-- conversion_funnel
-- wizard_abandonment
-- prize_effectiveness
-- ai_cost_summary
```

---

## 3. SETUP DE CLAUDE AI

### 3.1 Crear cuenta en Anthropic
1. Ir a: https://console.anthropic.com/
2. Registrarse con email
3. Verificar cuenta
4. Agregar método de pago (requerido, pero solo cobran lo que uses)

### 3.2 Obtener API Key
1. En el dashboard, ir a "API Keys"
2. Click en "Create Key"
3. Copiar la key (empieza con `sk-ant-api03-...`)
4. ⚠️ **GUARDARLA DE FORMA SEGURA** (no se puede ver de nuevo)

### 3.3 Verificar que funciona
```bash
# Test con curl
curl https://api.anthropic.com/v1/messages \
  -H "content-type: application/json" \
  -H "x-api-key: TU_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-5-haiku-20241022",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hola, este es un test"}]
  }'

# Deberías recibir una respuesta JSON con el texto de Claude
```

### 3.4 Configurar límites de gasto (opcional pero recomendado)
1. En console.anthropic.com, ir a "Settings" > "Billing"
2. Configurar "Usage Limit" a $10/mes (por seguridad)
3. Configurar alertas cuando llegues al 50% y 80%

**Costo estimado:**
- 100 cotizaciones/mes: ~$1
- 500 cotizaciones/mes: ~$5
- 1000 cotizaciones/mes: ~$10

---

## 4. SETUP DE WHATSAPP (WAHA)

### 4.1 Opción A: WAHA Local (Desarrollo - GRATIS)

#### Instalar WAHA con Docker
```bash
# Instalar Docker si no lo tienes
# https://docs.docker.com/get-docker/

# Correr WAHA
docker run -d \
  --name waha \
  -p 3000:3000 \
  -e WHATSAPP_HOOK_URL=http://localhost:3001/webhooks/whatsapp \
  devlikeapro/waha
```

#### Configurar sesión
```bash
# 1. Ir a http://localhost:3000/
# 2. Crear sesión llamada "default"
# 3. Escanear QR con WhatsApp
# 4. Esperar a que diga "WORKING"
```

### 4.2 Opción B: WhatsApp Business API (Producción - Oficial)

Para producción, usar WhatsApp Business API oficial:
- Twilio: https://www.twilio.com/whatsapp
- MessageBird: https://www.messagebird.com/
- 360dialog: https://www.360dialog.com/

**Costo:**
- Primeras 1000 conversaciones/mes: GRATIS
- Después: ~$0.03-0.05 por conversación

### 4.3 Verificar funcionamiento
```bash
# Test de envío de mensaje
curl -X POST http://localhost:3000/api/sendText \
  -H "Content-Type: application/json" \
  -d '{
    "session": "default",
    "chatId": "573001234567@c.us",
    "text": "Test desde WAHA!"
  }'

# Deberías recibir el mensaje en WhatsApp
```

---

## 5. CONFIGURACIÓN DEL BACKEND

### 5.1 Instalar dependencias
```bash
cd backend

# Copiar las dependencias del package.json que te di
npm install
```

### 5.2 Configurar variables de entorno
```bash
# Copiar .env.example a .env
cp .env.example .env

# Editar .env con tus valores
nano .env  # o usa tu editor favorito
```

**Variables críticas a configurar:**
```bash
# Database (PostgreSQL local)
DATABASE_URL=postgresql://discovery_user:tu_password@localhost:5432/discovery_pos

# Anthropic (Claude AI)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxx  # Tu key de Anthropic

# WhatsApp (WAHA)
WAHA_URL=http://localhost:3000
WAHA_SESSION=default
DISCOVERY_WHATSAPP=573001234567  # Tu número de WhatsApp

# Server
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 5.3 Copiar archivos de servicios
```bash
# Copiar los archivos que creé:
cp /ruta/claudeService.js src/services/
cp /ruta/pdfService.js src/services/
cp /ruta/whatsappService.js src/services/
cp /ruta/aiController.js src/controllers/
```

### 5.4 Crear archivo principal del servidor
```bash
# Editar src/server.js
nano src/server.js
```

```javascript
// src/server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import aiRoutes from './routes/aiRoutes.js';
// ... otros imports

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(compression());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/ai', aiRoutes);
// ... otras rutas

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

### 5.5 Iniciar servidor
```bash
npm run dev

# Deberías ver:
# 🚀 Server running on port 3001
```

### 5.6 Verificar endpoints
```bash
# Health check
curl http://localhost:3001/health

# Test AI endpoint
curl -X POST http://localhost:3001/api/ai/chatbot \
  -H "Content-Type: application/json" \
  -d '{
    "question": "¿Cuánto cuesta Discovery Systems?",
    "leadId": null
  }'
```

---

## 6. CONFIGURACIÓN DEL FRONTEND

### 6.1 Instalar dependencias
```bash
cd frontend
npm install
```

### 6.2 Configurar variables de entorno
```bash
# Crear .env
echo "VITE_API_URL=http://localhost:3001" > .env
```

### 6.3 Copiar componentes
```bash
# Copiar los componentes que creé:
cp /ruta/ActionScreen.jsx src/components/PostRoulette/
cp /ruta/ChatbotWidget.jsx src/components/PostRoulette/
```

### 6.4 Actualizar App.jsx
```javascript
// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import QuotePage from './pages/QuotePage';
import ActionScreen from './components/PostRoulette/ActionScreen';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<QuotePage />} />
        <Route path="/resultado" element={<ActionScreen />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### 6.5 Iniciar desarrollo
```bash
npm run dev

# Deberías ver:
# VITE v5.x.x ready in xxx ms
# ➜ Local: http://localhost:5173/
```

### 6.6 Verificar que funciona
1. Abrir http://localhost:5173/
2. Completar wizard
3. Girar ruleta
4. Verificar que aparece ActionScreen
5. Probar chatbot con IA

---

## 7. DEPLOY A RAILWAY + VERCEL

### 7.1 Deploy Backend a Railway

#### Conectar repositorio
1. Ir a https://railway.app/
2. Click en "New Project"
3. Seleccionar "Deploy from GitHub repo"
4. Autorizar Railway en GitHub
5. Seleccionar tu repositorio
6. Railway detectará automáticamente Node.js

#### Configurar variables de entorno
```bash
# En Railway dashboard > Variables:
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxx
WAHA_URL=http://tu-waha-instance:3000
WAHA_SESSION=default
DISCOVERY_WHATSAPP=573001234567
NODE_ENV=production

# Railway auto-genera:
DATABASE_URL=postgresql://...  # Auto-generado
PORT=XXXX  # Auto-asignado
PUBLIC_URL=https://tu-app.railway.app  # Auto-asignado
```

#### Agregar PostgreSQL
1. En Railway, click "New" > "Database" > "PostgreSQL"
2. Railway conecta automáticamente con DATABASE_URL

#### Deploy
```bash
# Railway hace deploy automático en cada push
git add .
git commit -m "Deploy completo con IA"
git push origin main

# Railway detecta y deploya automáticamente
# Ver logs en Railway dashboard
```

### 7.2 Deploy Frontend a Vercel

#### Conectar repositorio
1. Ir a https://vercel.com/
2. Click "New Project"
3. Importar tu repositorio de GitHub
4. Configurar:
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

#### Variables de entorno
```bash
VITE_API_URL=https://tu-backend.railway.app
```

#### Deploy
```bash
# Vercel también hace deploy automático
git push origin main

# Ver deploy en Vercel dashboard
# URL: https://tu-app.vercel.app
```

### 7.3 Configurar dominio personalizado (opcional)
```bash
# En Vercel:
cotiza.simids.co -> tu-app.vercel.app

# En Railway:
api.simids.co -> tu-backend.railway.app

# Configurar DNS:
# A record: api -> Railway IP
# CNAME: cotiza -> Vercel
```

---

## 8. TESTING COMPLETO

### 8.1 Test del flujo completo
```bash
# 1. Usuario inicia wizard
# 2. Completa preguntas (con IA)
# 3. Gira ruleta
# 4. Gana premio
# 5. Ve ActionScreen
# 6. Prueba chatbot
# 7. Descarga PDF
# 8. Click en WhatsApp
# 9. Recibe mensaje automático

# Verificar cada paso en:
# - Frontend
# - Backend logs
# - Database
# - WhatsApp
```

### 8.2 Test de IA
```bash
# Test 1: Análisis de negocio
curl -X POST https://tu-api.railway.app/api/ai/analyze-business \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Tengo un restaurante con 2 sucursales",
    "leadId": null
  }'

# Test 2: Chatbot
curl -X POST https://tu-api.railway.app/api/ai/chatbot \
  -H "Content-Type: application/json" \
  -d '{
    "question": "¿Cuánto tarda la implementación?",
    "leadId": null
  }'
```

### 8.3 Test de WhatsApp
```bash
# Enviar mensaje de prueba
curl -X POST https://tu-api.railway.app/api/quote/send-whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "3001234567",
    "leadName": "Test",
    "prize": "10% de descuento",
    "pdfUrl": "https://...",
    "total": 5000000
  }'
```

### 8.4 Verificar costos de IA
```bash
# Ver estadísticas
curl https://tu-api.railway.app/api/ai/stats

# Ver resumen de costos
curl https://tu-api.railway.app/api/ai/cost-summary
```

---

## 9. MONITOREO Y MANTENIMIENTO

### 9.1 Monitorear costos
```sql
-- Conectar a PostgreSQL
psql $DATABASE_URL

-- Ver costos del día
SELECT * FROM ai_cost_summary 
WHERE date = CURRENT_DATE;

-- Ver costos del mes
SELECT 
  SUM(total_cost_usd) as monthly_cost,
  SUM(total_interactions) as total_calls
FROM ai_cost_summary 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE);
```

### 9.2 Analytics
```sql
-- Funnel de conversión
SELECT * FROM conversion_funnel;

-- Abandono por paso
SELECT * FROM wizard_abandonment;

-- Premios más efectivos
SELECT * FROM prize_effectiveness;
```

### 9.3 Alertas recomendadas
- ⚠️ Costo diario de IA > $5
- ⚠️ Tasa de error IA > 5%
- ⚠️ Tasa de conversión wizard < 50%
- ⚠️ WhatsApp sin enviar > 10 mensajes

### 9.4 Backups
```bash
# Backup automático diario (configurar en Railway)
# O manual:
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

---

## ✅ CHECKLIST FINAL

- [ ] PostgreSQL corriendo con todas las tablas
- [ ] Claude AI funcionando (test con curl)
- [ ] WAHA/WhatsApp enviando mensajes
- [ ] Backend corriendo en Railway
- [ ] Frontend desplegado en Vercel
- [ ] Wizard con IA funcional
- [ ] Chatbot respondiendo
- [ ] PDFs generándose
- [ ] WhatsApp enviando automático
- [ ] Analytics recolectando datos
- [ ] Costos monitoreados

---

## 🆘 TROUBLESHOOTING

### Error: "ANTHROPIC_API_KEY not found"
```bash
# Verificar que la variable esté en .env
cat .env | grep ANTHROPIC

# En Railway, verificar en Variables tab
```

### Error: "Cannot connect to PostgreSQL"
```bash
# Verificar conexión local
psql -U discovery_user -d discovery_pos -c "SELECT 1"

# Verificar DATABASE_URL en Railway
echo $DATABASE_URL
```

### Error: "WhatsApp no envía mensajes"
```bash
# Verificar estado de WAHA
curl http://localhost:3000/api/sessions/default

# Re-escanear QR si es necesario
```

### Error: "Claude AI muy lento"
```bash
# Verificar latencia
time curl -X POST .../api/ai/chatbot ...

# Considerar cambiar a modelo más rápido (Haiku es el más rápido)
```

---

## 📊 COSTOS FINALES ESTIMADOS

### Primeros 3 meses (0-500 cotizaciones/mes)
```
Railway (Backend + DB):     $0/mes
Vercel (Frontend):          $0/mes
Claude AI:                  $1-5/mes
WhatsApp (WAHA):            $0/mes
━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:                      $1-5/mes ✅
```

### Crecimiento (500-2000 cotizaciones/mes)
```
Railway:                    $5-20/mes
Vercel:                     $0/mes
Claude AI:                  $5-20/mes
WhatsApp Business API:      $15-60/mes
━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL:                      $25-100/mes ✅
```

---

## 🎉 ¡LISTO!

Tu sistema Discovery POS con IA está completamente funcional.

**Próximos pasos:**
1. Probar con clientes reales
2. Iterar basado en feedback
3. Optimizar conversión del funnel
4. Escalar según demanda

**¿Preguntas?**
Documentación completa en `/docs`
