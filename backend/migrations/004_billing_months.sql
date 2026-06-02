-- ============================================================
-- MIGRACIÓN: Tabla de historial de pagos mensuales por cliente
-- Guarda el estado de cada mes: pagado, pendiente, cortesía
-- ============================================================

-- Tabla principal de cobros mensuales
CREATE TABLE IF NOT EXISTS client_billing_months (
    id                  SERIAL PRIMARY KEY,
    client_id           INTEGER NOT NULL REFERENCES crm_clients(id) ON DELETE CASCADE,
    
    -- Período del mes
    year                INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
    month               INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    
    -- Estado del mes
    status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('paid', 'pending', 'gifted', 'future')),
    
    -- Monto cobrado ese mes (puede variar del plan base)
    amount              DECIMAL(12,2),
    
    -- Información del pago
    paid_date           TIMESTAMP,
    payment_method      VARCHAR(50),  -- 'bold', 'transfer', 'cash', 'nequi', etc.
    
    -- Referencias de pasarela de pagos
    bold_transaction_id VARCHAR(200),
    bold_link_id        VARCHAR(200),
    bold_link_url       TEXT,
    
    -- Referencia a factura en admin.poslatino.com
    admin_invoice_id    VARCHAR(100),  -- MongoDB ObjectId de la factura en admin
    admin_invoice_num   INTEGER,       -- Número de factura en admin
    
    -- Metadata
    notes               TEXT,
    created_by          VARCHAR(100) DEFAULT 'system',  -- 'system', 'admin', 'bold_webhook', 'whatsapp'
    
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    
    -- Un solo registro por cliente/mes
    UNIQUE (client_id, year, month)
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_billing_client ON client_billing_months (client_id);
CREATE INDEX IF NOT EXISTS idx_billing_period ON client_billing_months (year, month);
CREATE INDEX IF NOT EXISTS idx_billing_status ON client_billing_months (status);
CREATE INDEX IF NOT EXISTS idx_billing_client_period ON client_billing_months (client_id, year, month);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_billing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_billing_updated_at ON client_billing_months;
CREATE TRIGGER trg_billing_updated_at
    BEFORE UPDATE ON client_billing_months
    FOR EACH ROW
    EXECUTE FUNCTION update_billing_updated_at();

-- ============================================================
-- Función helper: generar meses pendientes para todos los clientes
-- Crea registros 'pending' desde billing_start_date hasta hoy
-- ============================================================
CREATE OR REPLACE FUNCTION generate_pending_months()
RETURNS INTEGER AS $$
DECLARE
    v_client RECORD;
    v_month DATE;
    v_end DATE;
    v_count INTEGER := 0;
BEGIN
    v_end := DATE_TRUNC('month', CURRENT_DATE);
    
    FOR v_client IN 
        SELECT id, billing_start_date, monthly_amount 
        FROM crm_clients 
        WHERE is_active = true 
          AND billing_start_date IS NOT NULL
    LOOP
        v_month := DATE_TRUNC('month', v_client.billing_start_date);
        
        WHILE v_month <= v_end LOOP
            INSERT INTO client_billing_months (
                client_id, year, month, status, amount, created_by
            ) VALUES (
                v_client.id,
                EXTRACT(YEAR FROM v_month)::INTEGER,
                EXTRACT(MONTH FROM v_month)::INTEGER,
                'pending',
                v_client.monthly_amount,
                'system'
            )
            ON CONFLICT (client_id, year, month) DO NOTHING;
            
            v_count := v_count + 1;
            v_month := v_month + INTERVAL '1 month';
        END LOOP;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar la generación inicial de meses
SELECT generate_pending_months() AS meses_generados;

-- Vista resumen de estado de pagos por cliente
CREATE OR REPLACE VIEW client_payment_summary AS
SELECT 
    c.id AS client_id,
    c.business_name,
    c.nit,
    c.monthly_amount,
    c.plan_type,
    COUNT(*) FILTER (WHERE b.status = 'paid') AS meses_pagados,
    COUNT(*) FILTER (WHERE b.status = 'pending') AS meses_pendientes,
    COUNT(*) FILTER (WHERE b.status = 'gifted') AS meses_cortesia,
    SUM(b.amount) FILTER (WHERE b.status = 'paid') AS total_recaudado,
    SUM(b.amount) FILTER (WHERE b.status = 'pending') AS total_deuda,
    MAX(b.paid_date) AS ultimo_pago,
    MIN(b.year * 100 + b.month) FILTER (WHERE b.status = 'pending') AS primer_mes_pendiente
FROM crm_clients c
LEFT JOIN client_billing_months b ON b.client_id = c.id
GROUP BY c.id, c.business_name, c.nit, c.monthly_amount, c.plan_type;
