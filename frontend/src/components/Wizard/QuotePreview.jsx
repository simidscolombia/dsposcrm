import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaMinus, FaTrash, FaArrowLeft, FaGift, FaShoppingCart, FaEdit, FaExchangeAlt, FaTimes, FaSearch, FaCheck } from 'react-icons/fa';

const QuotePreview = ({ selectedProducts, onConfirm, onGoBackToCatalog, clientName }) => {
    const [products, setProducts] = useState(selectedProducts || []);
    const [allProducts, setAllProducts] = useState([]); // All products from DB
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('swap'); // 'swap' | 'add'
    const [swapIndex, setSwapIndex] = useState(null); // Index of product being swapped
    const [filterCategory, setFilterCategory] = useState(''); // Filter for modal
    const [searchTerm, setSearchTerm] = useState('');

    // =============================================
    // FETCH ALL PRODUCTS FROM DB
    // =============================================
    const fetchAllProducts = async () => {
        if (allProducts.length > 0) return; // Already loaded
        setLoadingProducts(true);
        try {
            const RAW_API_URL = import.meta.env.VITE_API_URL || '';
            const API_URL = RAW_API_URL.endsWith('/api') ? RAW_API_URL.slice(0, -4) : RAW_API_URL;
            const res = await axios.get(`${API_URL}/api/products`);
            if (res.data.success) {
                setAllProducts(res.data.products);
            }
        } catch (error) {
            console.error("Error cargando productos:", error);
        } finally {
            setLoadingProducts(false);
        }
    };

    // =============================================
    // PRODUCT ACTIONS
    // =============================================
    const updateQuantity = (index, delta) => {
        setProducts(prev => {
            const updated = [...prev];
            const newQty = updated[index].quantity + delta;
            if (newQty < 1) return prev;
            updated[index] = { ...updated[index], quantity: newQty };
            return updated;
        });
    };

    const removeProduct = (index) => {
        setProducts(prev => prev.filter((_, i) => i !== index));
    };

    // SWAP: Open modal with same-category products
    const openSwapModal = (index) => {
        const product = products[index];
        setSwapIndex(index);
        setFilterCategory(product.category || '');
        setModalMode('swap');
        setSearchTerm('');
        setShowModal(true);
        fetchAllProducts();
    };

    // ADD: Open modal with all products
    const openAddModal = () => {
        setSwapIndex(null);
        setFilterCategory('');
        setModalMode('add');
        setSearchTerm('');
        setShowModal(true);
        fetchAllProducts();
    };

    // Select product from modal
    const handleSelectProduct = (product) => {
        if (modalMode === 'swap' && swapIndex !== null) {
            // Replace the product at swapIndex, keep same quantity
            setProducts(prev => {
                const updated = [...prev];
                updated[swapIndex] = { ...product, quantity: updated[swapIndex].quantity };
                return updated;
            });
        } else if (modalMode === 'add') {
            // Check if product already exists in cart
            const existingIndex = products.findIndex(p => p.id === product.id);
            if (existingIndex >= 0) {
                // Increase quantity
                setProducts(prev => {
                    const updated = [...prev];
                    updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + 1 };
                    return updated;
                });
            } else {
                // Add new product
                setProducts(prev => [...prev, { ...product, quantity: 1 }]);
            }
        }
        setShowModal(false);
    };

    // =============================================
    // CALCULATIONS
    // =============================================
    const calculateSubtotal = () => {
        return products.reduce((sum, p) => sum + (parseFloat(p.price) * p.quantity), 0);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const handleConfirm = () => {
        if (products.length === 0) return;
        onConfirm(products);
    };

    // =============================================
    // MODAL: Filtered products
    // =============================================
    const getModalProducts = () => {
        let filtered = allProducts;

        // Filter by category (for swap mode)
        if (filterCategory) {
            filtered = filtered.filter(p =>
                (p.category || '').toLowerCase() === filterCategory.toLowerCase()
            );
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.description || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return filtered;
    };

    // Get unique categories from all products
    const getCategories = () => {
        const cats = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
        return cats;
    };

    // =============================================
    // RENDER HELPERS
    // =============================================
    const renderImage = (img, size = 'md') => {
        const isUrl = img && (img.startsWith('http') || img.startsWith('/'));
        const sizeClasses = size === 'sm' ? 'w-10 h-10' : 'w-12 h-12 md:w-14 md:h-14';
        return (
            <div className={`${sizeClasses} rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-100`}>
                {isUrl ? (
                    <img src={img} alt="Product" className="w-full h-full object-contain rounded-lg p-1" />
                ) : (
                    <span className={size === 'sm' ? 'text-xl' : 'text-2xl'}>{img || '📦'}</span>
                )}
            </div>
        );
    };

    return (
        <div className="p-4 md:p-6 animate-fade-in-up max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                    <FaShoppingCart /> Resumen de tu selección
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800">
                    {clientName ? `${clientName}, revisa tu cotización` : 'Revisa tu cotización'}
                </h2>
                <p className="text-gray-500 mt-2 text-sm md:text-base">
                    Verifica los productos y cantidades. Puedes modificar antes de continuar.
                </p>
            </div>

            {/* Products List */}
            {products.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-6xl mb-4">🛒</div>
                    <h3 className="text-xl font-bold text-gray-600 mb-2">Tu carrito está vacío</h3>
                    <p className="text-gray-400 mb-6">Vuelve al catálogo para agregar productos</p>
                    <button
                        onClick={onGoBackToCatalog}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                    >
                        <FaArrowLeft /> Ir al Catálogo
                    </button>
                </div>
            ) : (
                <>
                    {/* Quotation Card */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        {/* Quotation Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-white font-bold text-lg">Cotización Discovery Systems</h3>
                                <p className="text-blue-200 text-sm">
                                    {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <div className="text-white text-3xl">🚀</div>
                        </div>

                        {/* Products Table */}
                        <div className="divide-y divide-gray-100">
                            {products.map((product, index) => (
                                <div key={`${product.id}-${index}`} className="flex items-center gap-3 md:gap-4 px-4 md:px-6 py-4 hover:bg-gray-50 transition-colors group">
                                    {/* Image */}
                                    {renderImage(product.image_url)}

                                    {/* Info */}
                                    <div className="flex-grow min-w-0">
                                        <h4 className="font-semibold text-gray-800 text-sm md:text-base truncate">
                                            {product.name}
                                        </h4>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider">
                                            {product.category}
                                        </p>
                                        {/* Swap Button */}
                                        <button
                                            onClick={() => openSwapModal(index)}
                                            className="mt-1 text-[11px] text-blue-500 hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors"
                                        >
                                            <FaExchangeAlt className="text-[9px]" /> Cambiar
                                        </button>
                                    </div>

                                    {/* Unit Price (Desktop) */}
                                    <div className="hidden md:block text-right min-w-[100px]">
                                        <p className="text-sm text-gray-500">Unitario</p>
                                        <p className="font-semibold text-gray-700">
                                            {formatCurrency(parseFloat(product.price))}
                                        </p>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className="flex items-center bg-gray-100 rounded-lg p-1 flex-shrink-0">
                                        <button
                                            onClick={() => product.quantity === 1 ? removeProduct(index) : updateQuantity(index, -1)}
                                            className="w-7 h-7 flex items-center justify-center bg-white text-gray-600 rounded shadow-sm hover:bg-red-50 hover:text-red-500 transition-colors"
                                        >
                                            {product.quantity === 1 ? <FaTrash className="text-[9px]" /> : <FaMinus className="text-[9px]" />}
                                        </button>
                                        <span className="font-bold text-gray-800 text-sm mx-2 min-w-[18px] text-center">
                                            {product.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(index, 1)}
                                            className="w-7 h-7 flex items-center justify-center bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 transition-colors"
                                        >
                                            <FaPlus className="text-[9px]" />
                                        </button>
                                    </div>

                                    {/* Subtotal */}
                                    <div className="text-right min-w-[90px] md:min-w-[110px]">
                                        <p className="font-bold text-gray-800 text-sm md:text-base">
                                            {formatCurrency(parseFloat(product.price) * product.quantity)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Product Button - Inside Card */}
                        <div className="px-6 py-3 border-t border-dashed border-gray-200">
                            <button
                                onClick={openAddModal}
                                className="w-full py-3 border-2 border-dashed border-blue-200 rounded-xl text-blue-500 hover:text-blue-700 hover:border-blue-400 hover:bg-blue-50 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                            >
                                <FaPlus className="text-xs" /> Agregar otro producto
                            </button>
                        </div>

                        {/* Totals Footer */}
                        <div className="bg-gray-50 px-6 py-5 border-t-2 border-blue-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-500 font-medium">Subtotal ({products.length} producto{products.length !== 1 ? 's' : ''})</span>
                                <span className="text-lg font-bold text-gray-800">{formatCurrency(calculateSubtotal())}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400 text-sm flex items-center gap-1">
                                    <FaGift className="text-yellow-500" /> Premio pendiente por aplicar
                                </span>
                                <span className="text-sm font-semibold text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
                                    🎰 Gira la ruleta
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 space-y-3">
                        {/* Main CTA - Go to Roulette */}
                        <button
                            onClick={handleConfirm}
                            className="w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white text-lg md:text-xl font-bold py-4 md:py-5 px-6 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-[0.98] flex items-center justify-center gap-3 relative overflow-hidden group"
                        >
                            <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></span>
                            <FaGift className="text-2xl animate-bounce" />
                            <span>¡Aplicar Premio! — Gira la Ruleta</span>
                            <span className="text-2xl">🎰</span>
                        </button>

                        {/* Secondary - Go back to catalog */}
                        <button
                            onClick={onGoBackToCatalog}
                            className="w-full bg-white text-gray-600 border-2 border-gray-200 py-3 px-6 rounded-xl font-semibold hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
                        >
                            <FaArrowLeft /> Volver al catálogo
                        </button>
                    </div>

                    {/* Trust Badges */}
                    <div className="mt-6 flex items-center justify-center gap-6 text-gray-400 text-xs">
                        <span className="flex items-center gap-1">🔒 Datos seguros</span>
                        <span className="flex items-center gap-1">📋 Sin compromiso</span>
                        <span className="flex items-center gap-1">⚡ Precio final</span>
                    </div>
                </>
            )}

            {/* =============================================
                MODAL: Swap / Add Product
               ============================================= */}
            {showModal && (
                <div
                    className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                    onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
                >
                    <div className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
                            <div>
                                <h3 className="text-white font-bold text-lg">
                                    {modalMode === 'swap' ? '🔄 Cambiar producto' : '➕ Agregar producto'}
                                </h3>
                                <p className="text-blue-200 text-sm">
                                    {modalMode === 'swap'
                                        ? `Categoría: ${filterCategory}`
                                        : 'Selecciona un producto del catálogo'
                                    }
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                            >
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar producto..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition-all"
                                    autoFocus
                                />
                            </div>

                            {/* Category Tabs (only in Add mode) */}
                            {modalMode === 'add' && allProducts.length > 0 && (
                                <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
                                    <button
                                        onClick={() => setFilterCategory('')}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${filterCategory === ''
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        Todos
                                    </button>
                                    {getCategories().map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setFilterCategory(cat)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${filterCategory === cat
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product List */}
                        <div className="flex-1 overflow-y-auto">
                            {loadingProducts ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-3"></div>
                                    <p className="text-gray-400 text-sm">Cargando productos...</p>
                                </div>
                            ) : getModalProducts().length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-4xl mb-3">🔍</div>
                                    <p className="text-gray-500 font-medium">No se encontraron productos</p>
                                    <p className="text-gray-400 text-sm mt-1">Intenta con otro término de búsqueda</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {getModalProducts().map(product => {
                                        const isInCart = products.some(p => p.id === product.id);
                                        const isCurrentSwap = modalMode === 'swap' && swapIndex !== null && products[swapIndex]?.id === product.id;

                                        return (
                                            <button
                                                key={product.id}
                                                onClick={() => !isCurrentSwap && handleSelectProduct(product)}
                                                disabled={isCurrentSwap}
                                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${isCurrentSwap
                                                        ? 'bg-blue-50 opacity-60 cursor-not-allowed'
                                                        : 'hover:bg-blue-50 active:bg-blue-100 cursor-pointer'
                                                    }`}
                                            >
                                                {renderImage(product.image_url, 'sm')}

                                                <div className="flex-grow min-w-0">
                                                    <h4 className="font-medium text-gray-800 text-sm truncate">
                                                        {product.name}
                                                    </h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                                                            {product.category}
                                                        </span>
                                                        {isInCart && !isCurrentSwap && (
                                                            <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-semibold">
                                                                En carrito
                                                            </span>
                                                        )}
                                                        {isCurrentSwap && (
                                                            <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">
                                                                Producto actual
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="text-right flex-shrink-0">
                                                    <p className="font-bold text-gray-800 text-sm">
                                                        {formatCurrency(parseFloat(product.price))}
                                                    </p>
                                                </div>

                                                {!isCurrentSwap && (
                                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                                        {modalMode === 'swap' ? <FaExchangeAlt className="text-xs" /> : <FaPlus className="text-xs" />}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-full py-2.5 bg-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-300 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Animation Styles */}
            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default QuotePreview;
