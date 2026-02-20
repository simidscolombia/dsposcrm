import React, { useState } from 'react';
import { FaPlus, FaMinus, FaTrash, FaArrowLeft, FaGift, FaShoppingCart, FaEdit } from 'react-icons/fa';

const QuotePreview = ({ selectedProducts, onConfirm, onGoBackToCatalog, clientName }) => {
    const [products, setProducts] = useState(selectedProducts || []);

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

    const renderImage = (img) => {
        const isUrl = img && (img.startsWith('http') || img.startsWith('/'));
        return (
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-100">
                {isUrl ? (
                    <img src={img} alt="Product" className="w-full h-full object-contain rounded-lg p-1" />
                ) : (
                    <span className="text-2xl">{img || '📦'}</span>
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
                                <div key={product.id || index} className="flex items-center gap-3 md:gap-4 px-4 md:px-6 py-4 hover:bg-gray-50 transition-colors group">
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
                                        <p className="text-sm font-medium text-gray-600 md:hidden">
                                            {formatCurrency(parseFloat(product.price))} c/u
                                        </p>
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
                                            onClick={() => updateQuantity(index, -1)}
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

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => removeProduct(index)}
                                        className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 hidden md:block"
                                        title="Eliminar"
                                    >
                                        <FaTrash className="text-xs" />
                                    </button>
                                </div>
                            ))}
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
                            <FaEdit /> Agregar más productos
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
        </div>
    );
};

export default QuotePreview;
