import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// ============================================
// POST /admin/crm/migrate
// Crea todas las tablas del CRM completo
// ============================================
router.post('/migrate', async (req, res) => {
    try {
        console.log('🚀 Iniciando migración CRM completa...');
        const results = [];

        // 1. ASESORES
        await db.query(`
            CREATE TABLE IF NOT EXISTS crm_advisors (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                city VARCHAR(100) NOT NULL,
                whatsapp VARCHAR(20),
                role VARCHAR(50) DEFAULT 'sales',
                is_active BOOLEAN DEFAULT true,
                personality TEXT,
                avatar_url TEXT,
                shift_start TIME,
                shift_end TIME,
                works_weekends BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        results.push('✅ crm_advisors');

        // Insertar asesores si está vacía
        const checkAdvisors = await db.query('SELECT COUNT(*) FROM crm_advisors');
        if (parseInt(checkAdvisors.rows[0].count) === 0) {
            await db.query(`
                INSERT INTO crm_advisors (name, city, whatsapp, role, shift_start, shift_end, works_weekends) VALUES
                ('Daniel', 'Colombia', '3205792169', 'admin', '08:00', '20:00', true),
                ('Keren Hapuc', 'Bogotá', '3164300656', 'sales', '08:00', '18:00', false),
                ('Anaid', 'Bucaramanga', '3170111292', 'sales', '08:00', '18:00', false),
                ('Darney', 'Medellín', NULL, 'sales', '08:00', '18:00', false),
                ('Sebastián Castillo', 'Bucaramanga', '3132766537', 'support', '09:00', '13:00', false);
            `);
            results.push('✅ Asesores insertados');
        }

        // 2. EXPANDIR LEADS
        const leadAlters = [
            "ALTER TABLE leads ADD COLUMN IF NOT EXISTS email VARCHAR(255)",
            "ALTER TABLE leads ADD COLUMN IF NOT EXISTS advisor_id INTEGER",
            "ALTER TABLE leads ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'web'",
            "ALTER TABLE leads ADD COLUMN IF NOT EXISTS system_type VARCHAR(50)",
            "ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT",
            "ALTER TABLE leads ADD COLUMN IF NOT EXISTS pipeline_stage VARCHAR(50) DEFAULT 'new'",
            "ALTER TABLE leads ADD COLUMN IF NOT EXISTS lost_reason TEXT",
            "ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMP",
            "ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_followup_at TIMESTAMP",
        ];
        for (const sql of leadAlters) {
            try { await db.query(sql); } catch (e) { /* column may exist */ }
        }
        try {
            await db.query("CREATE INDEX IF NOT EXISTS idx_leads_pipeline ON leads(pipeline_stage)");
            await db.query("CREATE INDEX IF NOT EXISTS idx_leads_advisor ON leads(advisor_id)");
        } catch (e) { /* index may exist */ }
        results.push('✅ leads expandida');

        // 3. EXPANDIR COTIZACIONES
        const quoteAlters = [
            "ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS prize_label VARCHAR(100)",
            "ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS prize_detail TEXT",
            "ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5,2) DEFAULT 0",
            "ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0",
            "ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS final_amount DECIMAL(12,2)",
            "ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS client_name VARCHAR(255)",
            "ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS client_phone VARCHAR(20)",
            "ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS client_city VARCHAR(100)",
            "ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS client_business VARCHAR(255)",
            "ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS system_type VARCHAR(50)",
            "ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS advisor_id INTEGER",
            "ALTER TABLE crm_quotes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP",
        ];
        // Create table if not exists first
        await db.query(`
            CREATE TABLE IF NOT EXISTS crm_quotes (
                id SERIAL PRIMARY KEY,
                lead_id INTEGER,
                client_name VARCHAR(255),
                client_phone VARCHAR(20),
                client_city VARCHAR(100),
                client_business VARCHAR(255),
                system_type VARCHAR(50),
                total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
                discount_percent DECIMAL(5,2) DEFAULT 0,
                discount_amount DECIMAL(12,2) DEFAULT 0,
                final_amount DECIMAL(12,2) DEFAULT 0,
                prize_label VARCHAR(100),
                prize_detail TEXT,
                advisor_id INTEGER,
                status VARCHAR(50) DEFAULT 'draft',
                pdf_url TEXT,
                expires_at TIMESTAMP,
                notes TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        for (const sql of quoteAlters) {
            try { await db.query(sql); } catch (e) { /* column may exist */ }
        }
        results.push('✅ crm_quotes');

        // Quote items
        await db.query(`
            CREATE TABLE IF NOT EXISTS crm_quote_items (
                id SERIAL PRIMARY KEY,
                quote_id INTEGER REFERENCES crm_quotes(id) ON DELETE CASCADE,
                product_id INTEGER,
                product_name VARCHAR(255) NOT NULL,
                product_category VARCHAR(50),
                quantity INTEGER DEFAULT 1,
                unit_price DECIMAL(12,2) NOT NULL,
                subtotal DECIMAL(12,2) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        // Force add columns if table already existed from older schema
        const quoteItemAlters = [
            "ALTER TABLE crm_quote_items ADD COLUMN IF NOT EXISTS product_name VARCHAR(255) DEFAULT 'Producto'",
            "ALTER TABLE crm_quote_items ADD COLUMN IF NOT EXISTS product_category VARCHAR(50)"
        ];
        for (const sql of quoteItemAlters) {
            try { await db.query(sql); } catch (e) { /* column may exist */ }
        }
        results.push('✅ crm_quote_items');

        // 4. CLIENTES EXISTENTES
        await db.query(`
            CREATE TABLE IF NOT EXISTS crm_clients (
                id SERIAL PRIMARY KEY,
                lead_id INTEGER,
                business_name VARCHAR(255) NOT NULL,
                contact_name VARCHAR(255),
                whatsapp VARCHAR(20) NOT NULL,
                email VARCHAR(255),
                city VARCHAR(100),
                address TEXT,
                nit VARCHAR(20),
                plan_type VARCHAR(50) NOT NULL DEFAULT 'local',
                monthly_amount DECIMAL(12,2) DEFAULT 0,
                billing_day INTEGER DEFAULT 28,
                payment_status VARCHAR(50) DEFAULT 'active',
                last_payment_date DATE,
                next_billing_date DATE,
                pos_version VARCHAR(20),
                server_name VARCHAR(100),
                cloud_url TEXT,
                anydesk_id VARCHAR(50),
                advisor_id INTEGER,
                notes TEXT,
                priority VARCHAR(20) DEFAULT 'normal',
                is_active BOOLEAN DEFAULT true,
                started_at DATE,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        try {
            await db.query("CREATE INDEX IF NOT EXISTS idx_clients_whatsapp ON crm_clients(whatsapp)");
            await db.query("CREATE INDEX IF NOT EXISTS idx_clients_plan ON crm_clients(plan_type)");
            await db.query("CREATE INDEX IF NOT EXISTS idx_clients_payment ON crm_clients(payment_status)");
            await db.query("CREATE INDEX IF NOT EXISTS idx_clients_city ON crm_clients(city)");
        } catch (e) { /* */ }
        results.push('✅ crm_clients');

        // 5. PAGOS
        await db.query(`
            CREATE TABLE IF NOT EXISTS crm_payments (
                id SERIAL PRIMARY KEY,
                client_id INTEGER NOT NULL REFERENCES crm_clients(id) ON DELETE CASCADE,
                period_month INTEGER NOT NULL,
                period_year INTEGER NOT NULL,
                amount DECIMAL(12,2) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                payment_method VARCHAR(50),
                payment_date TIMESTAMP,
                receipt_url TEXT,
                receipt_verified BOOLEAN DEFAULT false,
                verified_by VARCHAR(100),
                verified_at TIMESTAMP,
                invoice_sent BOOLEAN DEFAULT false,
                invoice_sent_at TIMESTAMP,
                invoice_url TEXT,
                payment_link TEXT,
                payment_link_id VARCHAR(100),
                reminder_count INTEGER DEFAULT 0,
                last_reminder_at TIMESTAMP,
                notes TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        try {
            await db.query("CREATE INDEX IF NOT EXISTS idx_payments_client ON crm_payments(client_id)");
            await db.query("CREATE INDEX IF NOT EXISTS idx_payments_status ON crm_payments(status)");
            await db.query("CREATE INDEX IF NOT EXISTS idx_payments_period ON crm_payments(period_year, period_month)");
        } catch (e) { /* */ }
        results.push('✅ crm_payments');

        // 6. MENSAJES
        await db.query(`
            CREATE TABLE IF NOT EXISTS crm_messages (
                id SERIAL PRIMARY KEY,
                lead_id INTEGER,
                client_id INTEGER,
                direction VARCHAR(10) NOT NULL,
                sender_type VARCHAR(20) NOT NULL,
                sender_name VARCHAR(100),
                content TEXT NOT NULL,
                message_type VARCHAR(20) DEFAULT 'text',
                media_url TEXT,
                wa_message_id VARCHAR(100),
                wa_status VARCHAR(20),
                is_escalation BOOLEAN DEFAULT false,
                escalation_reason TEXT,
                escalation_resolved BOOLEAN DEFAULT false,
                escalation_response TEXT,
                channel VARCHAR(20) DEFAULT 'whatsapp',
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        try {
            await db.query("CREATE INDEX IF NOT EXISTS idx_messages_lead ON crm_messages(lead_id)");
            await db.query("CREATE INDEX IF NOT EXISTS idx_messages_client ON crm_messages(client_id)");
            await db.query("CREATE INDEX IF NOT EXISTS idx_messages_created ON crm_messages(created_at DESC)");
        } catch (e) { /* */ }
        results.push('✅ crm_messages');

        // 7. TICKETS DE SOPORTE
        await db.query(`
            CREATE TABLE IF NOT EXISTS crm_tickets (
                id SERIAL PRIMARY KEY,
                client_id INTEGER NOT NULL REFERENCES crm_clients(id) ON DELETE CASCADE,
                subject VARCHAR(255) NOT NULL,
                description TEXT,
                category VARCHAR(50),
                status VARCHAR(50) DEFAULT 'open',
                priority VARCHAR(20) DEFAULT 'medium',
                level INTEGER DEFAULT 1,
                assigned_to INTEGER,
                resolved_by INTEGER,
                resolution TEXT,
                resolution_learned BOOLEAN DEFAULT false,
                first_response_at TIMESTAMP,
                resolved_at TIMESTAMP,
                satisfaction_rating INTEGER,
                satisfaction_comment TEXT,
                anydesk_session BOOLEAN DEFAULT false,
                anydesk_duration_min INTEGER,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        try {
            await db.query("CREATE INDEX IF NOT EXISTS idx_tickets_client ON crm_tickets(client_id)");
            await db.query("CREATE INDEX IF NOT EXISTS idx_tickets_status ON crm_tickets(status)");
            await db.query("CREATE INDEX IF NOT EXISTS idx_tickets_priority ON crm_tickets(priority)");
        } catch (e) { /* */ }
        results.push('✅ crm_tickets');

        // 8. BASE DE CONOCIMIENTO
        await db.query(`
            CREATE TABLE IF NOT EXISTS crm_knowledge (
                id SERIAL PRIMARY KEY,
                category VARCHAR(50) NOT NULL,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                keywords TEXT,
                source VARCHAR(50) DEFAULT 'manual',
                source_ticket_id INTEGER,
                times_used INTEGER DEFAULT 0,
                effectiveness_score DECIMAL(3,2) DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_by VARCHAR(100),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Insertar conocimiento base si está vacío
        const checkKnowledge = await db.query('SELECT COUNT(*) FROM crm_knowledge');
        if (parseInt(checkKnowledge.rows[0].count) === 0) {
            await db.query(`
                INSERT INTO crm_knowledge (category, question, answer, keywords, source) VALUES
                ('software', 'El sistema no arranca, sale error 502 o sin conexión', 
                 'Solución en orden:\n1. Ejecutar acceso directo "Cliente Existente" en escritorio. Esperar 30s.\n2. Verificar Windows Update e instalar actualizaciones pendientes.\n3. Administrador de Tareas → verificar Node.js y MongoDB estén corriendo.',
                 'error 502, no abre, sin conexion, no carga, servicios, mongodb, nodejs', 'manual'),
                ('printer', 'La impresora no imprime',
                 'Causa más común: cable USB desconectado o cambiado de puerto.\n1. Verificar cable USB conectado.\n2. Poner en el mismo puerto USB original.\n3. Si cambió: reinstalar impresora desde Panel de Control.',
                 'impresora, no imprime, usb, puerto, xprinter, sat, papel', 'manual'),
                ('scale', 'La báscula no funciona',
                 'Verificar puerto COM:\n1. Panel de Control → Dispositivos e Impresoras\n2. Buscar báscula (USB Serial)\n3. Clic derecho → Propiedades → Puerto COM\n4. En POS: Configuración → Báscula → cambiar puerto COM',
                 'bascula, peso, com, puerto, serial, no pesa', 'manual'),
                ('login', 'No acepta usuario y contraseña',
                 'Dos causas posibles:\n1. Contraseña incorrecta (verificar mayúsculas)\n2. MongoDB detenido → Administrador de Tareas → Servicios → MongoDB → Iniciar\nSi persiste: reinstalar programa.',
                 'usuario, contraseña, login, no entra, mongodb, clave', 'manual'),
                ('software', 'Mensaje de token inválido',
                 'Presionar F5 para actualizar la página. El token expira por inactividad prolongada. Tip: cerrar pestaña cuando no se use.',
                 'token, invalido, sesion, expirado, f5, actualizar', 'manual');
            `);
            results.push('✅ Conocimiento base insertado');
        }
        results.push('✅ crm_knowledge');

        // 9. SEGUIMIENTOS
        await db.query(`
            CREATE TABLE IF NOT EXISTS crm_followups (
                id SERIAL PRIMARY KEY,
                lead_id INTEGER,
                client_id INTEGER,
                type VARCHAR(50) NOT NULL,
                scheduled_at TIMESTAMP NOT NULL,
                message_template TEXT,
                channel VARCHAR(20) DEFAULT 'whatsapp',
                status VARCHAR(50) DEFAULT 'pending',
                sent_at TIMESTAMP,
                response_at TIMESTAMP,
                sequence_step INTEGER DEFAULT 1,
                max_steps INTEGER DEFAULT 5,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        try {
            await db.query("CREATE INDEX IF NOT EXISTS idx_followups_scheduled ON crm_followups(scheduled_at)");
            await db.query("CREATE INDEX IF NOT EXISTS idx_followups_status ON crm_followups(status)");
        } catch (e) { /* */ }
        results.push('✅ crm_followups');

        // 10. ACTIVIDAD / TIMELINE
        await db.query(`
            CREATE TABLE IF NOT EXISTS crm_activity_log (
                id SERIAL PRIMARY KEY,
                lead_id INTEGER,
                client_id INTEGER,
                activity_type VARCHAR(50) NOT NULL,
                description TEXT,
                metadata JSONB,
                performed_by VARCHAR(100),
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        try {
            await db.query("CREATE INDEX IF NOT EXISTS idx_activity_lead ON crm_activity_log(lead_id)");
            await db.query("CREATE INDEX IF NOT EXISTS idx_activity_client ON crm_activity_log(client_id)");
            await db.query("CREATE INDEX IF NOT EXISTS idx_activity_type ON crm_activity_log(activity_type)");
            await db.query("CREATE INDEX IF NOT EXISTS idx_activity_created ON crm_activity_log(created_at DESC)");
        } catch (e) { /* */ }
        results.push('✅ crm_activity_log');

        console.log('🎉 Migración CRM completada:', results);
        res.json({
            success: true,
            message: '🎉 Migración CRM completada exitosamente',
            tables_created: results
        });

    } catch (error) {
        console.error('❌ Error en migración CRM:', error);
        res.status(500).json({ success: false, error: error.message, detail: error.detail });
    }
});

// ============================================
// GET /admin/crm/stats
// Estadísticas rápidas del CRM
// ============================================
router.get('/stats', async (req, res) => {
    try {
        const stats = {};

        // Counts
        const tables = ['leads', 'crm_clients', 'crm_quotes', 'crm_payments', 'crm_tickets', 'crm_messages', 'crm_knowledge', 'crm_advisors'];
        for (const table of tables) {
            try {
                const result = await db.query(`SELECT COUNT(*) FROM ${table}`);
                stats[table] = parseInt(result.rows[0].count);
            } catch (e) {
                stats[table] = 'table not found';
            }
        }

        // Pipeline
        try {
            const pipeline = await db.query(`
                SELECT pipeline_stage, COUNT(*) as count 
                FROM leads 
                GROUP BY pipeline_stage
            `);
            stats.pipeline = pipeline.rows;
        } catch (e) {
            stats.pipeline = [];
        }

        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
