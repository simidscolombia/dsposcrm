
import db from '../config/database.js';

class Prize {
    static async findAll() {
        // Return all prizes so Admin can toggle them. The SpinningWheel filters by is_active = true on the frontend.
        const result = await db.query('SELECT * FROM crm_prizes ORDER BY is_active DESC, probability DESC');
        return result.rows;
    }

    static async create(data) {
        const { name, description, probability, type, value, icon } = data;
        const result = await db.query(
            `INSERT INTO crm_prizes (name, description, probability, type, value, icon) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, description, probability || 0, type, value, icon || '🎁']
        );
        return result.rows[0];
    }

    static async update(id, data) {
        const { name, description, probability, type, value, icon, is_active } = data;
        const result = await db.query(
            `UPDATE crm_prizes 
             SET name = COALESCE($2, name), 
                 description = COALESCE($3, description),
                 probability = COALESCE($4, probability),
                 type = COALESCE($5, type),
                 value = COALESCE($6, value),
                 icon = COALESCE($7, icon),
                 is_active = COALESCE($8, is_active)
             WHERE id = $1 RETURNING *`,
            [id, name, description, probability, type, value, icon, is_active]
        );
        return result.rows[0];
    }

    static async delete(id) {
        const result = await db.query('DELETE FROM crm_prizes WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
}

export default Prize;
