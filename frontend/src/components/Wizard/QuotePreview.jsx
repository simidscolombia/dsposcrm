import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaPlus, FaMinus, FaTrash, FaArrowLeft, FaGift,
    FaShoppingCart, FaEdit, FaExchangeAlt, FaTimes,
    FaSearch, FaCheck, FaFileAlt, FaUserCircle, FaBuilding
} from 'react-icons/fa';

const QuotePreview = ({
    selectedProducts = [],
    onConfirm,
    onGoBackToCatalog,
    clientName = '',
    clientPhone = '',
    onUpdateClient
}) => {
    // Helper to sanitize corrupted data
    const sanitizeText = (text, maxLength = 80) => {
        if (!text) return 'Sin nombre';
        const str = String(text);
        if (str.length > maxLength || str.includes('data:image') || str.length > 200) {
            return str.substring(0, Math.min(str.length, 50)) + '...';
        }
        return str;
    };

    // State for local products (the "cart" in this view)
    const [products, setProducts] = useState(
        (selectedProducts || []).map(p => ({
            ...p,
            name: sanitizeText(p.name || p.product_name || 'Articulo', 120),
            category: sanitizeText(p.category || p.category_name || 'General', 50),
            quantity: p.quantity || 1
        }))
    );

    // Client Info State
    const [nameInput, setNameInput] = useState(clientName || '');
    const [isEditingName, setIsEditingName] = useState(false);

    // Modal & Catalog states
    const [allProducts, setAllProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' | 'swap'
    const [swapIndex, setSwapIndex] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    // Load initial products from props if they change
    useEffect(() => {
        if (selectedProducts && selectedProducts.length > 0 && products.length === 0) {
            setProducts(selectedProducts.map(p => ({
                ...p,
                name: sanitizeText(p.name || p.product_name || 'Articulo', 120),
                category: sanitizeText(p.category || p.category_name || 'General', 50),
                quantity: p.quantity || 1
            })));
        }
    }, [selectedProducts]);

    // Fetch catalog for modals
    const fetchCatalog = async () => {
        if (allProducts.length > 0) return;
        setLoadingProducts(true);
        try {
            const RAW_API_URL = import.meta.env.VITE_API_URL || '';
            const API_URL = RAW_API_URL.endsWith('/api') ? RAW_API_URL.slice(0, -4) : RAW_API_URL;
            const res = await axios.get(`${API_URL}/api/products`);
            if (res.data?.success) {
                setAllProducts(res.data.products);
            }
        } catch (error) {
            console.error("Error fetching catalog:", error);
        } finally {
            setLoadingProducts(false);
        }
    };

    // =============================================
    // ACTIONS
    // =============================================
    const updateQuantity = (index, delta) => {
        setProducts(prev => {
            const updated = [...prev];
            const newQty = (updated[index].quantity || 1) + delta;
            if (newQty < 1) return prev;
            updated[index] = { ...updated[index], quantity: newQty };
            return updated;
        });
    };

    const removeProduct = (index) => {
        setProducts(prev => prev.filter((_, i) => i !== index));
    };

    const handleSwapClick = (index) => {
        setSwapIndex(index);
        setModalMode('swap');
        setFilterCategory(products[index].category || '');
        setSearchTerm('');
        setShowModal(true);
        fetchCatalog();
    };

    const handleAddClick = () => {
        setSwapIndex(null);
        setModalMode('add');
        setFilterCategory('');
        setSearchTerm('');
        setShowModal(true);
        fetchCatalog();
    };

    const handleSelectProduct = (newProduct) => {
        const sanitized = {
            ...newProduct,
            name: sanitizeText(newProduct.name || newProduct.product_name, 100),
            category: sanitizeText(newProduct.category || newProduct.category_name, 40)
        };

        if (modalMode === 'swap' && swapIndex !== null) {
            setProducts(prev => {
                const updated = [...prev];
                updated[swapIndex] = { ...sanitized, quantity: updated[swapIndex].quantity };
                return updated;
            });
        } else {
            // Check if exists
            const existing = products.findIndex(p => p.id === newProduct.id);
            if (existing >= 0) {
                updateQuantity(existing, 1);
            } else {
                setProducts(prev => [...prev, { ...sanitized, quantity: 1 }]);
            }
        }
        setShowModal(false);
    };

    const handleNameBlur = () => {
        setIsEditingName(false);
        if (onUpdateClient) onUpdateClient(nameInput, clientPhone);
    };

    // =============================================
    // HELPERS
    // =============================================
    const formatCurrency = (val) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency', currency: 'COP', maximumFractionDigits: 0
        }).format(val || 0);
    };

    const calculateTotal = () => {
        return products.reduce((sum, p) => sum + (parseFloat(p.price || 0) * (p.quantity || 1)), 0);
    };

    const renderImage = (img) => {
        const isUrl = img && typeof img === 'string' && (img.startsWith('http') || img.startsWith('/') || img.startsWith('data:image'));
        return (
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-100 overflow-hidden">
                {isUrl ? (
                    <img src={img} alt="Product" className="w-full h-full object-contain p-1" />
                ) : (
                    <span className="text-2xl">📦</span>
                )}
            </div>
        );
    };

    const getFilteredModalProducts = () => {
        let filtered = allProducts;
        if (filterCategory) {
            filtered = filtered.filter(p => (p.category || '').toLowerCase() === filterCategory.toLowerCase());
        }
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            filtered = filtered.filter(p => p.name.toLowerCase().includes(s) || (p.description || '').toLowerCase().includes(s));
        }
        return filtered;
    };

    const categories = [...new Set(allProducts.map(p => sanitizeText(p.category || p.category_name, 30)).filter(c => c !== 'Sin nombre'))];

    // =============================================
    // RENDER
    // =============================================
    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
            {/* Page Header */}
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Tu Propuesta Comercial</h2>
                <p className="text-gray-500 font-medium max-w-lg mx-auto">
                    Personaliza cada detalle de tu sistema Discovery. Todo está listo para que te lleves el mejor precio.
                </p>
            </div>

            {/* 📄 DOCUMENT CONTAINER (PREMIUM PAPER) */}
            <div className="bg-white rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden relative">

                {/* Formal Header */}
                <div className="bg-[#1c242e] p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b-4 border-blue-600">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center p-3 backdrop-blur-md">
                            <img src="/logo.png" alt="Discovery" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h3 className="text-white font-black text-xl tracking-tight uppercase">Discovery Systems</h3>
                            <p className="text-blue-300 text-xs font-bold tracking-widest uppercase opacity-80">Software & Hardware POS</p>
                        </div>
                    </div>
                    <div className="text-left md:text-right">
                        <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest mb-1">Emitido el</p>
                        <p className="text-white font-mono text-base">{new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>

                {/* Info Bar */}
                <div className="px-8 md:px-12 py-8 bg-gray-50/50 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <FaUserCircle /> Preparado para:
                        </span>
                        <div className="flex items-center gap-2 group">
                            {isEditingName ? (
                                <input
                                    autoFocus
                                    className="bg-white border-blue-400 border-2 rounded-lg px-3 py-1 text-sm font-bold text-gray-800 outline-none shadow-sm"
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    onBlur={handleNameBlur}
                                    onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
                                />
                            ) : (
                                <div
                                    className="flex items-center gap-2 cursor-pointer hover:bg-white hover:shadow-sm px-2 py-1 rounded-lg transition-all"
                                    onClick={() => setIsEditingName(true)}
                                >
                                    <span className="font-black text-gray-800 text-lg">{nameInput || 'Cliente Discovery'}</span>
                                    <FaEdit className="text-blue-400 group-hover:scale-110 transition-transform text-sm" />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="md:text-right flex flex-col md:items-end justify-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Estado de Documento:</span>
                        <span className="inline-flex items-center gap-2 text-blue-600 font-black text-xs bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100 shadow-sm">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.5)]"></span>
                            Previa Modificable
                        </span>
                    </div>
                </div>

                {/* PRODUCTS TABLE */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100/30 text-left border-b border-gray-100">
                                <th className="px-8 md:px-12 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Descripción Detallada</th>
                                <th className="px-4 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Cant.</th>
                                <th className="px-8 md:px-12 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Monto Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="py-20 text-center">
                                        <p className="text-gray-400 font-bold uppercase tracking-widest">No has seleccionado productos aún.</p>
                                    </td>
                                </tr>
                            ) : products.map((p, idx) => (
                                <tr key={p.id || idx} className="hover:bg-blue-50/20 transition-colors group/row">
                                    {/* Info Column */}
                                    <td className="px-8 md:px-12 py-6">
                                        <div className="flex items-start gap-5">
                                            {renderImage(p.image_url)}
                                            <div className="min-w-0 flex-grow">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="font-black text-gray-900 text-sm md:text-base pr-2 truncate">
                                                        {p.name || 'Producto sin nombre'}
                                                    </h4>
                                                    <button
                                                        onClick={() => handleSwapClick(idx)}
                                                        className="p-1.5 bg-gray-100 text-blue-500 rounded-lg opacity-0 group-hover/row:opacity-100 hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110 shadow-sm"
                                                        title="Cambiar modelo"
                                                    >
                                                        <FaExchangeAlt size={11} />
                                                    </button>
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">
                                                    Cat: {p.category || 'General'}
                                                </p>
                                                <button
                                                    onClick={() => removeProduct(idx)}
                                                    className="flex items-center gap-1.5 text-red-300 hover:text-red-500 text-[10px] font-black uppercase tracking-widest transition-colors opacity-0 group-hover/row:opacity-100"
                                                >
                                                    <FaTrash size={9} /> Eliminar línea
                                                </button>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Quantity Column */}
                                    <td className="px-4 py-6 align-middle">
                                        <div className="flex items-center justify-center gap-2 p-1.5 bg-white border border-gray-200 rounded-2xl w-fit mx-auto shadow-sm">
                                            <button
                                                onClick={() => updateQuantity(idx, -1)}
                                                className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all border border-gray-100"
                                            >
                                                <FaMinus size={10} />
                                            </button>
                                            <span className="w-8 text-center font-black text-gray-800 text-sm">{p.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(idx, 1)}
                                                className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-all border border-gray-100"
                                            >
                                                <FaPlus size={10} />
                                            </button>
                                        </div>
                                    </td>

                                    {/* Price Column */}
                                    <td className="px-8 md:px-12 py-6 text-right align-middle">
                                        <p className="text-[10px] text-gray-400 font-bold mb-1 opacity-60">
                                            {formatCurrency(p.price)} / un
                                        </p>
                                        <p className="font-black text-gray-900 text-lg">
                                            {formatCurrency(parseFloat(p.price || 0) * (p.quantity || 1))}
                                        </p>
                                    </td>
                                </tr>
                            ))}

                            {/* Empty State or Add Row */}
                            <tr>
                                <td colSpan="3" className="px-12 py-10 text-center">
                                    <button
                                        onClick={handleAddClick}
                                        className="inline-flex items-center gap-3 px-8 py-3.5 bg-white border-2 border-dashed border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm group"
                                    >
                                        <FaPlus className="text-lg group-hover:rotate-90 transition-transform" />
                                        Añadir equipo o servicio adicional
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* TOTALS PILL (BOTTOM) */}
                <div className="bg-gray-50/80 border-t-2 border-gray-100 px-8 md:px-12 py-10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex flex-col gap-2 max-w-sm">
                            <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-4 py-2 rounded-xl border border-orange-100 w-fit">
                                <FaGift className="animate-bounce" />
                                <span className="text-xs font-black uppercase tracking-widest">Premio listo para aplicar</span>
                            </div>
                            <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                                * Al confirmar, tu beneficio de la ruleta se aplicará automáticamente sobre el gran total de esta propuesta.
                            </p>
                        </div>

                        <div className="w-full md:w-[350px] bg-white rounded-3xl p-6 shadow-2xl shadow-blue-900/10 border border-blue-50">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtotal Neto</span>
                                <span className="text-gray-600 font-bold">{formatCurrency(calculateTotal())}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-100">
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-gray-900 uppercase tracking-tighter leading-none">Total Inversión</span>
                                    <span className="text-[9px] text-blue-600 font-bold">IVA Incluido</span>
                                </div>
                                <span className="text-3xl font-black text-blue-600 tabular-nums">
                                    {formatCurrency(calculateTotal())}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FORMAL FOOTER */}
                <div className="bg-white px-12 py-5 border-t border-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-4 text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                        <span>Discovery Systems Co.</span>
                        <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                        <span>Propuesta #DS-{Math.floor(Math.random() * 9000) + 1000}</span>
                    </div>
                    <div className="flex items-center gap-1.5 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all cursor-crosshair">
                        <FaBuilding /> <span className="text-[9px] font-black tracking-widest uppercase">Verified System</span>
                    </div>
                </div>
            </div>

            {/* CTA BUTTONS SECTION */}
            <div className="mt-12 flex flex-col md:flex-row items-center gap-6">
                <button
                    onClick={onGoBackToCatalog}
                    className="w-full md:w-auto px-10 py-5 bg-white text-gray-500 font-black rounded-2xl border-2 border-gray-100 hover:border-gray-200 hover:text-gray-800 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg shadow-gray-200/50"
                >
                    <FaArrowLeft /> Volver al Catálogo
                </button>

                <button
                    onClick={() => onConfirm(products)}
                    className="w-full flex-grow bg-blue-600 text-white text-xl font-black py-5 px-10 rounded-2xl shadow-2xl shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-4 relative overflow-hidden group active:scale-95"
                >
                    <span className="relative z-10 flex items-center gap-3">
                        ¡Confirmar & Ir por mi Premio! <FaGift className="text-2xl animate-pulse" />
                    </span>
                    {/* Shimmer effect */}
                    <div className="absolute inset-x-0 inset-y-0 w-1/4 h-full bg-white/20 -skew-x-12 translate-x-[-200%] group-hover:animate-shimmer transition-all"></div>
                </button>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-[10px] text-gray-400 font-black uppercase tracking-[0.15em]">
                <span className="flex items-center gap-2"><FaCheck className="text-green-500" /> Precios Protegidos</span>
                <span className="flex items-center gap-2"><FaShoppingCart /> Selección Premium</span>
                <span className="flex items-center gap-2"><FaFileAlt /> PDF Generado al Final</span>
            </div>

            {/* =============================================
                MODAL: SWAP / ADD
            ============================================= */}
            {showModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 backdrop-blur-md bg-gray-900/60 transition-all duration-300"
                    onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
                >
                    <div className="bg-white w-full md:max-w-xl md:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl max-h-[85vh] flex flex-col animate-slide-up overflow-hidden border border-white/20">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-8 flex flex-col gap-1 relative flex-shrink-0">
                            <h3 className="text-white font-black text-2xl tracking-tight">
                                {modalMode === 'swap' ? '🔁 Cambiar Modelo' : '➕ Agregar al Kit'}
                            </h3>
                            <p className="text-blue-100/70 text-sm font-medium">
                                {modalMode === 'swap' ? 'Selecciona una alternativa de la misma categoría' : 'Explora todo nuestro ecosistema tecnológico'}
                            </p>
                            <button
                                onClick={() => setShowModal(false)}
                                className="absolute top-6 right-6 w-10 h-10 bg-black/20 text-white rounded-full flex items-center justify-center hover:bg-black/40 transition-all group z-30"
                            >
                                <FaTimes className="group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>

                        {/* Search & Tabs */}
                        <div className="p-6 bg-gray-50 border-b border-gray-100 flex-shrink-0 space-y-4">
                            <div className="relative">
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="¿Qué equipo buscas?..."
                                    className="w-full pl-12 pr-6 py-4 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-gray-800 text-sm shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {modalMode === 'add' && (
                                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                    <button
                                        onClick={() => setFilterCategory('')}
                                        className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${!filterCategory ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-100'}`}
                                    >
                                        Todos
                                    </button>
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setFilterCategory(cat)}
                                            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${filterCategory === cat ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-100'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Grid/List */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {loadingProducts ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                                    <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Consultando Inventario...</p>
                                </div>
                            ) : getFilteredModalProducts().length === 0 ? (
                                <div className="text-center py-20">
                                    <div className="text-5xl mb-4 grayscale opacity-50">🛰️</div>
                                    <p className="text-gray-500 font-black text-sm uppercase mb-1">Sin coincidencias</p>
                                    <p className="text-gray-400 text-xs">Prueba con otras palabras clave</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 pb-4">
                                    {getFilteredModalProducts().map(item => {
                                        const isInCart = products.some(p => p.id === item.id);
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => handleSelectProduct(item)}
                                                className={`flex items-center gap-4 p-4 rounded-3xl border text-left transition-all active:scale-95 group ${isInCart ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-gray-100 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-50'}`}
                                            >
                                                {renderImage(item.image_url)}
                                                <div className="flex-grow min-w-0 pr-2">
                                                    <h4 className="font-black text-gray-800 text-sm truncate group-hover:text-blue-600 transition-colors">{item.name}</h4>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.category}</p>
                                                    <p className="text-blue-600 font-black mt-1">{formatCurrency(item.price)}</p>
                                                </div>
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isInCart ? 'bg-green-500 text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                                                    {isInCart ? <FaCheck /> : (modalMode === 'swap' ? <FaExchangeAlt size={12} /> : <FaPlus />)}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-white border-t border-gray-100 flex-shrink-0">
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-full py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors uppercase text-xs tracking-widest"
                            >
                                Cerrar Ventana
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Animations required for Shimmer */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shimmer {
                    100% { transform: translateX(400%); }
                }
                .animate-shimmer {
                    animation: shimmer 1.5s infinite;
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
};

export default QuotePreview;
