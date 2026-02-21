import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaShoppingCart, FaPlus, FaMinus, FaTrash, FaCheck, FaSpinner } from 'react-icons/fa';

const ProductCatalog = ({ onContinue, systemType }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState({});
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

    // Configuración de API URL
    const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4050';
    const API_URL = RAW_API_URL.endsWith('/api') ? RAW_API_URL.slice(0, -4) : RAW_API_URL;

    // Cargar productos desde el Backend
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/products`);
                if (res.data.success) {
                    setProducts(res.data.products);
                }
            } catch (error) {
                console.error("Error cargando productos:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Inicializar carrito según selección previa (solo cuando products ya cargó)
    useEffect(() => {
        if (!loading && products.length > 0 && systemType === 'Combo') {
            const newCart = {};

            // Función helper para buscar productos por nombre parcial
            const addByName = (nameFrag) => {
                const p = products.find(prod => prod.name.toLowerCase().includes(nameFrag.toLowerCase()));
                if (p) newCart[p.id] = 1;
            };

            // Pre-selección para Combo Completo
            addByName('Computador');
            addByName('Impresora Térmica');
            addByName('Cajón');
            addByName('Lector Código de Barras 1D');
            addByName('Licencia Software POS');

            setCart(newCart);
        }
    }, [loading, products, systemType]);

    const addToCart = (product) => {
        setCart(prev => ({
            ...prev,
            [product.id]: (prev[product.id] || 0) + 1
        }));
    };

    const removeFromCart = (product) => {
        setCart(prev => {
            const newCart = { ...prev };
            if (newCart[product.id] > 1) {
                newCart[product.id]--;
            } else {
                delete newCart[product.id];
            }
            return newCart;
        });
    };

    const calculateTotal = () => {
        return Object.entries(cart).reduce((total, [id, qty]) => {
            const product = products.find(p => p.id === parseInt(id));
            return total + (product ? parseFloat(product.price) * qty : 0);
        }, 0);
    };

    const handleNext = () => {
        const selectedItems = Object.entries(cart).map(([id, qty]) => {
            const product = products.find(p => p.id === parseInt(id));
            return { ...product, quantity: qty };
        });
        onContinue(selectedItems);
    };

    // Filtrar productos según el tipo de sistema
    const filteredProducts = products.filter(p => {
        if (systemType === 'Software') return p.category === 'Software';
        return true;
    });

    // Título dinámico
    const getTitle = () => {
        if (systemType === 'Software') return 'Elige tu Plan de Software';
        if (systemType === 'Combo') return 'Personaliza tu Combo Ideal';
        return 'Arma tu Kit a Medida';
    };

    // Renderizado de Imagen Seguro (Emoji o URL)
    const renderImage = (img, isList = false) => {
        const isUrl = img && (img.startsWith('http') || img.startsWith('/'));
        const sizeClass = isList ? 'text-4xl' : 'text-6xl';

        return (
            <div className={`w-full h-full flex items-center justify-center bg-gray-50 ${!isUrl && sizeClass}`}>
                {isUrl ? (
                    <img src={img} alt="Product" className="w-full h-full object-contain p-2" />
                ) : (
                    img || '📦'
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 animate-pulse">
                <FaSpinner className="animate-spin text-4xl text-blue-600 mb-4" />
                <p className="text-gray-500 font-medium">Cargando catálogo...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 animate-fade-in-up pb-40">
            <div className="flex justify-between items-center mb-4 md:mb-6">
                <h2 className="text-xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 truncate mr-2">
                    {getTitle()}
                </h2>

                {/* Selector de Vista */}
                <div className="flex bg-gray-100 p-1 rounded-lg flex-shrink-0">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}
                        aria-label="Vista Cuadrícula"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-400'}`}
                        aria-label="Vista Lista"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>

            <p className="text-gray-500 mb-6 text-sm md:text-base hidden md:block">
                {systemType === 'Combo'
                    ? 'Hemos pre-seleccionado lo mejor para ti. Puedes cambiar componentes o agregar extras.'
                    : 'Selecciona los elementos que necesitas para potenciar tu negocio.'}
            </p>
            <div className="md:hidden text-center mb-4">
                <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-bold">v4.5 - NUEVO ESTILO 🛍️</span>
            </div>

            {filteredProducts.length === 0 ? (
                <div className="text-center text-gray-400 py-10">
                    <p>No se encontraron productos en esta categoría.</p>
                </div>
            ) : (
                <div className={`grid ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6' : 'grid-cols-1 gap-3'}`}>
                    {filteredProducts.map(product => {
                        const qty = cart[product.id] || 0;
                        const isSelected = qty > 0;

                        return (
                            <div
                                key={product.id}
                                className={`bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all relative flex ${viewMode === 'grid' ? 'flex-col' : 'flex-row items-center p-2'} ${isSelected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}`}
                            >
                                {/* Badge de Selección */}
                                {isSelected && (
                                    <div className={`absolute bg-blue-100 text-blue-600 p-1 rounded-full z-10 ${viewMode === 'grid' ? 'top-2 right-2' : 'top-1 right-1'}`}>
                                        <FaCheck className="text-[10px]" />
                                    </div>
                                )}

                                {/* IMAGEN (Estilo MercadoLibre / Amazon) */}
                                <div className={`${viewMode === 'grid' ? 'w-full h-28 md:h-36 border-b border-gray-50' : 'w-20 h-20 md:w-24 md:h-24 rounded-lg flex-shrink-0 border border-gray-100 mr-3'}`}>
                                    {renderImage(product.image_url, viewMode === 'list')}
                                </div>

                                {/* CONTENIDO */}
                                <div className={`flex flex-col flex-grow ${viewMode === 'grid' ? 'p-3' : 'py-1'}`}>

                                    <h3 className={`font-medium text-gray-800 leading-tight mb-1 ${viewMode === 'grid' ? 'text-xs md:text-sm line-clamp-2 h-[2.5em]' : 'text-sm md:text-lg'}`}>
                                        {product.name}
                                    </h3>

                                    {viewMode === 'list' && (
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{product.category}</p>
                                    )}

                                    <div className="mt-auto pt-2 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            {viewMode === 'grid' && <p className="text-[9px] text-gray-400 uppercase mb-0.5">{product.category}</p>}
                                            <p className="text-gray-900 font-bold text-sm md:text-base">
                                                ${parseFloat(product.price).toLocaleString('es-CO')}
                                            </p>
                                        </div>

                                        {/* CONTROLES */}
                                        {qty === 0 ? (
                                            <button
                                                onClick={() => addToCart(product)}
                                                className={`bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors flex items-center justify-center ${viewMode === 'grid' ? 'w-8 h-8 rounded-full' : 'px-4 py-2 text-sm font-semibold'}`}
                                            >
                                                <FaPlus className={viewMode === 'grid' ? 'text-xs' : 'mr-1 text-xs'} />
                                                {viewMode === 'list' && 'Agregar'}
                                            </button>
                                        ) : (
                                            <div className="flex items-center bg-blue-50 rounded-lg p-1">
                                                <button onClick={() => removeFromCart(product)} className="w-6 h-6 flex items-center justify-center bg-white text-blue-600 rounded shadow-sm">
                                                    {qty === 1 ? <FaTrash className="text-[8px]" /> : <FaMinus className="text-[8px]" />}
                                                </button>
                                                <span className="font-bold text-blue-800 text-xs mx-2 min-w-[10px] text-center">{qty}</span>
                                                <button onClick={() => addToCart(product)} className="w-6 h-6 flex items-center justify-center bg-blue-600 text-white rounded shadow-sm">
                                                    <FaPlus className="text-[8px]" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Footer Flotante con Total */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-40 safe-area-bottom">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <div className="text-[10px] md:text-xs text-gray-400 font-medium tracking-wider uppercase">Total Estimado</div>
                        <div className="text-xl md:text-2xl font-black text-gray-800">${calculateTotal().toLocaleString('es-CO')}</div>
                        {Object.keys(cart).length > 0 && <span className="text-[10px] md:text-xs text-blue-500 font-medium">{Object.keys(cart).length} item(s)</span>}
                    </div>
                    <button
                        onClick={handleNext}
                        disabled={calculateTotal() === 0}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 md:px-8 rounded-xl font-bold hover:shadow-lg hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 md:gap-3 text-sm md:text-base"
                    >
                        <FaShoppingCart />
                        <span className="hidden md:inline">Continuar</span>
                        <span className="md:hidden">Seguir</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCatalog;
