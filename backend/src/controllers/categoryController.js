import Category from '../models/Category.js';

class CategoryController {
    // Obtener todas
    async getAll(req, res) {
        try {
            const categories = await Category.findAll();
            res.json({ success: true, categories });
        } catch (error) {
            console.error('Error obteniendo categorías:', error);
            res.status(500).json({ success: false, error: 'Error al consultar categorías' });
        }
    }

    // Crear
    async create(req, res) {
        try {
            const { name, slug, description, image_url, icon, order } = req.body;

            // Validación básica
            if (!name || !slug) {
                return res.status(400).json({ success: false, error: 'Nombre y Slug son obligatorios' });
            }

            const newCategory = await Category.create({ name, slug, description, image_url, icon, order });
            res.status(201).json({ success: true, category: newCategory });
        } catch (error) {
            console.error('Error creando categoría:', error);
            // Return detailed error for debugging
            res.status(500).json({
                success: false,
                error: error.message,
                details: error.toString(),
                code: error.code // Postgres error code if available
            });
        }
    }

    // Actualizar
    async update(req, res) {
        try {
            const { id } = req.params;
            const updatedCategory = await Category.update(id, req.body);

            if (!updatedCategory) {
                return res.status(404).json({ success: false, error: 'Categoría no encontrada' });
            }

            res.json({ success: true, category: updatedCategory });
        } catch (error) {
            console.error('Error actualizando categoría:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Eliminar (Soft Delete)
    async delete(req, res) {
        try {
            const { id } = req.params;
            const deleted = await Category.delete(id);

            if (!deleted) {
                return res.status(404).json({ success: false, error: 'Categoría no encontrada' });
            }

            res.json({ success: true, message: 'Categoría eliminada correctamente' });
        } catch (error) {
            console.error('Error eliminando categoría:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default new CategoryController();
