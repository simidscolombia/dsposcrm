-- ============================================================
-- MIGRACIÓN 009: Alertas de Cobros y Columnas de Control de Recordatorios
-- ============================================================

-- 1. Agregar columnas de control de envío de recordatorios
ALTER TABLE client_billing_months 
ADD COLUMN IF NOT EXISTS reminder_day28_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_day1_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_day3_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_day5_sent BOOLEAN DEFAULT false;

-- 2. Crear tabla de alertas de cobro (petición de cortesía o mora crítica)
CREATE TABLE IF NOT EXISTS crm_billing_alerts (
    id                  SERIAL PRIMARY KEY,
    client_id           INTEGER NOT NULL REFERENCES crm_clients(id) ON DELETE CASCADE,
    billing_month_id    INTEGER NOT NULL REFERENCES client_billing_months(id) ON DELETE CASCADE,
    alert_type          VARCHAR(50) NOT NULL CHECK (alert_type IN ('courtesy_request', 'overdue_critical')),
    reason              TEXT NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'pending' 
                        CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- Index para búsquedas de alertas rápidas
CREATE INDEX IF NOT EXISTS idx_billing_alerts_client ON crm_billing_alerts(client_id);
CREATE INDEX IF NOT EXISTS idx_billing_alerts_status ON crm_billing_alerts(status);

-- Trigger para actualizar updated_at en alertas
CREATE OR REPLACE FUNCTION update_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_alerts_updated_at ON crm_billing_alerts;
CREATE TRIGGER trg_alerts_updated_at
    BEFORE UPDATE ON crm_billing_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_alerts_updated_at();

-- 3. Actualizar la función para pre-generar el mes siguiente a partir del día 28
CREATE OR REPLACE FUNCTION generate_pending_months()
RETURNS INTEGER AS $$
DECLARE
    v_client RECORD;
    v_month DATE;
    v_end DATE;
    v_count INTEGER := 0;
BEGIN
    -- Si es día 28 o posterior, generamos hasta el mes siguiente
    IF EXTRACT(DAY FROM CURRENT_DATE) >= 28 THEN
        v_end := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month');
    ELSE
        v_end := DATE_TRUNC('month', CURRENT_DATE);
    END IF;
    
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
