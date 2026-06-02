-- ==========================================
-- DISCOVERY SYSTEMS AI CRM — ESQUEMA COMPLETO
-- Fase 1: Base del CRM + Flujo de Venta
-- Ejecutar en SQL Editor de Supabase
-- Fecha: 20 Feb 2026
-- ==========================================

-- ============================================
-- 1. TABLA: ASESORES (Advisors/Team)
-- ============================================
CREATE TABLE IF NOT EXISTS crm_advisors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    whatsapp VARCHAR(20),
    role VARCHAR(50) DEFAULT 'sales', -- 'sales', 'support', 'admin', 'dev'
    is_active BOOLEAN DEFAULT true,
    personality TEXT, -- Descripción de personalidad para IA
    avatar_url TEXT,
    shift_start TIME, -- Horario inicio
    shift_end TIME, -- Horario fin
    works_weekends BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insertar asesores reales
INSERT INTO crm_advisors (name, city, whatsapp, role, shift_start, shift_end, works_weekends) VALUES
('Daniel', 'Colombia', '3205792169', 'admin', '08:00', '20:00', true),
('Keren Hapuc', 'Bogotá', '3164300656', 'sales', '08:00', '18:00', false),
('Anaid', 'Bucaramanga', '3170111292', 'sales', '08:00', '18:00', false),
('Darney', 'Medellín', NULL, 'sales', '08:00', '18:00', false),
('Sebastián Castillo', 'Bucaramanga', '3132766537', 'support', '09:00', '13:00', false)
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. TABLA: LEADS (Expandida de la existente)
-- Clientes potenciales - desde primer contacto
-- ============================================
-- Agregar campos a la tabla leads existente
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS advisor_id INTEGER REFERENCES crm_advisors(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'web'; -- 'web', 'whatsapp', 'facebook', 'referral'
ALTER TABLE leads ADD COLUMN IF NOT EXISTS system_type VARCHAR(50); -- 'software', 'combo', 'mix'
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pipeline_stage VARCHAR(50) DEFAULT 'new'; -- 'new','contacted','quoted','demo','negotiating','won','lost'
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_reason TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_followup_at TIMESTAMP;

-- Índices para pipeline
CREATE INDEX IF NOT EXISTS idx_leads_pipeline ON leads(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_leads_advisor ON leads(advisor_id);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);

-- ============================================
-- 3. TABLA: COTIZACIONES (Quotes) — Expandida
-- ============================================
-- Modificar tabla existente si es necesario
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS prize_id INTEGER REFERENCES crm_prizes(id);
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS prize_label VARCHAR(100);
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS prize_detail TEXT;
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5,2) DEFAULT 0;
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS final_amount DECIMAL(12,2);
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS client_phone VARCHAR(20);
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS client_city VARCHAR(100);
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS client_business VARCHAR(255);
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS system_type VARCHAR(50);
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS advisor_id INTEGER REFERENCES crm_advisors(id);
ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- Si la tabla no existe, crearla completa
CREATE TABLE IF NOT EXISTS crm_quotes (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
    client_name VARCHAR(255),
    client_phone VARCHAR(20),
    client_city VARCHAR(100),
    client_business VARCHAR(255),
    system_type VARCHAR(50),
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    final_amount DECIMAL(12,2) DEFAULT 0,
    prize_id INTEGER REFERENCES crm_prizes(id),
    prize_label VARCHAR(100),
    prize_detail TEXT,
    advisor_id INTEGER REFERENCES crm_advisors(id),
    status VARCHAR(50) DEFAULT 'draft', -- 'draft','sent','viewed','accepted','expired','rejected'
    pdf_url TEXT,
    expires_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Items de la cotización (si no existe)
CREATE TABLE IF NOT EXISTS crm_quote_items (
    id SERIAL PRIMARY KEY,
    quote_id INTEGER REFERENCES crm_quotes(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES crm_products(id),
    product_name VARCHAR(255) NOT NULL,
    product_category VARCHAR(50),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 4. TABLA: CLIENTES EXISTENTES (Clients)
-- Clientes que ya compraron — para cobros y soporte
-- ============================================
CREATE TABLE IF NOT EXISTS crm_clients (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL, -- Enlace al lead original
    business_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    whatsapp VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    city VARCHAR(100),
    address TEXT,
    nit VARCHAR(20),
    
    -- Plan y facturación
    plan_type VARCHAR(50) NOT NULL DEFAULT 'local', -- 'local', 'cloud', 'cloud_fe'
    monthly_amount DECIMAL(12,2) DEFAULT 0, -- Monto mensual
    billing_day INTEGER DEFAULT 28, -- Día del mes que se cobra
    payment_status VARCHAR(50) DEFAULT 'active', -- 'active', 'grace', 'suspended', 'cancelled'
    last_payment_date DATE,
    next_billing_date DATE,
    
    -- Técnico
    pos_version VARCHAR(20),
    server_name VARCHAR(100), -- Nombre del droplet en DigitalOcean
    cloud_url TEXT, -- URL de la nube (ej: restaurante.poslatino.com)
    anydesk_id VARCHAR(50), -- ID de AnyDesk
    
    -- Asignación
    advisor_id INTEGER REFERENCES crm_advisors(id),
    
    -- Metadata
    notes TEXT,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'vip'
    is_active BOOLEAN DEFAULT true,
    started_at DATE, -- Fecha que se hizo cliente
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_whatsapp ON crm_clients(whatsapp);
CREATE INDEX IF NOT EXISTS idx_clients_plan ON crm_clients(plan_type);
CREATE INDEX IF NOT EXISTS idx_clients_payment_status ON crm_clients(payment_status);
CREATE INDEX IF NOT EXISTS idx_clients_city ON crm_clients(city);

-- ============================================
-- 5. TABLA: PAGOS (Payments)
-- Historial de pagos mensuales
-- ============================================
CREATE TABLE IF NOT EXISTS crm_payments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES crm_clients(id) ON DELETE CASCADE,
    
    period_month INTEGER NOT NULL, -- 1-12
    period_year INTEGER NOT NULL, -- 2026
    amount DECIMAL(12,2) NOT NULL,
    
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'overdue', 'waived'
    payment_method VARCHAR(50), -- 'transfer', 'wompi', 'nequi', 'daviplata', 'cash', 'bold'
    payment_date TIMESTAMP,
    
    -- Comprobante
    receipt_url TEXT, -- URL del comprobante subido
    receipt_verified BOOLEAN DEFAULT false,
    verified_by VARCHAR(100), -- Quien verificó
    verified_at TIMESTAMP,
    
    -- Cuenta de cobro
    invoice_sent BOOLEAN DEFAULT false,
    invoice_sent_at TIMESTAMP,
    invoice_url TEXT, -- URL de la factura electrónica
    
    -- Link de pago
    payment_link TEXT, -- Link de Wompi
    payment_link_id VARCHAR(100), -- ID en Wompi
    
    -- Cobro automático
    reminder_count INTEGER DEFAULT 0, -- Cuántos recordatorios se han enviado
    last_reminder_at TIMESTAMP,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_client ON crm_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON crm_payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_period ON crm_payments(period_year, period_month);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_unique_period ON crm_payments(client_id, period_year, period_month);

-- ============================================
-- 6. TABLA: MENSAJES (Messages)
-- Chat interno con clientes/leads
-- ============================================
CREATE TABLE IF NOT EXISTS crm_messages (
    id SERIAL PRIMARY KEY,
    
    -- Puede ser de un lead o un cliente
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
    client_id INTEGER REFERENCES crm_clients(id) ON DELETE SET NULL,
    
    -- Mensaje
    direction VARCHAR(10) NOT NULL, -- 'inbound' (cliente→nosotros), 'outbound' (nosotros→cliente)
    sender_type VARCHAR(20) NOT NULL, -- 'client', 'advisor', 'ai', 'system'
    sender_name VARCHAR(100),
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'document', 'audio', 'template'
    media_url TEXT,
    
    -- WhatsApp
    wa_message_id VARCHAR(100), -- ID del mensaje en WhatsApp API
    wa_status VARCHAR(20), -- 'sent', 'delivered', 'read'
    
    -- Si fue escalación
    is_escalation BOOLEAN DEFAULT false,
    escalation_reason TEXT,
    escalation_resolved BOOLEAN DEFAULT false,
    escalation_response TEXT,
    
    channel VARCHAR(20) DEFAULT 'whatsapp', -- 'whatsapp', 'portal', 'internal'
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_lead ON crm_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_client ON crm_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON crm_messages(created_at DESC);

-- ============================================
-- 7. TABLA: TICKETS DE SOPORTE
-- ============================================
CREATE TABLE IF NOT EXISTS crm_tickets (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES crm_clients(id) ON DELETE CASCADE,
    
    -- Descripción
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 'printer', 'software', 'scale', 'barcode', 'login', 'network', 'billing', 'other'
    
    -- Estado
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'waiting_client', 'waiting_team', 'resolved', 'closed'
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    level INTEGER DEFAULT 1, -- 1=IA, 2=Técnico, 3=Elkin+Dev
    
    -- Asignación
    assigned_to INTEGER REFERENCES crm_advisors(id),
    resolved_by INTEGER REFERENCES crm_advisors(id),
    
    -- Resolución
    resolution TEXT,
    resolution_learned BOOLEAN DEFAULT false, -- Se agregó a la base de conocimiento?
    
    -- SLA
    first_response_at TIMESTAMP,
    resolved_at TIMESTAMP,
    satisfaction_rating INTEGER, -- 1-5
    satisfaction_comment TEXT,
    
    -- AnyDesk
    anydesk_session BOOLEAN DEFAULT false,
    anydesk_duration_min INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_client ON crm_tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON crm_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON crm_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_level ON crm_tickets(level);

-- ============================================
-- 8. TABLA: BASE DE CONOCIMIENTO (Knowledge Base)
-- Lo que la IA sabe y aprende
-- ============================================
CREATE TABLE IF NOT EXISTS crm_knowledge (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL, -- 'printer', 'software', 'scale', 'login', 'sales', 'billing'
    question TEXT NOT NULL, -- Pregunta típica
    answer TEXT NOT NULL, -- Respuesta completa
    keywords TEXT, -- Palabras clave separadas por comas
    source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'ticket', 'advisor_response'
    source_ticket_id INTEGER REFERENCES crm_tickets(id),
    times_used INTEGER DEFAULT 0,
    effectiveness_score DECIMAL(3,2) DEFAULT 0, -- 0-1 (qué tan útil fue)
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_category ON crm_knowledge(category);

-- ============================================
-- 9. TABLA: SEGUIMIENTOS PROGRAMADOS (Follow-ups)
-- ============================================
CREATE TABLE IF NOT EXISTS crm_followups (
    id SERIAL PRIMARY KEY,
    
    -- Puede ser para lead o cliente
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES crm_clients(id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL, -- 'sales_followup', 'payment_reminder', 'support_check', 'reactivation'
    scheduled_at TIMESTAMP NOT NULL,
    
    -- Mensaje
    message_template TEXT, -- Template del mensaje a enviar
    channel VARCHAR(20) DEFAULT 'whatsapp', -- 'whatsapp', 'email', 'portal'
    
    -- Estado
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'responded', 'cancelled'
    sent_at TIMESTAMP,
    response_at TIMESTAMP,
    
    -- Secuencia
    sequence_step INTEGER DEFAULT 1, -- Paso en la secuencia de seguimiento
    max_steps INTEGER DEFAULT 5,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_followups_scheduled ON crm_followups(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_followups_status ON crm_followups(status);

-- ============================================
-- 10. TABLA: ACTIVIDAD / TIMELINE
-- Registro de todo lo que pasa con un lead/cliente
-- ============================================
CREATE TABLE IF NOT EXISTS crm_activity_log (
    id SERIAL PRIMARY KEY,
    
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
    client_id INTEGER REFERENCES crm_clients(id) ON DELETE SET NULL,
    
    activity_type VARCHAR(50) NOT NULL, 
    -- Tipos: 'lead_created', 'quote_sent', 'quote_viewed', 'roulette_played',
    -- 'demo_scheduled', 'demo_completed', 'sale_closed', 'payment_received',
    -- 'payment_overdue', 'ticket_opened', 'ticket_resolved', 'message_sent',
    -- 'message_received', 'escalation', 'service_suspended', 'service_activated'
    
    description TEXT,
    metadata JSONB, -- Datos adicionales en JSON
    performed_by VARCHAR(100), -- 'system', 'ai', nombre del asesor
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_lead ON crm_activity_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_activity_client ON crm_activity_log(client_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON crm_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_created ON crm_activity_log(created_at DESC);

-- ============================================
-- INSERTAR CONOCIMIENTO BASE (Top 5 problemas)
-- ============================================
INSERT INTO crm_knowledge (category, question, answer, keywords, source) VALUES
(
    'software',
    'El sistema no arranca, sale error 502 o sin conexión a internet',
    'Solución en orden de prioridad:\n\n1. **Más rápido:** Busca en el escritorio el acceso directo "Cliente Existente" y dale doble clic. Espera 30 segundos y abre el sistema de nuevo.\n\n2. **Si no funciona:** Ve a Windows Update (Inicio → Configuración → Actualización) y verifica que no tenga actualizaciones pendientes. Si las tiene, instálalas todas y reinicia.\n\n3. **Verificar servicios:** Abre el Administrador de Tareas (Ctrl+Alt+Supr) → pestaña Servicios. Verifica que Node.js y MongoDB estén corriendo. Si no, clic derecho → Iniciar.',
    'error 502, no abre, sin conexion, no carga, servicios, mongodb, nodejs',
    'manual'
),
(
    'printer',
    'La impresora no imprime',
    'Causa más común: el cable USB se desconectó o cambió de puerto.\n\n1. **Verificar cable:** ¿El cable USB está bien conectado?\n2. **Puerto original:** Si lo cambiaste de puerto USB, devuélvelo al puerto original.\n3. **Si no sabes cuál era el puerto:**\n   - Panel de Control → Dispositivos e Impresoras\n   - Elimina la impresora actual\n   - Desconecta y reconecta el cable USB\n   - Windows la detecta automáticamente\n   - En el POS: Configuración → Impresora → selecciona la nueva\n\nModelos comunes: XPrinter 58mm, XPrinter 80mm, SAT.',
    'impresora, no imprime, usb, puerto, xprinter, sat, papel',
    'manual'
),
(
    'scale',
    'La báscula no funciona',
    'Problema de puerto COM. Solución:\n\n1. Ve a Panel de Control → Dispositivos e Impresoras\n2. Busca la báscula (puede aparecer como "USB Serial")\n3. Clic derecho → Propiedades → Puerto\n4. Anota el número de COM (ej: COM3, COM4)\n5. En el POS: Configuración → Báscula\n6. Cambia el puerto COM al que encontraste\n7. Guarda y prueba',
    'bascula, peso, com, puerto, serial, no pesa, no funciona',
    'manual'
),
(
    'login',
    'El programa no recibe el usuario y la contraseña',
    'Puede ser por 2 cosas:\n\n**1. Contraseña incorrecta:**\n- ¿Cambiaste la contraseña recientemente?\n- Verifica mayúsculas/minúsculas (importan)\n- Si la olvidaste, podemos resetearla\n\n**2. MongoDB no está corriendo:**\n- Abre Administrador de Tareas (Ctrl+Alt+Supr)\n- Ve a pestaña "Servicios"\n- Busca "MongoDB"\n- Si dice "Detenido", clic derecho → Iniciar\n- Espera 15 segundos e intenta de nuevo\n\n**Si persiste:** Puede requerir reinstalación del programa. En casos extremos, reinstalar el sistema operativo.',
    'usuario, contraseña, login, no entra, mongodb, clave, password',
    'manual'
),
(
    'software',
    'Mensaje de token inválido',
    '¡Es muy fácil! Solo presiona **F5** en tu teclado para actualizar la página.\n\nEsto pasa cuando el sistema lleva mucho tiempo abierto sin usarse y la sesión se desconecta.\n\n💡 **Tip:** Si te pasa seguido, cierra la pestaña del sistema cuando no lo uses y ábrela de nuevo cuando lo necesites.',
    'token, invalido, sesion, expirado, f5, actualizar',
    'manual'
)
ON CONFLICT DO NOTHING;

-- ============================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================
COMMENT ON TABLE crm_advisors IS 'Equipo de Discovery Systems - asesores, soporte, admin';
COMMENT ON TABLE crm_clients IS 'Clientes existentes con planes activos (local, nube, nube+FE)';
COMMENT ON TABLE crm_payments IS 'Historial de pagos mensuales por cliente';
COMMENT ON TABLE crm_messages IS 'Mensajes entre asesores/IA y clientes/leads';
COMMENT ON TABLE crm_tickets IS 'Tickets de soporte técnico con niveles 1-3';
COMMENT ON TABLE crm_knowledge IS 'Base de conocimiento para agentes IA de soporte';
COMMENT ON TABLE crm_followups IS 'Seguimientos programados automáticos';
COMMENT ON TABLE crm_activity_log IS 'Timeline completa de actividad por lead/cliente';
