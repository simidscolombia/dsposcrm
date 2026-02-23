
import Prize from '../models/Prize.js';
import db from '../config/database.js';

class PrizeController {
    async getAll(req, res) {
        try {
            // Auto-migrate: ensure applicable_categories column exists
            await db.query(`
                ALTER TABLE crm_prizes ADD COLUMN IF NOT EXISTS applicable_categories TEXT DEFAULT 'all'
            `).catch(() => { });

            const prizes = await Prize.findAll();
            res.json({ success: true, prizes });
        } catch (error) {
            console.error('Error fetching prizes:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Get prizes filtered by cart categories
    async getByCategories(req, res) {
        try {
            const { categories } = req.query; // comma-separated: "Combos,Hardware"
            const catArray = categories ? categories.split(',').map(c => c.trim()).filter(Boolean) : [];
            const prizes = await Prize.findByCategories(catArray);
            res.json({ success: true, prizes });
        } catch (error) {
            console.error('Error fetching prizes by category:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async create(req, res) {
        try {
            const { name } = req.body;
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
            const deleted = await Prize.delete(id);
            if (!deleted) return res.status(404).json({ success: false, error: 'Prize not found' });
            res.json({ success: true, message: 'Prize deleted' });
        } catch (error) {
            console.error('Error deleting prize:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default new PrizeController();
