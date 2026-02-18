-- ==========================================
-- SCRIPT DE DESPLIEGUE - DISCOVERY SYSTEMS POS
-- Ejecutar en SQL Editor de Supabase
-- ==========================================

-- 1. Actualizar tabla leads y asegurar que exista
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    city VARCHAR(100),
    business_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Agregar columnas nuevas si no existen
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS prize_won VARCHAR(100),
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'new',
ADD COLUMN IF NOT EXISTS business_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS business_description TEXT;

-- 2. Tabla de Interacciones con IA
CREATE TABLE IF NOT EXISTS ai_interactions (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
    interaction_type VARCHAR(50) NOT NULL,
    question TEXT,
    ai_response TEXT,
    model_used VARCHAR(50) DEFAULT 'claude-3-5-haiku-20241022',
    tokens_used INTEGER DEFAULT 0,
    cost_usd DECIMAL(10, 6) DEFAULT 0,
    response_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    context_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Tabla de Productos CRM (Para cotizador)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    image_url TEXT,
    stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insertar productos base si la tabla está vacía
INSERT INTO products (name, price, category, image_url, description) 
SELECT 'Licencia Sistema POS', 1500000, 'Software', '💻', 'Sistema completo de facturación e inventario'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Licencia Sistema POS');

INSERT INTO products (name, price, category, image_url, description)
SELECT 'Impresora Térmica 80mm', 350000, 'Hardware', '🖨️', 'Impresora de recibos de alta velocidad'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Impresora Térmica 80mm');

INSERT INTO products (name, price, category, image_url, description)
SELECT 'Lector Código de Barras', 120000, 'Hardware', '🔫', 'Lector láser USB con base'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Lector Código de Barras');

-- 4. Tabla de Citas (Appointments)
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Tabla de Eventos de Analytics
CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL, -- wizard_start, roulette_spin, etc
    event_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices Recomendados
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp ON leads(whatsapp);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_lead_id ON ai_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
