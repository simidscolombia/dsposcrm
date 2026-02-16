import Lead from '../models/Lead.js';

class LeadController {
    async create(req, res) {
        try {
            const { name, whatsapp, city, businessType } = req.body;

            // Validación básica
            if (!name || !whatsapp) {
                return res.status(400).json({
                    success: false,
                    error: 'Nombre y WhatsApp son requeridos'
                });
            }

            const lead = await Lead.create({ name, whatsapp, city, businessType });

            console.log('✅ Lead guardado:', lead.id, lead.name);

            res.status(201).json({ success: true, lead });
        } catch (error) {
            console.error('Error creando lead:', error);
            res.status(500).json({ success: false, error: 'Error al registrar cliente' });
        }
    }

    async getAll(req, res) {
        try {
            const leads = await Lead.findAll();
            res.json({ success: true, leads });
        } catch (error) {
            console.error('Error obteniendo leads:', error);
            res.status(500).json({ success: false, error: 'Error al consultar clientes' });
        }
    }
}

export default new LeadController();
