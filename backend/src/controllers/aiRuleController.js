import AIRule from '../models/AIRule.js';

export const getAllRules = async (req, res) => {
    try {
        const rules = await AIRule.findAll();
        res.json({ success: true, rules });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const createRule = async (req, res) => {
    try {
        const rule = await AIRule.create(req.body);
        res.json({ success: true, rule });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const updateRule = async (req, res) => {
    try {
        const rule = await AIRule.update(req.params.id, req.body);
        res.json({ success: true, rule });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
