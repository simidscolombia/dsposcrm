-- backend/migrations/002_create_appointments_table.sql
-- Tabla para gestionar citas/demos agendadas

CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status VARCHAR(20) DEFAULT 'pending',
    appointment_type VARCHAR(50) DEFAULT 'demo',
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_appointments_lead_id ON appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_type ON appointments(appointment_type);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointments_updated_at();

-- Comentarios
COMMENT ON TABLE appointments IS 'Citas y demostraciones agendadas';
COMMENT ON COLUMN appointments.status IS 'pending, confirmed, completed, cancelled, no_show';
COMMENT ON COLUMN appointments.appointment_type IS 'demo, consultation, implementation, training';
