import db from '../config/database.js';

class Lead {
    static async create(data) {
        const { name, whatsapp, city, businessType } = data;
        // Validar datos mínimos
        if (!name || !whatsapp) {
            throw new Error('Nombre y WhatsApp son requeridos');
        }

        const result = await db.query(
            `INSERT INTO crm_leads (name, whatsapp, city, business_type) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [name, whatsapp, city, businessType]
        );
        return result.rows[0];
    }

    static async findAll() {
        const result = await db.query('SELECT * FROM crm_leads ORDER BY created_at DESC');
        return result.rows;
    }

    static async findById(id) {
        const result = await db.query('SELECT * FROM crm_leads WHERE id = $1', [id]);
        return result.rows[0];
    }
}

export default Lead;
