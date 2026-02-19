import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaSearch, FaBoxOpen } from 'react-icons/fa';

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '', description: '', price: '', category: '', image_url: '', stock: 0
    });
    const [editMode, setEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const API_URL = '/api';

    const fetchData = async () => {
        try {
            setLoading(true);
            console.log('Fetching products from:', `${API_URL}/products`);

            const [resProducts, resCats] = await Promise.all([
                axios.get(`${API_URL}/products`).catch(err => {
                    console.error('Error fetching products:', err);
                    return { data: { success: false, products: [] } };
                }),
                axios.get(`${API_URL}/categories`).catch(err => {
                    console.error('Error fetching categories:', err);
                    return { data: { success: false, categories: [] } };
                })
            ]);

            console.log('Products API Response:', resProducts.data);

            if (resProducts.data && (resProducts.data.success || Array.isArray(resProducts.data.products))) {
                setProducts(resProducts.data.products || []);
            } else {
                setProducts([]);
            }

            if (resCats.data && resCats.data.success) {
                setCategories(resCats.data.categories || []);
            }
        } catch (error) {
            console.error('Critical error loading data:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock)
            };

            if (editMode) {
                await axios.put(`${API_URL}/products/${currentId}`, payload);
            } else {
                await axios.post(`${API_URL}/products`, payload);
            }
            setShowModal(false);
            fetchData();
            resetForm();
        } catch (error) {
            console.error('Error guardando producto:', error);
            alert('Error al guardar: ' + (error.response?.data?.error || 'Desconocido'));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
        try {
            await axios.delete(`${API_URL}/products/${id}`);
            fetchData();
        } catch (error) {
            console.error('Error eliminando:', error);
        }
    };

    const handleEdit = (prod) => {
        setFormData({
            name: prod.name,
            description: prod.description || '',
            price: prod.price,
            category: prod.category || '',
            image_url: prod.image_url || '',
            stock: prod.stock || 0
        });
        setCurrentId(prod.id);
        setEditMode(true);
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', price: '', category: '', image_url: '', stock: 0 });
        setEditMode(false);
        setCurrentId(null);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                    <FaBoxOpen className="text-blue-600" /> Inventario
                </h1>

                <div className="flex w-full md:w-auto gap-4">
                    <div className="relative flex-1 md:w-64">
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg transition-all"
                    >
                        <FaPlus /> Nuevo Producto
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12 text-gray-400">
                    <FaSpinner className="animate-spin text-4xl" />
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-400">
                    No se encontraron productos en el inventario.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((prod) => (
                        <div key={prod.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                            <div className="h-40 bg-gray-100 flex items-center justify-center relative">
                                <span className="text-4xl">{prod.image_url || '📦'}</span>
                                <span className="absolute top-2 right-2 bg-slate-800 text-white text-xs px-2 py-1 rounded-full uppercase font-bold">
                                    {prod.category}
                                </span>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <h3 className="font-bold text-lg text-gray-800 mb-1">{prod.name}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{prod.description}</p>

                                <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-50">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400">Precio</span>
                                        <span className="font-bold text-green-600">${parseFloat(prod.price).toLocaleString()}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(prod)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                                            <FaEdit />
                                        </button>
                                        <button onClick={() => handleDelete(prod.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-pop-in overflow-y-auto max-h-[90vh]">
                        <h2 className="text-xl font-bold mb-4">
                            {editMode ? 'Editar Producto' : 'Nuevo Producto'}
                        </h2>

                        {/* Importador IA */}
                        {!editMode && (
                            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                                <label className="block text-xs font-bold text-purple-600 uppercase mb-2 flex items-center gap-1">
                                    <FaSearch /> Importar desde Web (IA)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Pega el link del producto aquí..."
                                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-400 outline-none"
                                        id="importUrl"
                                    />
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const urlInput = document.getElementById('importUrl');
                                            const url = urlInput.value;
                                            if (!url) return alert('Pega una URL primero');

                                            const btn = document.getElementById('btnAnalyze');
                                            btn.disabled = true;
                                            btn.innerHTML = '<span class="animate-spin">↻</span>';

                                            try {
                                                const res = await axios.post(`${API_URL}/products/analyze-url`, { url });
                                                if (res.data.success) {
                                                    const data = res.data.product;
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        name: data.name || prev.name,
                                                        description: data.description || prev.description,
                                                        price: data.price || prev.price,
                                                        image_url: data.image_url || prev.image_url,
                                                        category: data.category_suggestion || prev.category
                                                    }));
                                                    alert('✅ Datos extraídos con éxito. Verifica la información.');
                                                }
                                            } catch (error) {
                                                console.error(error);
                                                const errMsg = error.response?.data?.error || error.message;
                                                alert(`❌ Error al analizar: ${errMsg}\n\nPosibles causas:\n- La web bloquea robots.\n- Timeout (la página es muy pesada).\n- Error de conexión.`);
                                            } finally {
                                                btn.disabled = false;
                                                btn.innerHTML = 'Analizar';
                                            }
                                        }}
                                        id="btnAnalyze"
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
                                    >
                                        Analizar
                                    </button>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                                    <input
                                        type="number"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                >
                                    <option value="">Seleccionar...</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Icono / Emoji</label>
                                <input
                                    type="text"
                                    value={formData.image_url}
                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ej. 💻"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
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
                                    {editMode ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProducts;
