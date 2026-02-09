# 📁 ESTRUCTURA DEL PROYECTO DISCOVERY SYSTEMS POS

```
discovery-systems-pos/
│
├── 📂 backend/
│   ├── 📂 src/
│   │   ├── 📂 config/
│   │   │   ├── database.js          # Config PostgreSQL
│   │   │   ├── claude.js            # Config Anthropic API
│   │   │   └── whatsapp.js          # Config WAHA
│   │   │
│   │   ├── 📂 controllers/
│   │   │   ├── leadController.js    # Gestión de leads
│   │   │   ├── quoteController.js   # Generación de cotizaciones
│   │   │   ├── rouletteController.js # Lógica de ruleta
│   │   │   ├── aiController.js      # Interacción con Claude AI
│   │   │   └── adminController.js   # Panel admin
│   │   │
│   │   ├── 📂 models/
│   │   │   ├── Lead.js              # Modelo de lead
│   │   │   ├── Quote.js             # Modelo de cotización
│   │   │   ├── Prize.js             # Premios de ruleta
│   │   │   └── Appointment.js       # Citas agendadas
│   │   │
│   │   ├── 📂 routes/
│   │   │   ├── leadRoutes.js
│   │   │   ├── quoteRoutes.js
│   │   │   ├── aiRoutes.js
│   │   │   └── adminRoutes.js
│   │   │
│   │   ├── 📂 services/
│   │   │   ├── claudeService.js     # Servicio IA
│   │   │   ├── pdfService.js        # Generación PDF
│   │   │   ├── whatsappService.js   # Envío WhatsApp
│   │   │   └── analyticsService.js  # Analytics
│   │   │
│   │   ├── 📂 middleware/
│   │   │   ├── errorHandler.js
│   │   │   ├── rateLimiter.js       # Rate limiting para IA
│   │   │   └── validator.js
│   │   │
│   │   ├── 📂 templates/
│   │   │   ├── quotePDF.html        # Template PDF
│   │   │   └── whatsappMessage.js   # Templates WhatsApp
│   │   │
│   │   ├── 📂 utils/
│   │   │   ├── logger.js
│   │   │   └── helpers.js
│   │   │
│   │   └── server.js                # Entry point
│   │
│   ├── 📂 migrations/
│   │   ├── 001_create_leads.sql
│   │   ├── 002_create_quotes.sql
│   │   ├── 003_create_prizes.sql
│   │   └── 004_create_appointments.sql
│   │
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── 📂 frontend/
│   ├── 📂 src/
│   │   ├── 📂 components/
│   │   │   ├── 📂 Wizard/
│   │   │   │   ├── WizardStep.jsx
│   │   │   │   ├── NameCapture.jsx
│   │   │   │   ├── ConversationalStep.jsx  # Con IA
│   │   │   │   └── WhatsAppCapture.jsx
│   │   │   │
│   │   │   ├── 📂 Roulette/
│   │   │   │   ├── SpinningWheel.jsx
│   │   │   │   └── PrizeModal.jsx
│   │   │   │
│   │   │   ├── 📂 PostRoulette/
│   │   │   │   ├── ActionScreen.jsx      # ⭐ NUEVO
│   │   │   │   ├── ChatbotWidget.jsx     # ⭐ NUEVO (IA)
│   │   │   │   └── ActionButtons.jsx
│   │   │   │
│   │   │   ├── 📂 Admin/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── LeadsTable.jsx
│   │   │   │   ├── Analytics.jsx
│   │   │   │   └── Settings.jsx
│   │   │   │
│   │   │   └── 📂 Common/
│   │   │       ├── Button.jsx
│   │   │       ├── Input.jsx
│   │   │       └── LoadingSpinner.jsx
│   │   │
│   │   ├── 📂 pages/
│   │   │   ├── QuotePage.jsx
│   │   │   ├── AdminPage.jsx
│   │   │   └── ThankYouPage.jsx
│   │   │
│   │   ├── 📂 services/
│   │   │   ├── api.js
│   │   │   └── analytics.js
│   │   │
│   │   ├── 📂 hooks/
│   │   │   ├── useWizard.js
│   │   │   ├── useAI.js              # ⭐ NUEVO
│   │   │   └── useAnalytics.js
│   │   │
│   │   ├── 📂 styles/
│   │   │   └── tailwind.css
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── 📂 public/
│   │   ├── discovery-clickable.png   # ⭐ Imagen para WhatsApp
│   │   ├── qr-code.png              # ⭐ QR alternativo
│   │   └── demo-video.mp4
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── 📂 docs/
│   ├── API.md                        # Documentación API
│   ├── SETUP.md                      # Guía de instalación
│   ├── USER_MANUAL.md                # Manual para Discovery Systems
│   └── AI_INTEGRATION.md             # Guía de IA
│
└── 📂 assets/
    ├── 📂 images/
    │   ├── logo-discovery.png
    │   └── whatsapp-template.psd
    │
    └── 📂 design/
        └── mockups.fig

```

---

## 🆕 ARCHIVOS NUEVOS A CREAR

### Backend
1. ✅ `aiController.js` - Gestión de requests a Claude
2. ✅ `claudeService.js` - Lógica de IA
3. ✅ `pdfService.js` - Generación de PDF con Puppeteer
4. ✅ `whatsappService.js` - Envío automático
5. ✅ `analyticsService.js` - Tracking de métricas
6. ✅ `Appointment.js` - Modelo de citas

### Frontend
1. ✅ `ActionScreen.jsx` - Pantalla post-ruleta
2. ✅ `ChatbotWidget.jsx` - Chatbot con IA
3. ✅ `ConversationalStep.jsx` - Wizard con IA
4. ✅ `WhatsAppCapture.jsx` - Captura de teléfono
5. ✅ `useAI.js` - Hook para IA
6. ✅ `Analytics.jsx` - Dashboard analytics

### Assets
1. ✅ Imagen clickeable para WhatsApp
2. ✅ QR code
3. ✅ Template PDF profesional

---

## 🔄 ARCHIVOS A MODIFICAR

### Backend
- `leadController.js` - Agregar captura de WhatsApp
- `quoteController.js` - Integrar generación con IA
- `database.js` - Agregar tablas nuevas

### Frontend
- `WizardStep.jsx` - Integrar IA en preguntas
- `SpinningWheel.jsx` - Redirigir a ActionScreen
- `App.jsx` - Agregar rutas admin

---

## 📦 NUEVAS DEPENDENCIAS

### Backend
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.0",        // ⭐ Claude AI
    "puppeteer": "^21.0.0",                 // ⭐ PDF generation
    "axios": "^1.6.0",                      // WhatsApp API
    "bull": "^4.12.0",                      // Queue para envíos
    "redis": "^4.6.0"                       // Cache para IA
  }
}
```

### Frontend
```json
{
  "dependencies": {
    "react-chatbot-kit": "^2.2.0",         // ⭐ Chatbot UI
    "react-calendar": "^4.8.0",            // ⭐ Calendly alt
    "chart.js": "^4.4.0",                  // ⭐ Analytics
    "react-chartjs-2": "^5.2.0"
  }
}
```

---

## 🗄️ ESQUEMA DE BASE DE DATOS ACTUALIZADO

```sql
-- Nueva tabla: appointments
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id),
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, completed, cancelled
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Nueva tabla: ai_interactions (para analytics)
CREATE TABLE ai_interactions (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id),
    question TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    model_used VARCHAR(50),
    tokens_used INTEGER,
    cost_usd DECIMAL(10, 4),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Nueva tabla: analytics_events
CREATE TABLE analytics_events (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id),
    event_type VARCHAR(50), -- wizard_start, wizard_step, roulette_spin, action_clicked
    event_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Modificar tabla leads: agregar campos
ALTER TABLE leads ADD COLUMN whatsapp VARCHAR(20);
ALTER TABLE leads ADD COLUMN prize_won VARCHAR(100);
ALTER TABLE leads ADD COLUMN pdf_url TEXT;
ALTER TABLE leads ADD COLUMN status VARCHAR(20) DEFAULT 'new';
```

---

**Estado:** ✅ Estructura definida
**Siguiente paso:** Implementar código backend
