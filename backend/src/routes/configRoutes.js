import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// ============================================
// GET /api/config/company
// Información de la empresa (configurable)
// ============================================
router.get('/company', async (req, res) => {
    try {
        // Intentar obtener de la BD primero
        let config;
        try {
            const result = await db.query("SELECT value FROM crm_config WHERE key = 'company_info'");
            if (result.rows.length > 0) {
                config = JSON.parse(result.rows[0].value);
            }
        } catch (e) {
            // Table might not exist yet, use defaults
        }

        // Si no hay config en BD, usar defaults
        if (!config) {
            config = getDefaultCompanyConfig();
        }

        res.json({ success: true, config });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// PUT /api/config/company
// Actualizar información de la empresa
// ============================================
router.put('/company', async (req, res) => {
    try {
        const config = req.body;

        // Ensure config table exists
        await db.query(`
            CREATE TABLE IF NOT EXISTS crm_config (
                key VARCHAR(100) PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Upsert
        await db.query(`
            INSERT INTO crm_config (key, value, updated_at)
            VALUES ('company_info', $1, NOW())
            ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()
        `, [JSON.stringify(config)]);

        res.json({ success: true, message: 'Configuración actualizada' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET /api/config/whatsapp
// Números de WhatsApp por ciudad (para botón de contacto)
// ============================================
router.get('/whatsapp', async (req, res) => {
    try {
        let config;
        try {
            const result = await db.query("SELECT value FROM crm_config WHERE key = 'whatsapp_numbers'");
            if (result.rows.length > 0) {
                config = JSON.parse(result.rows[0].value);
            }
        } catch (e) { /* */ }

        if (!config) {
            config = getDefaultWhatsAppConfig();
        }

        res.json({ success: true, config });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// PUT /api/config/whatsapp
// ============================================
router.put('/whatsapp', async (req, res) => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS crm_config (
                key VARCHAR(100) PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        await db.query(`
            INSERT INTO crm_config (key, value, updated_at)
            VALUES ('whatsapp_numbers', $1, NOW())
            ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()
        `, [JSON.stringify(req.body)]);
        res.json({ success: true, message: 'WhatsApp config actualizada' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET /api/config/whatsapp/:city
// Obtener número de WhatsApp para una ciudad específica
// ============================================
router.get('/whatsapp/:city', async (req, res) => {
    try {
        const { city } = req.params;
        let config;
        try {
            const result = await db.query("SELECT value FROM crm_config WHERE key = 'whatsapp_numbers'");
            if (result.rows.length > 0) {
                config = JSON.parse(result.rows[0].value);
            }
        } catch (e) { /* */ }

        if (!config) {
            config = getDefaultWhatsAppConfig();
        }

        // Find matching city (case insensitive)
        const cityLower = city.toLowerCase();
        const match = config.numbers.find(n =>
            n.city.toLowerCase() === cityLower ||
            n.aliases?.some(a => a.toLowerCase() === cityLower)
        );

        // Fallback to Colombia general
        const fallback = config.numbers.find(n => n.city.toLowerCase() === 'colombia') || config.numbers[0];

        res.json({
            success: true,
            number: match || fallback,
            advisor: match ? match.advisor : fallback.advisor
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET /api/config/billing
// Configuración de cobros (planes, precios, reglas)
// ============================================
router.get('/billing', async (req, res) => {
    try {
        let config;
        try {
            const result = await db.query("SELECT value FROM crm_config WHERE key = 'billing_config'");
            if (result.rows.length > 0) {
                config = JSON.parse(result.rows[0].value);
            }
        } catch (e) { /* */ }

        if (!config) {
            config = getDefaultBillingConfig();
        }

        res.json({ success: true, config });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// PUT /api/config/billing
// ============================================
router.put('/billing', async (req, res) => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS crm_config (
                key VARCHAR(100) PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        await db.query(`
            INSERT INTO crm_config (key, value, updated_at)
            VALUES ('billing_config', $1, NOW())
            ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()
        `, [JSON.stringify(req.body)]);
        res.json({ success: true, message: 'Billing config actualizada' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// PUT /api/config/marketing
// Actualizar activos marketing (video, hero, etc)
// ============================================
router.put('/marketing', async (req, res) => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS crm_config (
                key VARCHAR(100) PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        await db.query(`
            INSERT INTO crm_config (key, value, updated_at)
            VALUES ('marketing_assets', $1, NOW())
            ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()
        `, [JSON.stringify(req.body)]);
        res.json({ success: true, message: 'Activos marketing actualizados' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// GET /api/config/all
// Toda la configuración del sistema
// ============================================
router.get('/all', async (req, res) => {
    try {
        const configs = {};
        try {
            const result = await db.query("SELECT key, value FROM crm_config");
            for (const row of result.rows) {
                try {
                    configs[row.key] = JSON.parse(row.value);
                } catch (e) {
                    configs[row.key] = row.value;
                }
            }
        } catch (e) { /* table might not exist */ }

        // Fill in defaults for missing configs
        if (!configs.company_info) configs.company_info = getDefaultCompanyConfig();
        if (!configs.whatsapp_numbers) configs.whatsapp_numbers = getDefaultWhatsAppConfig();
        if (!configs.billing_config) configs.billing_config = getDefaultBillingConfig();

        res.json({ success: true, configs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// POST /api/config/init
// Inicializar toda la configuración con defaults
// ============================================
router.post('/init', async (req, res) => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS crm_config (
                key VARCHAR(100) PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);

        const defaults = {
            company_info: getDefaultCompanyConfig(),
            whatsapp_numbers: getDefaultWhatsAppConfig(),
            billing_config: getDefaultBillingConfig(),
            marketing_assets: getDefaultMarketingConfig(),
        };

        for (const [key, value] of Object.entries(defaults)) {
            await db.query(`
                INSERT INTO crm_config (key, value, updated_at)
                VALUES ($1, $2, NOW())
                ON CONFLICT (key) DO NOTHING
            `, [key, JSON.stringify(value)]);
        }

        res.json({ success: true, message: 'Configuración inicializada', defaults });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// DEFAULT CONFIGURATIONS
// ============================================

function getDefaultMarketingConfig() {
    return {
        video_demo_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
        hero_image_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=1200',
        carousel_images: [
            'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1556742111-a301076d9d18?auto=format&fit=crop&q=80&w=800'
        ]
    };
}

function getDefaultCompanyConfig() {
    return {
        name: 'Discovery Systems POS',
        legal_name: 'Discovery Systems POS',
        nit: '88243048',
        address: 'Cra 26A #11-68, Barrio La Universidad, Bucaramanga, Santander',
        phone: '3205792169',
        email: 'dsposcolombia@gmail.com',
        website: 'www.discoverysystems.com',
        slogan: 'Soluciones Tecnológicas POS',
        // Bank info
        bank: {
            name: 'Bancolombia',
            type: 'Ahorros',
            number: '91211173063',
            holder: 'Elkin Daniel Castillo Pérez'
        },
        nequi: '3205792169',
        daviplata: '3155962626',
        // Branding
        colors: {
            primary: '#2563EB',
            secondary: '#4F46E5',
            accent: '#F59E0B'
        },
        // Quote validity
        quote_validity_hours: 48,
        // Footer text for PDFs
        pdf_footer: 'Discovery Systems POS | NIT: 88243048 | Bucaramanga, Colombia',
        pdf_contact: 'Contacto: +57 320 579 2169 | www.discoverysystems.com'
    };
}

function getDefaultWhatsAppConfig() {
    return {
        numbers: [
            {
                city: 'Bogotá',
                aliases: ['bogota', 'cundinamarca'],
                number: '573164300656',
                advisor: 'Keren Hapuc',
                role: 'sales'
            },
            {
                city: 'Bucaramanga',
                aliases: ['bucaramanga', 'santander', 'floridablanca', 'giron', 'piedecuesta'],
                number: '573170111292',
                advisor: 'Anaid',
                role: 'sales'
            },
            {
                city: 'Medellín',
                aliases: ['medellin', 'antioquia'],
                number: '573205792169',
                advisor: 'Darney',
                role: 'sales'
            },
            {
                city: 'Colombia',
                aliases: ['colombia', 'otro', 'cali', 'pasto', 'barranquilla', 'cucuta', 'otra'],
                number: '573205792169',
                advisor: 'Daniel',
                role: 'sales'
            },
            {
                city: 'Soporte',
                aliases: ['soporte', 'support', 'ayuda'],
                number: '573102237414',
                advisor: 'Soporte Discovery',
                role: 'support'
            }
        ],
        // Escalation number (Daniel personal)
        escalation_number: '573155962626',
        escalation_name: 'Daniel'
    };
}

function getDefaultBillingConfig() {
    return {
        plans: [
            {
                id: 'cloud',
                name: 'Nube',
                monthly: 35000,
                semiannual: 175000, // paga 5
                annual: 350000, // paga 10
                description: 'Sistema POS en la nube',
                includes_fe: false
            },
            {
                id: 'cloud_fe',
                name: 'Nube + Facturación Electrónica',
                monthly: 55000,
                semiannual: 275000, // paga 5
                annual: 550000, // paga 10
                description: 'Sistema POS en la nube con módulo DIAN',
                includes_fe: true
            }
        ],
        discounts: {
            semiannual: { months_charged: 5, months_service: 6, label: 'Paga 5, lleva 6' },
            annual: { months_charged: 10, months_service: 12, label: 'Paga 10, lleva 12' }
        },
        // Billing rules
        billing_day: 28,
        due_day: 5,
        suspend_after_days: 5,
        moroso_after_days: 30,
        iva_exempt: true,
        // Payment methods
        payment_methods: ['transfer', 'wompi', 'nequi', 'daviplata', 'bold', 'cash'],
        // Wompi
        wompi: {
            enabled: true,
            public_key: '', // To be configured
        },
        // Reminder sequence (days after billing)
        reminder_sequence: [
            { day: -3, message: 'pre_billing', tone: 'friendly' },
            { day: 1, message: 'reminder', tone: 'friendly' },
            { day: 5, message: 'due', tone: 'firm' },
            { day: 8, message: 'overdue', tone: 'serious' },
            { day: 12, message: 'warning', tone: 'urgent' },
            { day: 15, message: 'suspension', tone: 'final' }
        ]
    };
}

export default router;
