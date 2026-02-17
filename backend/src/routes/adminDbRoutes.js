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

        // 2. Crear Tabla Productos (Actualizada)
        // Nota: Si ya existe, esto no borrará datos, pero añadiremos columnas si faltan.
        await db.query(`
            CREATE TABLE IF NOT EXISTS crm_products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(12, 2) NOT NULL,
                image_url TEXT,
                category_id INTEGER REFERENCES crm_categories(id) ON DELETE SET NULL,
                category VARCHAR(100), -- Mantener por compatibilidad temporal
                stock INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log('✅ Tabla crm_products verificada.');

        // 3. Insertar Categorías por Defecto (si está vacía)
        const checkCats = await db.query('SELECT COUNT(*) FROM crm_categories');
        if (parseInt(checkCats.rows[0].count) === 0) {
            await db.query(`
                INSERT INTO crm_categories (name, slug, icon, description, "order") VALUES
                ('Hardware', 'hardware', 'FaServer', 'Equipos físicos y terminales', 1),
                ('Software', 'software', 'FaCode', 'Licencias y programas', 2),
                ('Servicios', 'servicios', 'FaTools', 'Instalación y soporte', 3),
                ('Accesorios', 'accesorios', 'FaKeyboard', 'Periféricos y cables', 4);
            `);
            console.log('✅ Categorías por defecto insertadas.');
        }

        res.json({ success: true, message: 'Tablas administrativas creadas correctamente.' });

    } catch (error) {
        console.error('Error inicializando DB:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
