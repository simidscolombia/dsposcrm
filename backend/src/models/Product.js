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
}

export default Product;
