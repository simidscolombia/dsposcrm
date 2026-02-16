-- Tabla de Leads (Clientes Potenciales) - Nueva versión CRM
CREATE TABLE IF NOT EXISTS crm_leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    whatsapp VARCHAR(50),
    email VARCHAR(255),
    city VARCHAR(100),
    business_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Nuevo', -- Nuevo, Contactado, Demo, Cerrado
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de Productos (Inventario Básico)
CREATE TABLE IF NOT EXISTS crm_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'Hardware', 'Software', 'Service', 'Combo'
    image_url TEXT,
    stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de Cotizaciones (Header)
CREATE TABLE IF NOT EXISTS crm_quotes (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES crm_leads(id), -- Referencia a NUESTRA tabla
    total_amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    pdf_url TEXT,
    valid_until TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Detalle de Cotizaciones (Items)
CREATE TABLE IF NOT EXISTS crm_quote_items (
    id SERIAL PRIMARY KEY,
    quote_id INTEGER REFERENCES crm_quotes(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES crm_products(id),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insertar Datos Semilla de Productos
INSERT INTO crm_products (name, price, category, image_url, stock, description) VALUES
('Computador All-in-One', 1500000, 'Hardware', '🖥️', 10, 'Equipo todo en uno de alto rendimiento'),
('Impresora Térmica 80mm', 350000, 'Hardware', '🖨️', 50, 'Impresora pos rápida y silenciosa'),
('Impresora Bluetooth Portátil', 450000, 'Hardware', '📡', 20, 'Ideal para facturación en mesa'),
('Cajón Monedero', 180000, 'Hardware', '💵', 30, 'Cajón metálico resistente'),
('Lector Código de Barras 1D', 120000, 'Hardware', '🔫', 40, 'Lector láser básico'),
('Lector Omnidireccional 2D', 320000, 'Hardware', '📷', 15, 'Lee códigos QR y barras en cualquier ángulo'),
('Licencia Software POS (Anual)', 800000, 'Software', '💿', 9999, 'Licencia anual plan PRO'),
('Licencia Facturación Electrónica', 200000, 'Software', '🧾', 9999, 'Módulo DIAN ilimitado'),
('Tablet Pedidos', 600000, 'Movilidad', '📱', 25, 'Tablet Android 10 para meseros');
