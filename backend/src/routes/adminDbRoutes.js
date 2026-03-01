import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// Endpoint para inicializar tablas (Soporta GET y POST para mayor facilidad)
router.all('/init-tables', async (req, res) => {
    try {
        console.log('Iniciando configuración de Base de Datos Admin...');

        // 1. Crear Tabla Categorías
        await db.query(`
            CREATE TABLE IF NOT EXISTS crm_categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                slug VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                image_url TEXT,
                icon VARCHAR(50),
                "order" INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('✅ Tabla crm_categories verificada.');

        // 1.5. MIGRACIONES AL VUELO: Nuevos campos para clientes y distribuidores
        try {
            await db.query(`ALTER TABLE crm_clients ADD COLUMN IF NOT EXISTS legal_representative VARCHAR(255)`);
            await db.query(`ALTER TABLE crm_distributors ADD COLUMN IF NOT EXISTS legal_representative VARCHAR(255)`);
            await db.query(`ALTER TABLE crm_distributors ADD COLUMN IF NOT EXISTS nit VARCHAR(50)`);
            await db.query(`ALTER TABLE crm_distributors ADD COLUMN IF NOT EXISTS email VARCHAR(255)`);
            await db.query(`ALTER TABLE crm_distributors ADD COLUMN IF NOT EXISTS address VARCHAR(255)`);
            console.log('✅ Migraciones de campos completadas.');
        } catch (e) {
            console.log('⏳ Nota de migración:', e.message);
        }

        // 2. Crear Tabla Productos (Actualizada)
        await db.query(`
            CREATE TABLE IF NOT EXISTS crm_products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(12, 2) NOT NULL,
                image_url TEXT,
                category_id INTEGER REFERENCES crm_categories(id) ON DELETE SET NULL,
                category VARCHAR(100),
                stock INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // ASEGURAR COLUMNAS (Migración automática para tablas existentes)
        try {
            await db.query(`ALTER TABLE crm_products ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES crm_categories(id) ON DELETE SET NULL`);
            await db.query(`ALTER TABLE crm_products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`);
            await db.query(`ALTER TABLE crm_products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0`);
            await db.query(`ALTER TABLE crm_products ADD COLUMN IF NOT EXISTS category VARCHAR(100)`);
            console.log('✅ Estructura de crm_products sincronizada.');
        } catch (e) {
            console.log('⏳ Nota migración productos:', e.message);
        }

        // 3. Sincronizar Categorías (Nichos de Negocio Principales)
        await db.query(`
            INSERT INTO crm_categories (name, slug, icon, description, "order") VALUES
            ('Restaurantes y Licorerías', 'gastronomia', 'FaUtensils', 'Soluciones para gastronomía y licores', 1),
            ('Droguerías y Salud', 'salud', 'FaHeartbeat', 'Equipos para farmacias y clínicas', 2),
            ('Ferreterías y Hogar', 'hogar', 'FaHome', 'Kits para ferreterías y construcción', 3),
            ('Mercados y Fruvers', 'mercados', 'FaStore', 'POS para supermercados y fruvers', 4),
            ('Car Wash y Talleres', 'automotriz', 'FaCar', 'Soluciones para el sector automotriz', 5),
            ('Hardware POS', 'hardware', 'FaServer', 'Equipos físicos y terminales', 6),
            ('Software Licencias', 'software', 'FaCode', 'Licencias y sistemas', 7),
            ('Servicios y Soporte', 'servicios', 'FaTools', 'Instalación y mantenimiento', 8)
            ON CONFLICT (slug) DO UPDATE SET 
                name = EXCLUDED.name,
                icon = EXCLUDED.icon,
                description = EXCLUDED.description,
                "order" = EXCLUDED."order";
        `);
        console.log('✅ Categorías de negocio sincronizadas.');

        // 4. Crear Tabla de Premios
        await db.query(`
            CREATE TABLE IF NOT EXISTS crm_prizes (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                probability INTEGER DEFAULT 0,
                type VARCHAR(50) DEFAULT 'discount',
                value VARCHAR(100),
                icon VARCHAR(50),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('✅ Tabla crm_prizes verificada.');

        // 5. Insertar Premios por Defecto (si está vacía)
        const checkPrizes = await db.query('SELECT COUNT(*) FROM crm_prizes');
        if (parseInt(checkPrizes.rows[0].count) === 0) {
            await db.query(`
                INSERT INTO crm_prizes (name, description, probability, type, value, icon) VALUES
                ('Descuento 5%', '5% de descuento en tu compra', 40, 'discount', '5%', '🏷️'),
                ('Descuento 10%', '10% de descuento en tu compra', 30, 'discount', '10%', '🔥'),
                ('Mes Gratis', '1 mes de suscripción gratis', 20, 'free_month', '1 mes', '📅'),
                ('Lector de Barras', 'Lector de código de barras gratis', 5, 'hardware', 'Lector', '🔫'),
                ('Ebook POS', 'Guía "Cómo gestionar tu negocio"', 5, 'ebook', 'PDF', '📚');
            `);
            console.log('✅ Premios por defecto insertados.');
        }

        // 6. Re-vincular productos a sus categorías por nombre/slug
        // Esto corrige el problema de productos "huérfanos" (con category_id null) para que aparezcan en los filtros
        await db.query(`
            UPDATE crm_products p
            SET category_id = c.id
            FROM crm_categories c
            WHERE (LOWER(p.category) = LOWER(c.name) OR p.category = c.slug OR (p.category ILIKE '%software%' AND c.slug = 'software'))
            AND (p.category_id IS NULL OR p.category_id != c.id);
        `);
        console.log('✅ Re-vinculación de productos completada.');

        // 7. Asegurar que la categoría 'Software' tenga el nombre corto oficial
        await db.query(`UPDATE crm_categories SET name = 'Software' WHERE slug = 'software';`);

        // 8. Crear Tabla de Reglas de Expertos de IA
        await db.query(`
            CREATE TABLE IF NOT EXISTS crm_ai_rules (
                id SERIAL PRIMARY KEY,
                niche VARCHAR(100) NOT NULL UNIQUE,
                key_question TEXT,
                suggested_hardware JSONB,
                expert_tips JSONB,
                excluded_items JSONB,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('✅ Tabla crm_ai_rules verificada.');

        // 9. Insertar Productos de Ejemplo (si la tabla está vacía)
        const checkProducts = await db.query('SELECT COUNT(*) FROM crm_products');
        if (parseInt(checkProducts.rows[0].count) === 0) {
            await db.query(`
                INSERT INTO crm_products (name, description, price, category, stock, image_url) VALUES
                ('PC All-in-One Industrial', 'Pantalla táctil 15", Procesador Intel, 8GB RAM', 1850000, 'hardware', 10, 'https://images.unsplash.com/photo-1591485423007-765bde4139ef?w=400'),
                ('Impresora Térmica 80mm', 'Impresora de alta velocidad con corte automático (USB/LAN)', 450000, 'hardware', 25, 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400'),
                ('Cajón Monedero Reforzado', 'Apertura automática mediante impresora, 5 puestos de billetes', 220000, 'hardware', 15, 'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=400'),
                ('Lector de Código de Barras 1D/2D', 'Lectura de códigos QR y lineales, base incluida', 180000, 'hardware', 30, 'https://images.unsplash.com/photo-1601598851547-4302969d0614?w=400'),
                ('Software Discovery POS PRO', 'Licencia vitalicia, facturación electrónica, control de inventario', 1200000, 'software', 999, 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400'),
                ('Soporte Técnico 24/7 (1 Mes)', 'Asistencia remota ilimitada y actualizaciones gratuitas', 50000, 'servicios', 999, 'https://images.unsplash.com/photo-1521791136366-3d3950ef770b?w=400');
            `);
            console.log('✅ Catálogo inicial de productos creado.');
        }

        // 10. Re-vincular de nuevo por seguridad
        await db.query(`
            UPDATE crm_products p
            SET category_id = c.id
            FROM crm_categories c
            WHERE (LOWER(p.category) = LOWER(c.name) OR p.category = c.slug OR (p.category ILIKE '%hardware%' AND c.slug = 'hardware'))
            AND (p.category_id IS NULL OR p.category_id != c.id);
        `);

        res.json({ success: true, message: 'Todas las tablas administrativas configuradas, catálogo inicial poblado y cerebro de IA iniciado correctamente.' });

    } catch (error) {
        console.error('Error inicializando DB:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
