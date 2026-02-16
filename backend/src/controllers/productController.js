import Product from '../models/Product.js';

class ProductController {
    async getAll(req, res) {
        try {
            const products = await Product.findAll();
            res.json({ success: true, products });
        } catch (error) {
            console.error('Error obteniendo productos:', error);
            res.status(500).json({ success: false, error: 'Error al consultar inventario' });
        }
    }
}

export default new ProductController();
