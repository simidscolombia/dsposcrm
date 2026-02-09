-- backend/migrations/001_update_leads_table.sql
-- Actualizar tabla leads con nuevos campos

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20),
ADD COLUMN IF NOT EXISTS prize_won VARCHAR(100),
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'new',
ADD COLUMN IF NOT EXISTS business_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS business_description TEXT;

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp ON leads(whatsapp);

-- Comentarios
COMMENT ON COLUMN leads.status IS 'new, contacted, in_negotiation, closed_won, closed_lost';
COMMENT ON COLUMN leads.prize_won IS 'Premio ganado en la ruleta';
COMMENT ON COLUMN leads.pdf_url IS 'URL del PDF de cotización generado';
