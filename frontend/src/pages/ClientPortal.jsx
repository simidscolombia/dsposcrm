import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaCheckCircle, FaTruck, FaFileContract, FaCreditCard, FaLock, FaWhatsapp, FaArrowRight, FaBoxOpen } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const ClientPortal = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Tab state: 'resume', 'shipping', 'payment', 'success'
    const [currentStep, setCurrentStep] = useState('resume');

    // Form state
    const [shippingData, setShippingData] = useState({
        address: '',
        city: '',
        notes: ''
    });

    const [paymentMethod, setPaymentMethod] = useState(''); // 'transferencia' o 'contra_entrega'

    useEffect(() => {
        fetchQuote();
    }, [id]);

    const fetchQuote = async () => {
        try {
            // we will create an endpoint: GET /api/quotes/:id
            const res = await axios.get(`${API_URL}/quotes/${id}`);
            if (res.data?.success) {
                setQuote(res.data.quote);
            } else {
                setError('Cotización no encontrada');
            }
        } catch (err) {
            console.error('Error fetching quote:', err);
            setError('Error al cargar la cotización o enlace inválido.');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmStep1 = () => {
        setCurrentStep('shipping');
    };

    const handleConfirmShipping = () => {
        if (!shippingData.address || !shippingData.city) {
            alert('Por favor completa la dirección y ciudad');
            return;
        }
        setCurrentStep('payment');
    };

    const handleConfirmPayment = async () => {
        if (!paymentMethod) {
            alert('Debes seleccionar un método de pago');
            return;
        }

        try {
            setLoading(true);
            // new endpoint logic
            await axios.put(`${API_URL}/quotes/${id}/confirm`, {
                shipping: shippingData,
                paymentMethod: paymentMethod
            });
            setCurrentStep('success');
        } catch (err) {
            alert('Hubo un error al confirmar el pedido');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount || 0);
    };

    if (loading && !quote) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Ups!</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button onClick={() => navigate('/')} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold">Volver al inicio</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-100 p-4 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FaLock className="text-indigo-600" />
                        <h1 className="font-bold text-gray-800">Portal Seguro</h1>
                    </div>
                    <div className="text-xs text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">
                        Tu ID: #{quote?.id?.substring(0, 8)}
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto mt-8 px-4">

                {/* Stepper indicator */}
                {currentStep !== 'success' && (
                    <div className="flex justify-between mb-8 relative">
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 translate-y-[-50%] rounded"></div>

                        <div className={`flex flex-col items-center gap-1 ${currentStep === 'resume' || currentStep === 'shipping' || currentStep === 'payment' ? 'text-indigo-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${currentStep === 'resume' || currentStep === 'shipping' || currentStep === 'payment' ? 'bg-indigo-600' : 'bg-gray-300'}`}>1</div>
                            <span className="text-[10px] font-bold">Resumen</span>
                        </div>

                        <div className={`flex flex-col items-center gap-1 ${currentStep === 'shipping' || currentStep === 'payment' ? 'text-indigo-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${currentStep === 'shipping' || currentStep === 'payment' ? 'bg-indigo-600' : 'bg-gray-300'}`}>2</div>
                            <span className="text-[10px] font-bold">Envío</span>
                        </div>

                        <div className={`flex flex-col items-center gap-1 ${currentStep === 'payment' ? 'text-indigo-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${currentStep === 'payment' ? 'bg-indigo-600' : 'bg-gray-300'}`}>3</div>
                            <span className="text-[10px] font-bold">Pago</span>
                        </div>
                    </div>
                )}

                {/* STEP 1: RESUMEN */}
                {currentStep === 'resume' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Hola, {quote?.client_name}! 👋</h2>
                        <p className="text-gray-600 mb-6">Revisa tu cotización y continuamos para preparar tu pedido.</p>

                        <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><FaBoxOpen className="text-indigo-500" /> Productos Solicitados</h3>
                            <div className="space-y-3">
                                {(quote?.items || []).map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                                        <div>
                                            <p className="font-medium text-gray-800">{item.product_name || item.name}</p>
                                            <p className="text-xs text-gray-500">Cantidad: {item.quantity}</p>
                                        </div>
                                        <div className="font-bold text-gray-800">
                                            {formatCurrency((item.unit_price || item.price) * (item.quantity || 1))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex justify-between items-center mb-1 text-sm text-gray-600">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(quote?.subtotal)}</span>
                                </div>
                                {quote?.discount_amount > 0 && (
                                    <div className="flex justify-between items-center mb-1 text-sm text-green-600 font-medium">
                                        <span>Descuento aplicado 🎉</span>
                                        <span>-{formatCurrency(quote?.discount_amount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-dashed border-gray-300 text-lg font-black text-indigo-900">
                                    <span>Total a pagar</span>
                                    <span>{formatCurrency(quote?.final_total)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button onClick={() => window.location.href = '/'} className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition">Modificar Pedido</button>
                            <button onClick={handleConfirmStep1} className="flex-1 py-3 px-4 bg-indigo-600 rounded-xl font-bold text-white hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">Confirmar y Seguir <FaArrowRight /></button>
                        </div>
                    </div>
                )}


                {/* STEP 2: SHIPPING */}
                {currentStep === 'shipping' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2"><FaTruck className="text-indigo-500" /> ¿A dónde enviamos el equipo?</h2>
                        <p className="text-gray-600 mb-6 font-medium">Ingresa los datos para coordinar la logística o la instalación local.</p>

                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Ciudad de Destino *</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Bogotá, Medellín, etc"
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={shippingData.city}
                                    onChange={(e) => setShippingData({ ...shippingData, city: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Dirección Exacta *</label>
                                <input
                                    type="text"
                                    placeholder="Calle, Carrera, Local, Barrio..."
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={shippingData.address}
                                    onChange={(e) => setShippingData({ ...shippingData, address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Notas / Instrucciones adicionales (Opcional)</label>
                                <textarea
                                    placeholder="Detalles del local, horarios de recepción, etc."
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                                    value={shippingData.notes}
                                    onChange={(e) => setShippingData({ ...shippingData, notes: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setCurrentStep('resume')} className="py-3 px-6 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition">Atrás</button>
                            <button onClick={handleConfirmShipping} className="flex-1 py-3 px-4 bg-indigo-600 rounded-xl font-bold text-white hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">Guardar Dirección <FaArrowRight /></button>
                        </div>
                    </div>
                )}


                {/* STEP 3: PAYMENT */}
                {currentStep === 'payment' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2"><FaCreditCard className="text-indigo-500" /> Método de Pago Preferido</h2>
                        <p className="text-gray-600 mb-6 font-medium">No te cobraremos en este momento. Solo dinos cómo prefieres hacer el pago para que el asesor prepare todo.</p>

                        <div className="space-y-4 mb-8">
                            {/* Option 1 */}
                            <label className={`block border-2 rounded-xl p-4 cursor-pointer transition-all ${paymentMethod === 'contra_entrega' ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-indigo-300'}`}>
                                <div className="flex items-start gap-3">
                                    <div className="mt-1">
                                        <input type="radio" name="payment" className="w-5 h-5 accent-indigo-600" checked={paymentMethod === 'contra_entrega'} onChange={() => setPaymentMethod('contra_entrega')} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">Pago Contra Entrega 🚚</h4>
                                        <p className="text-sm text-gray-600 mt-1">Paga el total en efectivo o transferencia cuando recibas tus equipos en la puerta de tu local. (Aplica para ciudades principales).</p>
                                    </div>
                                </div>
                            </label>

                            {/* Option 2 */}
                            <label className={`block border-2 rounded-xl p-4 cursor-pointer transition-all ${paymentMethod === 'transferencia' ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-indigo-300'}`}>
                                <div className="flex items-start gap-3">
                                    <div className="mt-1">
                                        <input type="radio" name="payment" className="w-5 h-5 accent-indigo-600" checked={paymentMethod === 'transferencia'} onChange={() => setPaymentMethod('transferencia')} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">Transferencia Bancaria 🏦</h4>
                                        <p className="text-sm text-gray-600 mt-1">Bancolombia, Nequi, Davivienda. Te enviaremos los datos de depósito al WhatsApp.</p>
                                    </div>
                                </div>
                            </label>

                            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex gap-3 text-sm text-yellow-800 mt-4">
                                <span className="text-lg">📄</span>
                                <p><strong>Nota importante para facturación de equipos:</strong> Podremos solicitar tu Cédula o RUT por WhatsApp para formalizar la factura y las garantías de 12 meses.</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setCurrentStep('shipping')} className="py-3 px-6 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition">Atrás</button>
                            <button
                                onClick={handleConfirmPayment}
                                disabled={loading}
                                className="flex-1 py-3 px-4 bg-green-500 rounded-xl font-bold text-white hover:bg-green-600 transition shadow-lg shadow-green-200 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? 'Procesando...' : <><FaCheckCircle /> Completar Solicitud</>}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 4: SUCCESS */}
                {currentStep === 'success' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center animate-fade-in relative overflow-hidden">
                        <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-green-100 rounded-full blur-3xl opacity-50"></div>
                        <div className="absolute bottom-[-50px] left-[-50px] w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>

                        <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                            <FaCheckCircle />
                        </div>

                        <h2 className="text-3xl font-black text-gray-800 mb-3">¡Pedido Confirmado! 🎉</h2>
                        <p className="text-lg text-gray-600 mb-6">
                            Tu solicitud con ID <strong className="text-indigo-600">#{quote?.id?.substring(0, 8)}</strong> ha sido enviada a logística y despachos.
                        </p>

                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-left mb-8 inline-block max-w-md w-full">
                            <h4 className="font-bold text-gray-800 border-b border-gray-200 pb-2 mb-3">Siguientes Pasos:</h4>
                            <ul className="space-y-3 text-sm text-gray-600">
                                <li className="flex gap-2 items-start"><span className="text-indigo-500 mt-0.5">1.</span> Un especialista se contactará a tu WhatsApp en menos de 10 minutos.</li>
                                <li className="flex gap-2 items-start"><span className="text-indigo-500 mt-0.5">2.</span> Revisaremos los datos de envío y facturación formal contigo.</li>
                                <li className="flex gap-2 items-start"><span className="text-indigo-500 mt-0.5">3.</span> Realizaremos el despacho o programaremos la instalación del software.</li>
                            </ul>
                        </div>

                        <button
                            onClick={() => window.open(`https://wa.me/573205792169?text=Hola,%20acabo%20de%20confirmar%20mi%20pedido%20con%20ID%20${quote?.id?.substring(0, 8)}%20en%20el%20Portal.%20¿Podemos%20coordinar?`, '_blank')}
                            className="bg-green-500 text-white font-bold py-4 px-8 rounded-full text-lg shadow-lg hover:shadow-xl hover:scale-105 transition flex items-center justify-center gap-3 w-full sm:w-auto mx-auto"
                        >
                            <FaWhatsapp className="text-3xl" /> Escribir Ahora al Asesor
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ClientPortal;
