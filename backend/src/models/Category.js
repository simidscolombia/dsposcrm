import db from '../config/database.js';

class Category {
    // Obtener todas las categorías ordenadas
    static async findAll() {
        const result = await db.query('SELECT * FROM crm_categories WHERE is_active = true ORDER BY "order" ASC');
        return result.rows;
    }

    // Obtener categoría por ID
    static async findById(id) {
        const result = await db.query('SELECT * FROM crm_categories WHERE id = $1', [id]);
        return result.rows[0];
    }

    // Crear nueva categoría
    static async create(data) {
        const { name, slug, description, image_url, icon, order } = data;
        const result = await db.query(
            `INSERT INTO crm_categories (name, slug, description, image_url, icon, "order") 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, slug, description, image_url, icon, order || 0]
        );
        return result.rows[0];
    }

    // Actualizar categoría
    static async update(id, data) {
        const { name, slug, description, image_url, icon, order, is_active } = data;
        const result = await db.query(
            `UPDATE crm_categories 
             SET name = COALESCE($2, name), 
                 slug = COALESCE($3, slug),
                 description = COALESCE($4, description),
                 image_url = COALESCE($5, image_url),
                 icon = COALESCE($6, icon),
                 "order" = COALESCE($7, "order"),
                 is_active = COALESCE($8, is_active)
             WHERE id = $1 RETURNING *`,
            [id, name, slug, description, image_url, icon, order, is_active]
        );
        return result.rows[0];
    }

    // "Eliminar" categoría (Soft Delete)
    static async delete(id) {
        const result = await db.query(
            'UPDATE crm_categories SET is_active = false WHERE id = $1 RETURNING *',
            [id]
        );
        return result.rows[0];
    }
}

export default Category;
