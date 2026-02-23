
import db from '../config/database.js';

class Prize {
    static async findAll() {
        const result = await db.query('SELECT * FROM crm_prizes ORDER BY is_active DESC, probability DESC');
        return result.rows;
    }

    static async findByCategories(categories) {
        // Return prizes that match ANY of the given categories, or prizes with no category restriction (null/empty)
        if (!categories || categories.length === 0) {
            // No filter — return all active prizes
            const result = await db.query(
                'SELECT * FROM crm_prizes WHERE is_active = true ORDER BY probability DESC'
            );
            return result.rows;
        }

        const result = await db.query(
            `SELECT * FROM crm_prizes 
             WHERE is_active = true 
             AND (
                 applicable_categories IS NULL 
                 OR applicable_categories = '' 
                 OR applicable_categories = 'all'
                 ${categories.map((_, i) => `OR applicable_categories ILIKE $${i + 1}`).join(' ')}
             )
             ORDER BY probability DESC`,
            categories.map(c => `%${c}%`)
        );
        return result.rows;
    }

    static async create(data) {
        const { name, description, probability, type, value, icon, is_active, applicable_categories } = data;
        const result = await db.query(
            `INSERT INTO crm_prizes (name, description, probability, type, value, icon, is_active, applicable_categories) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [name, description || '', probability || 0, type || 'discount', value || '', icon || '🎁', is_active !== false, applicable_categories || 'all']
        );
        return result.rows[0];
    }

    static async update(id, data) {
        const { name, description, probability, type, value, icon, is_active, applicable_categories } = data;
        const result = await db.query(
            `UPDATE crm_prizes 
             SET name = $2, 
                 description = $3,
                 probability = $4,
                 type = $5,
                 value = $6,
                 icon = $7,
                 is_active = $8,
                 applicable_categories = $9
             WHERE id = $1 RETURNING *`,
            [id, name, description || '', parseInt(probability) || 0, type || 'discount', value || '', icon || '🎁', is_active !== false, applicable_categories || 'all']
        );
        return result.rows[0];
    }

    static async delete(id) {
        const result = await db.query('DELETE FROM crm_prizes WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
}

export default Prize;
