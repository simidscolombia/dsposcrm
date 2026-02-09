-- backend/migrations/004_create_analytics_events_table.sql
-- Tabla para tracking de eventos del funnel (analytics)

CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    event_type VARCHAR(50) NOT NULL,
    event_category VARCHAR(50),
    event_data JSONB,
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_analytics_lead_id ON analytics_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_data ON analytics_events USING GIN (event_data);

-- Vista de funnel de conversión
CREATE OR REPLACE VIEW conversion_funnel AS
SELECT 
    COUNT(DISTINCT CASE WHEN event_type = 'wizard_start' THEN session_id END) as started_wizard,
    COUNT(DISTINCT CASE WHEN event_type = 'wizard_complete' THEN session_id END) as completed_wizard,
    COUNT(DISTINCT CASE WHEN event_type = 'roulette_spin' THEN session_id END) as spun_roulette,
    COUNT(DISTINCT CASE WHEN event_type = 'whatsapp_clicked' THEN session_id END) as clicked_whatsapp,
    COUNT(DISTINCT CASE WHEN event_type = 'pdf_downloaded' THEN session_id END) as downloaded_pdf,
    COUNT(DISTINCT CASE WHEN event_type = 'demo_scheduled' THEN session_id END) as scheduled_demo,
    
    -- Tasas de conversión
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN event_type = 'wizard_complete' THEN session_id END) / 
          NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'wizard_start' THEN session_id END), 0), 2) as wizard_completion_rate,
    
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN event_type = 'whatsapp_clicked' THEN session_id END) / 
          NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'roulette_spin' THEN session_id END), 0), 2) as whatsapp_click_rate,
    
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN event_type = 'demo_scheduled' THEN session_id END) / 
          NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'roulette_spin' THEN session_id END), 0), 2) as demo_schedule_rate
    
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '30 days';

-- Vista de abandono por paso del wizard
CREATE OR REPLACE VIEW wizard_abandonment AS
SELECT 
    event_data->>'step' as wizard_step,
    COUNT(*) as step_views,
    COUNT(DISTINCT session_id) as unique_sessions,
    ROUND(AVG((event_data->>'time_spent_seconds')::numeric), 2) as avg_time_spent_seconds
FROM analytics_events
WHERE event_type = 'wizard_step_view'
AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY event_data->>'step'
ORDER BY (event_data->>'step')::integer;

-- Vista de premios más efectivos
CREATE OR REPLACE VIEW prize_effectiveness AS
SELECT 
    event_data->>'prize' as prize_name,
    COUNT(*) as times_won,
    COUNT(DISTINCT lead_id) as unique_winners,
    
    -- Acciones post-premio
    SUM(CASE WHEN EXISTS (
        SELECT 1 FROM analytics_events e2 
        WHERE e2.lead_id = analytics_events.lead_id 
        AND e2.event_type = 'whatsapp_clicked'
        AND e2.created_at > analytics_events.created_at
    ) THEN 1 ELSE 0 END) as contacted_whatsapp,
    
    SUM(CASE WHEN EXISTS (
        SELECT 1 FROM analytics_events e2 
        WHERE e2.lead_id = analytics_events.lead_id 
        AND e2.event_type = 'demo_scheduled'
        AND e2.created_at > analytics_events.created_at
    ) THEN 1 ELSE 0 END) as scheduled_demo,
    
    -- Tasa de engagement
    ROUND(100.0 * SUM(CASE WHEN EXISTS (
        SELECT 1 FROM analytics_events e2 
        WHERE e2.lead_id = analytics_events.lead_id 
        AND e2.event_type IN ('whatsapp_clicked', 'pdf_downloaded', 'demo_scheduled')
        AND e2.created_at > analytics_events.created_at
    ) THEN 1 ELSE 0 END) / COUNT(*), 2) as engagement_rate

FROM analytics_events
WHERE event_type = 'prize_won'
AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY event_data->>'prize'
ORDER BY engagement_rate DESC;

-- Comentarios
COMMENT ON TABLE analytics_events IS 'Eventos de analytics para tracking del funnel';
COMMENT ON COLUMN analytics_events.event_type IS 'wizard_start, wizard_step_view, wizard_complete, roulette_spin, prize_won, whatsapp_clicked, pdf_downloaded, demo_scheduled, chatbot_opened, etc.';
COMMENT ON VIEW conversion_funnel IS 'Funnel de conversión con tasas';
COMMENT ON VIEW wizard_abandonment IS 'Análisis de abandono por paso del wizard';
COMMENT ON VIEW prize_effectiveness IS 'Efectividad de cada premio en generar engagement';
