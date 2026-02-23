
import db from '../config/database.js';

class Prize {
    static async findAll() {
        const result = await db.query('SELECT * FROM crm_prizes ORDER BY is_active DESC, probability DESC');
        return result.rows;
    }

    static async create(data) {
        const { name, description, probability, type, value, icon, is_active } = data;
        const result = await db.query(
            `INSERT INTO crm_prizes (name, description, probability, type, value, icon, is_active) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, description || '', probability || 0, type || 'discount', value || '', icon || '🎁', is_active !== false]
        );
        return result.rows[0];
    }

    static async update(id, data) {
        const { name, description, probability, type, value, icon, is_active } = data;
        // Use explicit SET for each field instead of COALESCE so all fields are truly editable
        const result = await db.query(
            `UPDATE crm_prizes 
             SET name = $2, 
                 description = $3,
                 probability = $4,
                 type = $5,
                 value = $6,
                 icon = $7,
                 is_active = $8
             WHERE id = $1 RETURNING *`,
            [id, name, description || '', parseInt(probability) || 0, type || 'discount', value || '', icon || '🎁', is_active !== false]
        );
        return result.rows[0];
    }

    static async delete(id) {
        const result = await db.query('DELETE FROM crm_prizes WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
}

export default Prize;
