import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaSearch, FaBoxOpen, FaImage, FaCamera } from 'react-icons/fa';

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '', description: '', price: '', category_id: '', category: '', image_url: '', stock: 0
    });
    const [editMode, setEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const API_URL = '/api';

    const fetchData = async () => {
        try {
            setLoading(true);
            const [resProducts, resCats] = await Promise.all([
                axios.get(`${API_URL}/products`).catch(() => ({ data: { products: [] } })),
                axios.get(`${API_URL}/categories`).catch(() => ({ data: { categories: [] } }))
            ]);

            setProducts(resProducts.data.products || []);
            setCategories(resCats.data.categories || []);
        } catch (error) {
            console.error('Error loading data:', error);
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
            // Buscamos el nombre de la categoría para guardarlo también (compatibilidad)
            const selectedCat = categories.find(c => c.id === parseInt(formData.category_id));
            const payload = {
                ...formData,
                category: selectedCat ? selectedCat.name : formData.category,
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
            console.error('Error guardando:', error);
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
            category_id: prod.category_id || '',
            category: prod.category || '',
            image_url: prod.image_url || '',
            stock: prod.stock || 0
        });
        setCurrentId(prod.id);
        setEditMode(true);
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', price: '', category_id: '', category: '', image_url: '', stock: 0 });
        setEditMode(false);
        setCurrentId(null);
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category_name || p.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                            <FaBoxOpen className="text-white text-2xl" />
                        </div>
                        Inventario Real
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium italic">Gestión inteligente de Hardware y Software</p>
                </div>

                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative flex-1 md:w-80 group">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar en el catálogo..."
                            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm bg-white/50 backdrop-blur-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-gray-200 transition-all hover:-translate-y-1 active:scale-95"
                    >
                        <FaPlus /> Crear
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-24 text-gray-400 gap-4">
                    <FaSpinner className="animate-spin text-5xl text-blue-500" />
                    <span className="font-bold animate-pulse">Sincronizando bodega...</span>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center p-20 bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                        <FaSearch className="text-gray-200 text-3xl" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">No hay resultados</h2>
                    <p className="text-gray-400 max-w-xs mx-auto">Intenta ajustar tu búsqueda o crea un nuevo producto para tu inventario.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredProducts.map((prod) => (
                        <div key={prod.id} className="group bg-white rounded-[2.5rem] shadow-xl shadow-gray-100/50 border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 flex flex-col hover:-translate-y-2 relative">
                            {/* Stock Badge */}
                            <div className={`absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border border-white/20 backdrop-blur-md ${prod.stock > 10 ? 'bg-green-500/90 text-white' : prod.stock > 0 ? 'bg-amber-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                                {prod.stock > 0 ? `Stock: ${prod.stock}` : 'Agotado'}
                            </div>

                            {/* Image Container */}
                            <div className="h-56 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center relative overflow-hidden">
                                {prod.image_url && (prod.image_url.startsWith('http') || prod.image_url.startsWith('data:') || prod.image_url.startsWith('/')) ? (
                                    <img
                                        src={prod.image_url}
                                        alt={prod.name}
                                        className="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-700 ease-out"
                                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                    />
                                ) : null}
                                <div className={`flex flex-col items-center justify-center text-gray-200 ${prod.image_url ? 'hidden' : ''}`}>
                                    <FaImage className="w-16 h-16 mb-2 opacity-20" />
                                    <span className="text-[10px] font-black uppercase tracking-tighter opacity-30">No Media Assets</span>
                                </div>

                                {/* Overlay Category */}
                                <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md text-gray-600 text-[10px] px-3 py-1.5 rounded-2xl font-bold shadow-sm border border-white">
                                    {prod.category_name || prod.category || 'Sin Cat.'}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 pt-4 flex-1 flex flex-col">
                                <h3 className="font-extrabold text-xl text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">{prod.name}</h3>
                                <p className="text-xs text-gray-400 line-clamp-2 mb-6 leading-relaxed font-medium">{prod.description || 'Sin descripción disponible'}</p>

                                <div className="flex justify-between items-end mt-auto">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Precio de Venta</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-blue-600 font-black text-2xl tracking-tighter">$</span>
                                            <span className="text-gray-900 font-black text-2xl tracking-tighter">{parseFloat(prod.price).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mb-1">
                                        <button
                                            onClick={() => handleEdit(prod)}
                                            className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm"
                                            title="Editar"
                                        >
                                            <FaEdit size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(prod.id)}
                                            className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"
                                            title="Eliminar"
                                        >
                                            <FaTrash size={14} />
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
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl p-8 animate-pop-in border border-white/20 my-auto">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                                {editMode ? 'Pulir Producto' : 'Nuevo Producto'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center transition-colors">✕</button>
                        </div>

                        {/* Importador IA Mini Card */}
                        {!editMode && (
                            <div className="mb-8 p-6 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl shadow-xl shadow-blue-200 text-white flex flex-col gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div> Importación Inteligente
                                    </label>
                                    <p className="text-xs font-medium opacity-90">Extrae datos automáticamente de Amazon, Mercado Libre o cualquier e-commerce.</p>
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="URL del producto..."
                                        className="flex-1 px-4 py-3 text-sm rounded-2xl bg-white/10 border border-white/20 placeholder:text-white/40 focus:bg-white/20 focus:ring-0 outline-none transition-all"
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
                                            btn.innerHTML = '<span class="animate-spin inline-block">↻</span>';
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
                                                    alert('✅ ¡Magia completada! Hemos llenado el formulario por ti.');
                                                }
                                            } catch (error) {
                                                alert(`❌ Error: ${error.response?.data?.error || error.message}`);
                                            } finally {
                                                btn.disabled = false;
                                                btn.innerHTML = 'Scan';
                                            }
                                        }}
                                        id="btnAnalyze"
                                        className="bg-white text-blue-700 hover:bg-white/90 px-6 py-3 rounded-2xl text-sm font-black transition-all active:scale-95"
                                    >
                                        Scan
                                    </button>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Nombre Comercial</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-gray-800"
                                        placeholder="Ej. Kit POS Gaming Pro"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Precio Unitario</label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-gray-400">$</span>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full pl-10 pr-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-gray-800"
                                            required
                                            min="0"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Stock Disponible</label>
                                    <input
                                        type="number"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                        className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-gray-800"
                                        min="0"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Categoría</label>
                                    <select
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                        className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-bold text-gray-800 appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="">Selecciona el grupo...</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Imagen del Producto</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={formData.image_url}
                                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                            className="flex-1 px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-xs font-mono"
                                            placeholder="URL (https://...) o Base64"
                                        />
                                        <label className="flex items-center justify-center p-3.5 bg-gray-900 text-white rounded-2xl cursor-pointer hover:bg-black transition-all">
                                            <FaCamera />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file && file.size < 2 * 1024 * 1024) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => setFormData(p => ({ ...p, image_url: reader.result }));
                                                        reader.readAsDataURL(file);
                                                    } else { alert('Máximo 2MB'); }
                                                }}
                                            />
                                        </label>
                                    </div>
                                    {formData.image_url && (
                                        <div className="mt-3 w-20 h-20 rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                            <img src={formData.image_url} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block ml-1">Descripción Breve</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium text-gray-700 min-h-[100px]"
                                        placeholder="Describe las ventajas de este producto..."
                                    />
                                </div>
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
                                    className="px-12 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                                >
                                    {editMode ? 'Guardar Cambios' : 'Lanzar Producto'}
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
