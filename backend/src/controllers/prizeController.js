
import Prize from '../models/Prize.js';

class PrizeController {
    async getAll(req, res) {
        try {
            const prizes = await Prize.findAll();
            res.json({ success: true, prizes });
        } catch (error) {
            console.error('Error fetching prizes:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async create(req, res) {
        try {
            const { name, probability } = req.body;
            if (!name) return res.status(400).json({ success: false, error: 'Name is required' });

            const prize = await Prize.create(req.body);
            res.json({ success: true, prize });
        } catch (error) {
            console.error('Error creating prize:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const prize = await Prize.update(id, req.body);
            if (!prize) return res.status(404).json({ success: false, error: 'Prize not found' });
            res.json({ success: true, prize });
        } catch (error) {
            console.error('Error updating prize:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await Prize.delete(id);
            res.json({ success: true, message: 'Prize deleted' });
        } catch (error) {
            console.error('Error deleting prize:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default new PrizeController();
