import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaSpinner, FaEye } from 'react-icons/fa';

const AdminCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', slug: '', description: '', icon: '', order: 0 });
    const [editMode, setEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);

    const API_URL = '/api';

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/api/categories`);
            if (res.data.success) {
                setCategories(res.data.categories);
            }
        } catch (error) {
            console.error('Error cargando categorías:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                slug: formData.slug || formData.name.toLowerCase().replace(/ /g, '-')
            };

            if (editMode) {
                await axios.put(`${API_URL}/api/categories/${currentId}`, payload);
            } else {
                await axios.post(`${API_URL}/api/categories`, payload);
            }
            setShowModal(false);
            fetchCategories();
            resetForm();
        } catch (error) {
            console.error('Error guardando categoría:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Error desconocido';
            alert(`Error al guardar: ${typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg}`);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar esta categoría?')) return;
        try {
            await axios.delete(`${API_URL}/api/categories/${id}`);
            fetchCategories();
        } catch (error) {
            console.error('Error eliminando:', error);
        }
    };

    const handleEdit = (cat) => {
        setFormData({
            name: cat.name,
            slug: cat.slug,
            description: cat.description || '',
            icon: cat.icon || '',
            order: cat.order || 0
        });
        setCurrentId(cat.id);
        setEditMode(true);
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({ name: '', slug: '', description: '', icon: '', order: 0 });
        setEditMode(false);
        setCurrentId(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Categorías</h1>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg"
                >
                    <FaPlus /> Nueva Categoría
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12 text-gray-400">
                    <FaSpinner className="animate-spin text-4xl" />
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-400">
                    No hay categorías creadas. ¡Crea la primera!
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Orden</th>
                                <th className="px-6 py-4">Nombre</th>
                                <th className="px-6 py-4">Slug (URL)</th>
                                <th className="px-6 py-4 text-center">Icono</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {categories.map((cat) => (
                                <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-gray-400 font-mono">#{cat.order}</td>
                                    <td className="px-6 py-4 font-medium text-gray-800">{cat.name}</td>
                                    <td className="px-6 py-4 text-gray-500 text-sm">/CAT-{cat.slug}</td>
                                    <td className="px-6 py-4 text-center text-xl text-blue-500">
                                        {/* Aquí podríamos renderizar el icono dinámicamente si tenemos la librería cargada */}
                                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mx-auto">
                                            {cat.icon ? <FaCheck className="text-xs" /> : '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => handleEdit(cat)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                                            <FaEdit />
                                        </button>
                                        <button onClick={() => handleDelete(cat.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-pop-in">
                        <h2 className="text-xl font-bold mb-4">
                            {editMode ? 'Editar Categoría' : 'Nueva Categoría'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Ej. Gaming, Periféricos"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug (Opcional)</label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono text-gray-500"
                                        placeholder="gaming-perifericos"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                                    <input
                                        type="number"
                                        value={formData.order}
                                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                                    placeholder="Breve descripción de la categoría"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
                                >
                                    {editMode ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCategories;
