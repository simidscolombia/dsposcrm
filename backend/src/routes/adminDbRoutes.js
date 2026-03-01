import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// Endpoint para inicializar tablas de Categorías y Productos
router.post('/init-tables', async (req, res) => {
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

        res.json({ success: true, message: 'Todas las tablas administrativas (incluyendo premios) creadas correctamente.' });

    } catch (error) {
        console.error('Error inicializando DB:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
