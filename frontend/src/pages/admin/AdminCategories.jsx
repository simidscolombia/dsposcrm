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

    const API_URL = '';

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/categories`);
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
                slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            };

            if (editMode) {
                await axios.put(`${API_URL}/categories/${currentId}`, payload);
            } else {
                await axios.post(`${API_URL}/categories`, payload);
            }
            setShowModal(false);
            fetchCategories();
            resetForm();
        } catch (error) {
            console.error('Error guardando categoría:', error);
            alert('Error: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar esta categoría? Esto podría afectar a los productos asociados.')) return;
        try {
            await axios.delete(`${API_URL}/categories/${id}`);
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
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                            <FaEdit className="text-white text-2xl" />
                        </div>
                        Categorías
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium italic">Clasificación lógica para tu catálogo</p>
                </div>

                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-gray-200 transition-all hover:-translate-y-1 active:scale-95"
                >
                    <FaPlus /> Crear Categoría
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-24 text-gray-400 gap-4">
                    <FaSpinner className="animate-spin text-5xl text-indigo-500" />
                    <span className="font-bold animate-pulse">Organizando estantes...</span>
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center p-20 bg-white rounded-[2.5rem] shadow-xl shadow-gray-100 border border-gray-100 flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                        <FaTimes className="text-gray-200 text-3xl" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Sin categorías</h2>
                    <p className="text-gray-400 max-w-xs mx-auto">Crea categorías para organizar tus productos de Hardware o Software.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {categories.map((cat) => (
                        <div key={cat.id} className="group bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 relative flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                    <FaCheck />
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-gray-300 bg-gray-50 px-3 py-1 rounded-full">
                                    Orden: {cat.order}
                                </div>
                            </div>

                            <h3 className="text-2xl font-black text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">{cat.name}</h3>
                            <p className="text-xs text-gray-400 font-medium mb-6 line-clamp-2 leading-relaxed">
                                {cat.description || "Sin descripción proporcionada para esta categoría automátizada."}
                            </p>

                            <div className="mt-auto pt-6 border-t border-gray-50 flex justify-between items-center">
                                <span className="text-[10px] font-mono text-gray-300 uppercase leading-none">ID: #{cat.id}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(cat)} className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm">
                                        <FaEdit size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(cat.id)} className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm">
                                        <FaTrash size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Premium Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 animate-pop-in border border-white/20 my-auto">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                                {editMode ? 'Pulir Grupo' : 'Nuevo Grupo'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center transition-colors">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Nombre de Categoría</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800"
                                    placeholder="Ej. Hardware, Software..."
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Orden Visual</label>
                                    <input
                                        type="number"
                                        value={formData.order}
                                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                        className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-gray-800"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">ID Slug (Auto)</label>
                                    <input
                                        type="text"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-[10px] font-mono text-gray-400 uppercase tracking-tighter"
                                        placeholder="hardware-pos"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Breve Descripción</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-medium text-gray-700 min-h-[100px]"
                                    placeholder="Explique qué productos pertenecen a este grupo..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-8 py-3.5 text-gray-500 hover:bg-gray-50 rounded-2xl font-bold transition-colors"
                                >
                                    Cerrar
                                </button>
                                <button
                                    type="submit"
                                    className="px-12 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
                                >
                                    {editMode ? 'Actualizar' : 'Crear Grupo'}
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
