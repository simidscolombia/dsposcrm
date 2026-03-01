-- ==========================================
-- DISCOVERY SYSTEMS - CATEGORÍAS Y PRODUCTOS
-- Fase 2: Estructura de Inventario Refinada
-- ==========================================

-- 1. Tabla de Categorías
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

-- 2. Asegurar que la tabla de productos tenga category_id
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_products' AND column_name='category_id') THEN
        ALTER TABLE crm_products ADD COLUMN category_id INTEGER REFERENCES crm_categories(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Tabla de Premios (por si falta)
CREATE TABLE IF NOT EXISTS crm_prizes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    probability INTEGER DEFAULT 0,
    type VARCHAR(50) DEFAULT 'discount',
    value VARCHAR(100),
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Datos por defecto: Categorías
INSERT INTO crm_categories (name, slug, icon, description, "order") 
VALUES
('Hardware', 'hardware', 'FaServer', 'Equipos físicos y terminales', 1),
('Software', 'software', 'FaCode', 'Licencias y programas', 2),
('Servicios', 'servicios', 'FaTools', 'Instalación y soporte', 3),
('Accesorios', 'accesorios', 'FaKeyboard', 'Periféricos y cables', 4)
ON CONFLICT (name) DO NOTHING;

-- 5. Datos por defecto: Premios
INSERT INTO crm_prizes (name, description, probability, type, value, icon)
VALUES
('Descuento 5%', '5% de descuento en tu compra', 40, 'discount', '5%', '🏷️'),
('Descuento 10%', '10% de descuento en tu compra', 30, 'discount', '10%', '🔥'),
('Mes Gratis', '1 mes de suscripción gratis', 20, 'free_month', '1 mes', '📅'),
('Lector de Barras', 'Lector de código de barras gratis', 5, 'hardware', 'Lector', '🔫'),
('Ebook POS', 'Guía "Cómo gestionar tu negocio"', 5, 'ebook', 'PDF', '📚')
ON CONFLICT DO NOTHING;
