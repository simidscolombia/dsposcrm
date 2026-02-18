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

    async create(req, res) {
        try {
            const { name, price, category } = req.body;
            if (!name || (price === undefined) || !category) {
                return res.status(400).json({ success: false, error: 'Nombre, precio y categoría son obligatorios' });
            }
            const product = await Product.create(req.body);
            res.status(201).json({ success: true, product });
        } catch (error) {
            console.error('Error creando producto:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const updatedProduct = await Product.update(id, req.body);
            if (!updatedProduct) {
                return res.status(404).json({ success: false, error: 'Producto no encontrado' });
            }
            res.json({ success: true, product: updatedProduct });
        } catch (error) {
            console.error('Error actualizando producto:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            const deleted = await Product.delete(id);
            if (!deleted) {
                return res.status(404).json({ success: false, error: 'Producto no encontrado' });
            }
            res.json({ success: true, message: 'Producto eliminado correctamente' });
        } catch (error) {
            console.error('Error eliminando producto:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default new ProductController();
