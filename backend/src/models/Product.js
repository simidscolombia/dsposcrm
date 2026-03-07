import db from '../config/database.js';

class Product {
    static async findAll() {
        // Unimos con categorías para obtener el nombre real de la categoría
        const result = await db.query(`
            SELECT p.*, c.name as category_name, c.slug as category_slug
            FROM crm_products p
            LEFT JOIN crm_categories c ON p.category_id = c.id
            WHERE p.is_active = true 
            ORDER BY c."order" ASC, p.name ASC
        `);
        return result.rows;
    }

    static async findById(id) {
        const result = await db.query('SELECT * FROM crm_products WHERE id = $1', [id]);
        return result.rows[0];
    }

    static async create(data) {
        const { name, description, price, category_id, category, image_url, stock, system_type } = data;

        // Intentamos guardar tanto category_id como el string category para retro-compatibilidad
        const result = await db.query(
            `INSERT INTO crm_products (name, description, price, category_id, category, image_url, stock, system_type) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [name, description, price, category_id || null, category || null, image_url, stock || 0, system_type || 'All']
        );
        return result.rows[0];
    }

    static async update(id, data) {
        const { name, description, price, category_id, category, image_url, stock, is_active, system_type } = data;
        const result = await db.query(
            `UPDATE crm_products 
             SET name = COALESCE($2, name), 
                 description = COALESCE($3, description),
                 price = COALESCE($4, price),
                 category_id = COALESCE($5, category_id),
                 category = COALESCE($6, category),
                 image_url = COALESCE($7, image_url),
                 stock = COALESCE($8, stock),
                 is_active = COALESCE($9, is_active),
                 system_type = COALESCE($10, system_type)
             WHERE id = $1 RETURNING *`,
            [id, name, description, price, category_id, category, image_url, stock, is_active, system_type]
        );
        return result.rows[0];
    }

    static async delete(id) {
        const result = await db.query(
            'UPDATE crm_products SET is_active = false WHERE id = $1 RETURNING *',
            [id]
        );
        return result.rows[0];
    }
}

export default Product;
