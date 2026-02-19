-- ==========================================
-- SCRIPT DE DESPLIEGUE - DISCOVERY SYSTEMS POS
-- Ejecutar en SQL Editor de Supabase
-- ==========================================

-- 1. Tabla Leads (Versión CRM)
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    city VARCHAR(100),
    business_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Campos adicionales
    prize_won VARCHAR(100),
    pdf_url TEXT,
    status VARCHAR(20) DEFAULT 'new',
    business_name VARCHAR(255),
    business_description TEXT
);

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

-- 3. Tabla de Categorías (CRM)
CREATE TABLE IF NOT EXISTS crm_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    icon VARCHAR(50),
    "order" INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insertar categorías por defecto
INSERT INTO crm_categories (name, slug, icon, description, "order") 
VALUES
('Hardware', 'hardware', 'FaServer', 'Equipos físicos y terminales', 1),
('Software', 'software', 'FaCode', 'Licencias y programas', 2),
('Servicios', 'servicios', 'FaTools', 'Instalación y soporte', 3),
('Accesorios', 'accesorios', 'FaKeyboard', 'Periféricos y cables', 4)
ON CONFLICT (name) DO NOTHING;

-- 4. Tabla de Productos (CRM)
CREATE TABLE IF NOT EXISTS crm_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL,
    image_url TEXT,
    category VARCHAR(50), -- Mantener por compatibilidad simple
    stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insertar productos base
INSERT INTO crm_products (name, price, category, image_url, description) 
SELECT 'Licencia Sistema POS', 1500000, 'Software', '💻', 'Sistema completo de facturación e inventario'
WHERE NOT EXISTS (SELECT 1 FROM crm_products WHERE name = 'Licencia Sistema POS');

INSERT INTO crm_products (name, price, category, image_url, description)
SELECT 'Impresora Térmica 80mm', 350000, 'Hardware', '🖨️', 'Impresora de recibos de alta velocidad'
WHERE NOT EXISTS (SELECT 1 FROM crm_products WHERE name = 'Impresora Térmica 80mm');

INSERT INTO crm_products (name, price, category, image_url, description)
SELECT 'Lector Código de Barras', 120000, 'Hardware', '🔫', 'Lector láser USB con base'
WHERE NOT EXISTS (SELECT 1 FROM crm_products WHERE name = 'Lector Código de Barras');

-- 5. Tabla de Citas (Appointments)
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Tabla de Eventos de Analytics
CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices Recomendados
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp ON leads(whatsapp);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_lead_id ON ai_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_products_category ON crm_products(category);

-- 7. Tabla de Premios (Ruleta)
CREATE TABLE IF NOT EXISTS crm_prizes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    probability INTEGER DEFAULT 0, -- Porcentaje de aparición (0-100)
    type VARCHAR(50) DEFAULT 'discount', -- 'discount', 'free_month', 'hardware', 'ebook'
    value VARCHAR(100), -- Ej: '10%' o 'Impresora'
    icon VARCHAR(50), -- Emoji o icono
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insertar premios por defecto
INSERT INTO crm_prizes (name, description, probability, type, value, icon)
VALUES
('Descuento 5%', '5% de descuento en tu compra', 40, 'discount', '5%', '🏷️'),
('Descuento 10%', '10% de descuento en tu compra', 30, 'discount', '10%', '🔥'),
('Mes Gratis', '1 mes de suscripción gratis', 20, 'free_month', '1 mes', '📅'),
('Lector de Barras', 'Lector de código de barras gratis', 5, 'hardware', 'Lector', '🔫'),
('Ebook POS', 'Guía "Cómo gestionar tu negocio"', 5, 'ebook', 'PDF', '📚')
ON CONFLICT DO NOTHING;
