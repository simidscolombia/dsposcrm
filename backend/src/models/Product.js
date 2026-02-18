import db from '../config/database.js';

class Product {
    static async findAll() {
        const result = await db.query('SELECT * FROM crm_products WHERE is_active = true ORDER BY category, name');
        return result.rows;
    }

    static async findById(id) {
        const result = await db.query('SELECT * FROM crm_products WHERE id = $1', [id]);
        return result.rows[0];
    }

    static async create(data) {
        const { name, description, price, category, image_url, stock } = data;
        const result = await db.query(
            `INSERT INTO crm_products (name, description, price, category, image_url, stock) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, description, price, category, image_url, stock || 0]
        );
        return result.rows[0];
    }

    static async update(id, data) {
        const { name, description, price, category, image_url, stock, is_active } = data;
        const result = await db.query(
            `UPDATE crm_products 
             SET name = COALESCE($2, name), 
                 description = COALESCE($3, description),
                 price = COALESCE($4, price),
                 category = COALESCE($5, category),
                 image_url = COALESCE($6, image_url),
                 stock = COALESCE($7, stock),
                 is_active = COALESCE($8, is_active)
             WHERE id = $1 RETURNING *`,
            [id, name, description, price, category, image_url, stock, is_active]
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
