import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaShoppingCart, FaPlus, FaMinus, FaTrash, FaCheck, FaSpinner } from 'react-icons/fa';

const ProductCatalog = ({ onContinue, systemType }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState({});

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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 animate-pulse">
                <FaSpinner className="animate-spin text-4xl text-blue-600 mb-4" />
                <p className="text-gray-500 font-medium">Cargando catálogo...</p>
            </div>
        );
    }

    return (
        <div className="p-6 animate-fade-in-up pb-32">
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2 text-center">
                {getTitle()}
            </h2>
            <p className="text-gray-500 mb-8 text-center max-w-2xl mx-auto">
                {systemType === 'Combo'
                    ? 'Hemos pre-seleccionado lo mejor para ti. Puedes cambiar componentes o agregar extras.'
                    : 'Selecciona los elementos que necesitas para potenciar tu negocio.'}
            </p>

            {filteredProducts.length === 0 ? (
                <div className="text-center text-gray-400 py-10">
                    <p>No se encontraron productos en esta categoría.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map(product => {
                        const qty = cart[product.id] || 0;
                        return (
                            <div key={product.id} className={`bg-white border rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all relative ${qty > 0 ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50' : 'border-gray-100'}`}>
                                {qty > 0 && (
                                    <div className="absolute top-4 right-4 bg-blue-100 text-blue-600 p-1 rounded-full">
                                        <FaCheck className="text-xs" />
                                    </div>
                                )}
                                <div className="text-4xl mb-4 text-center bg-gray-50 rounded-xl py-6 select-none">
                                    {product.image_url || '📦'}
                                </div>

                                <div className="mb-4">
                                    <h3 className="font-bold text-gray-800 mb-1">{product.name}</h3>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">{product.category}</p>
                                    <p className="text-green-600 font-bold text-lg">
                                        ${parseFloat(product.price).toLocaleString('es-CO')}
                                    </p>
                                </div>

                                {qty === 0 ? (
                                    <button
                                        onClick={() => addToCart(product)}
                                        className="w-full py-3 bg-gray-50 text-gray-600 rounded-xl font-semibold hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                    >
                                        <FaPlus className="text-xs" /> Agregar
                                    </button>
                                ) : (
                                    <div className="flex items-center justify-between bg-blue-50 rounded-xl p-2">
                                        <button onClick={() => removeFromCart(product)} className="w-10 h-10 flex items-center justify-center bg-white text-blue-600 rounded-lg shadow-sm hover:bg-red-50 hover:text-red-500 transition">
                                            {qty === 1 ? <FaTrash className="text-xs" /> : <FaMinus className="text-xs" />}
                                        </button>
                                        <span className="font-bold text-blue-800 text-lg">{qty}</span>
                                        <button onClick={() => addToCart(product)} className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition">
                                            <FaPlus className="text-xs" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Footer Flotante con Total */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-40">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <div className="text-xs text-gray-400 font-medium tracking-wider">TOTAL ESTIMADO</div>
                        <div className="text-2xl font-black text-gray-800">${calculateTotal().toLocaleString('es-CO')}</div>
                        {Object.keys(cart).length > 0 && <span className="text-xs text-blue-500 font-medium">{Object.keys(cart).length} items seleccionados</span>}
                    </div>
                    <button
                        onClick={handleNext}
                        disabled={calculateTotal() === 0}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-8 rounded-xl font-bold hover:shadow-lg hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-3"
                    >
                        <FaShoppingCart />
                        Continuar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCatalog;
