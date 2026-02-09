-- backend/migrations/003_create_ai_interactions_table.sql
-- Tabla para tracking de uso de IA (analytics y costos)

CREATE TABLE IF NOT EXISTS ai_interactions (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
    interaction_type VARCHAR(50) NOT NULL,
    question TEXT,
    ai_response TEXT,
    model_used VARCHAR(50) DEFAULT 'claude-3-5-haiku-20241022',
    tokens_used INTEGER DEFAULT 0,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cost_usd DECIMAL(10, 6) DEFAULT 0,
    response_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    context_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ai_interactions_lead_id ON ai_interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_type ON ai_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_created_at ON ai_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_success ON ai_interactions(success);

-- Vista para analytics de costos
CREATE OR REPLACE VIEW ai_cost_summary AS
SELECT 
    DATE(created_at) as date,
    interaction_type,
    COUNT(*) as total_interactions,
    SUM(tokens_used) as total_tokens,
    SUM(cost_usd) as total_cost_usd,
    AVG(response_time_ms) as avg_response_time_ms,
    COUNT(CASE WHEN success = TRUE THEN 1 END) as successful_interactions,
    COUNT(CASE WHEN success = FALSE THEN 1 END) as failed_interactions
FROM ai_interactions
GROUP BY DATE(created_at), interaction_type
ORDER BY date DESC, interaction_type;

-- Comentarios
COMMENT ON TABLE ai_interactions IS 'Tracking de todas las interacciones con Claude AI';
COMMENT ON COLUMN ai_interactions.interaction_type IS 'wizard_analysis, quote_generation, chatbot_response';
COMMENT ON COLUMN ai_interactions.cost_usd IS 'Costo real de la request en USD';
COMMENT ON VIEW ai_cost_summary IS 'Resumen diario de costos y uso de IA';
