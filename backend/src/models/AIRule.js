import db from '../config/database.js';

class AIRule {
    static async findAll() {
        const result = await db.query('SELECT * FROM crm_ai_rules WHERE is_active = true ORDER BY niche ASC');
        return result.rows;
    }

    static async findByNiche(niche) {
        const result = await db.query('SELECT * FROM crm_ai_rules WHERE niche = $1 AND is_active = true', [niche]);
        return result.rows[0];
    }

    static async create(data) {
        const { niche, key_question, suggested_hardware, expert_tips, excluded_items } = data;
        const result = await db.query(
            `INSERT INTO crm_ai_rules (niche, key_question, suggested_hardware, expert_tips, excluded_items) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [niche, key_question, JSON.stringify(suggested_hardware), JSON.stringify(expert_tips), JSON.stringify(excluded_items)]
        );
        return result.rows[0];
    }

    static async update(id, data) {
        const { niche, key_question, suggested_hardware, expert_tips, excluded_items, is_active } = data;
        const result = await db.query(
            `UPDATE crm_ai_rules 
       SET niche = COALESCE($2, niche), 
           key_question = COALESCE($3, key_question),
           suggested_hardware = COALESCE($4, suggested_hardware),
           expert_tips = COALESCE($5, expert_tips),
           excluded_items = COALESCE($6, excluded_items),
           is_active = COALESCE($7, is_active)
       WHERE id = $1 RETURNING *`,
            [id, niche, key_question, JSON.stringify(suggested_hardware), JSON.stringify(expert_tips), JSON.stringify(excluded_items), is_active]
        );
        return result.rows[0];
    }
}

export default AIRule;
