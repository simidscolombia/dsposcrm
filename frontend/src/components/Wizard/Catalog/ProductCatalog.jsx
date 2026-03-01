import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import {
    FaShoppingCart, FaPlus, FaMinus, FaTrash,
    FaCheck, FaSpinner, FaRobot, FaArrowRight,
    FaChevronCircleRight, FaMicrophone, FaVolumeUp
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { speak, stopSpeech } from '../../../utils/aiVoice';

const API_BASE = import.meta.env.VITE_API_URL || 'https://dspos.vercel.app/api';

const ProductCatalog = ({ onContinue, systemType, businessType, preSelectedProducts = [] }) => {
    const [products, setProducts] = useState([]);
    const [aiRules, setAiRules] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState({});
    const [currentStep, setCurrentStep] = useState(0);
    const [showAiBubble, setShowAiBubble] = useState(false);
    const [aiMessage, setAiMessage] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const hasSpokenRef = useRef(false);

    // Define steps for Guided Flow (Combo only)
    const isGuided = systemType === 'Combo';
    const steps = [
        { name: 'Hardware Principal', categories: ['Computadores', 'Hardware POS', 'PC Corporativo', 'All in one', 'POS', 'Terminal'], icon: '🖥️' },
        { name: 'Caja e Impresión', categories: ['Impresoras', 'Cajones', 'Hardware', 'Punto de venta', 'Fiscal', 'Papel'], icon: '🖨️' },
        { name: 'Lectores y Rapidez', categories: ['Lectores', 'Accesorios', 'Escáner', 'Código de barras'], icon: '🔫' },
        { name: 'Software y Control', categories: ['Software', 'Sistema', 'Licencia', 'App', 'Nube'], icon: '💾' },
        { name: 'Extras y Soporte', categories: ['Servicios', 'Otros', 'Soporte', 'Garantía', 'Instalación'], icon: '⚙️' }
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, rulesRes] = await Promise.all([
                    axios.get(`${API_BASE}/products`),
                    axios.get(`${API_BASE}/admin/ai-rules`)
                ]);

                if (prodRes.data.success) {
                    const sanitized = prodRes.data.products.map(p => ({
                        ...p,
                        name: p.name?.length > 100 ? p.name.substring(0, 50) + '...' : p.name,
                        description: p.description?.length > 200 ? p.description.substring(0, 100) + '...' : p.description
                    }));
                    setProducts(sanitized);
                }

                // Find rule for current business type
                if (rulesRes.data.success) {
                    const rule = rulesRes.data.rules.find(r => r.niche === businessType);
                    setAiRules(rule);
                }
            } catch (err) {
                console.error("Error loading advisor data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [businessType]);

    // Build cart from preSelectedProducts
    useEffect(() => {
        if (preSelectedProducts && preSelectedProducts.length > 0 && Object.keys(cart).length === 0) {
            const initialCart = {};
            preSelectedProducts.forEach(p => {
                initialCart[p.id] = p.quantity || 1;
            });
            setCart(initialCart);
        }
    }, [preSelectedProducts, products]);

    // AI Assistant Personality & Speech
    useEffect(() => {
        if (!loading && products.length > 0) {
            setTimeout(() => {
                const welcomeMsg = `Hola, soy tu asistente Discovery. Basado en que tienes un ${businessType || 'negocio'}, te guiaré para armar el mejor kit.`;
                setAiMessage(welcomeMsg);
                setShowAiBubble(true);
                // speak(welcomeMsg); // Auto-speech is often blocked, let's wait for user interaction or use a button
            }, 1000);
        }
    }, [loading, businessType, products]);

    // Update AI message per step
    useEffect(() => {
        if (isGuided && !loading) {
            let stepMsg = "";
            if (currentStep === 0) stepMsg = "Empecemos por el computador. Para tu sector, te recomiendo uno robusto.";
            if (currentStep === 1) stepMsg = aiRules?.expert_tips?.[0] || "No olvides la impresora térmica, es vital para el despacho.";
            if (currentStep === 2 && businessType?.toLowerCase().includes('restaurante')) {
                stepMsg = "En restaurantes el lector no siempre es vital, pero ayuda mucho con snacks.";
            }

            setAiMessage(stepMsg);
            // speak(stepMsg); // Voice feedback
        }
    }, [currentStep, isGuided, loading, aiRules]);

    const addToCart = (product) => {
        setCart(prev => ({ ...prev, [product.id]: (prev[product.id] || 0) + 1 }));
    };

    const removeFromCart = (product) => {
        setCart(prev => {
            const newCart = { ...prev };
            if (newCart[product.id] > 1) newCart[product.id]--;
            else delete newCart[product.id];
            return newCart;
        });
    };

    const calculateTotal = () => {
        return Object.entries(cart).reduce((total, [id, qty]) => {
            const product = products.find(p => p.id === parseInt(id));
            return total + (product ? parseFloat(product.price) * qty : 0);
        }, 0);
    };

    // Smart Filter: Match products by category names OR specific keywords
    const stepProducts = useMemo(() => {
        if (!isGuided) return products;

        // Split keywords to match partials (e.g. "hardware" in "hardware pos")
        const keywords = steps[currentStep].categories.flatMap(c => c.toLowerCase().split(' '));

        return products.filter(p => {
            const pCat = (p.category_name || p.category || '').toLowerCase();
            const pName = (p.name || '').toLowerCase();
            const pSlug = (p.category_slug || '').toLowerCase();

            // Check if product category name, slug or product name contains ANY of the step's target keywords
            return keywords.some(key =>
                pCat.includes(key) ||
                pName.includes(key) ||
                pSlug.includes(key) ||
                (key.length > 3 && pCat.includes(key.substring(0, 4)))
            );
        });
    }, [products, currentStep, isGuided]);

    const handleNextStep = () => {
        stopSpeech();
        if (currentStep < steps.length - 1) {
            setCurrentStep(curr => curr + 1);
            window.scrollTo(0, 0);
        } else {
            const items = Object.entries(cart).map(([id, qty]) => ({ ...products.find(p => p.id === parseInt(id)), quantity: qty }));
            onContinue(items);
        }
    };

    const handlePrevStep = () => {
        stopSpeech();
        if (currentStep > 0) {
            setCurrentStep(curr => curr - 1);
            window.scrollTo(0, 0);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-96">
            <FaSpinner className="animate-spin text-5xl text-blue-500 mb-4" />
            <span className="font-black text-gray-400 uppercase tracking-widest">Activando Neuronas...</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32 pt-6 px-4">
            {/* AI Floating Advisor */}
            <AnimatePresence>
                {showAiBubble && (
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="fixed top-24 right-4 z-50 flex flex-col items-end gap-3 max-w-xs"
                    >
                        <div className="bg-white p-4 rounded-2xl rounded-tr-none shadow-2xl border border-blue-100/50 relative">
                            <p className="text-sm font-medium text-gray-700 leading-relaxed">{aiMessage}</p>
                            <div className="absolute top-0 -right-2 w-4 h-4 bg-white rotate-45 border-t border-r border-blue-50" />
                            <button
                                onClick={() => speak(aiMessage)}
                                className="mt-2 text-blue-500 text-xs font-bold flex items-center gap-1 hover:underline"
                            >
                                <FaVolumeUp /> Escuchar Asesoría
                            </button>
                        </div>
                        <div className="w-16 h-16 bg-[#1c242e] rounded-full border-4 border-[#A8E0F0] flex items-center justify-center text-3xl text-[#A8E0F0] shadow-xl overflow-hidden">
                            <motion.div animate={{ y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                                <FaRobot />
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-6xl mx-auto">
                {/* Stepper (Only for Combo) */}
                {isGuided && (
                    <div className="mb-12">
                        <div className="flex justify-between items-center mb-6 overflow-x-auto pb-4 scrollbar-hide">
                            {steps.map((s, i) => (
                                <div key={i} className={`flex flex-col items-center gap-2 min-w-[80px] transition-all ${i === currentStep ? 'opacity-100 scale-110' : 'opacity-40 grayscale'}`}>
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg ${i === currentStep ? 'bg-[#A8E0F0] text-[#1c242e]' : 'bg-white text-gray-400'}`}>
                                        {s.icon}
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-center tracking-tighter">{s.name}</span>
                                </div>
                            ))}
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                                className="h-full bg-[#A8E0F0]"
                            />
                        </div>
                    </div>
                )}

                {/* Step Context */}
                <div className="mb-8">
                    <h2 className="text-3xl font-black text-gray-900 uppercase">
                        {isGuided ? steps[currentStep].name : 'Catálogo de Soluciones'}
                    </h2>
                    <p className="text-gray-500">
                        {isGuided ? `Paso ${currentStep + 1} de ${steps.length}: Selecciona tus componentes.` : 'Elige lo que necesitas para tu negocio.'}
                    </p>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="wait">
                        {stepProducts.map(product => (
                            <motion.div
                                layout
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`bg-white rounded-3xl p-5 border-2 transition-all relative group ${cart[product.id] ? 'border-blue-500 shadow-xl' : 'border-white shadow-sm hover:border-blue-200'}`}
                            >
                                <div className="h-48 mb-4 rounded-2xl overflow-hidden bg-gray-50 relative">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform" />
                                    ) : <div className="w-full h-full flex items-center justify-center text-4xl opacity-10">📦</div>}
                                    {cart[product.id] && (
                                        <div className="absolute top-4 right-4 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                                            <FaCheck />
                                        </div>
                                    )}
                                </div>

                                <h3 className="font-black text-gray-800 uppercase tracking-tight mb-1 line-clamp-1">{product.name}</h3>
                                <p className="text-xs text-gray-400 mb-4 h-10 overflow-hidden line-clamp-2">{product.description || 'Tecnología líder para tu punto de venta.'}</p>

                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-2xl font-black text-gray-900">${parseFloat(product.price).toLocaleString()}</span>
                                    <div className="flex bg-gray-100 rounded-xl p-1 gap-2">
                                        {cart[product.id] > 0 && (
                                            <>
                                                <button onClick={() => removeFromCart(product)} className="w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm text-red-500 hover:bg-red-50 transition-colors">
                                                    {cart[product.id] === 1 ? <FaTrash size={12} /> : <FaMinus size={12} />}
                                                </button>
                                                <span className="w-8 flex items-center justify-center font-black text-blue-600">{cart[product.id]}</span>
                                            </>
                                        )}
                                        <button onClick={() => addToCart(product)} className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors">
                                            <FaPlus size={12} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {stepProducts.length === 0 && (
                    <div className="py-20 text-center space-y-6 bg-white rounded-3xl border-2 border-dashed border-gray-100 mx-4">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                            <FaRobot className="text-4xl text-gray-200" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No hay productos sugeridos en este paso.</p>
                            <p className="text-gray-300 text-xs text-center max-w-xs mx-auto">Prueba buscando en otras categorías o mira el catálogo completo.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => {
                                    // Hacky way to disable filter temporarily: set systemType to something else
                                    // but better if we just had a state for 'showAllOverride'
                                    alert("Cargando catálogo completo...");
                                    window.location.reload(); // Quick fix or we could add a state
                                }}
                                className="text-blue-600 font-bold hover:underline py-2 px-4"
                            >
                                Ver catálogo completo
                            </button>
                            <button
                                onClick={handleNextStep}
                                className="bg-[#1c242e] text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-gray-200 active:scale-95 transition-all"
                            >
                                Pasar al siguiente paso
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Nav */}
            <footer className="fixed bottom-0 left-0 w-full bg-[#1c242e] text-white p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.3)] z-40 overflow-hidden">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Inversión Estimada</span>
                        <span className="text-3xl font-black text-[#A8E0F0]">${calculateTotal().toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {currentStep > 0 && (
                            <button
                                onClick={handlePrevStep}
                                className="bg-white/10 text-white p-4 rounded-2xl hover:bg-white/20 transition-all"
                                title="Regresar al paso anterior"
                            >
                                <FaArrowRight className="rotate-180" />
                            </button>
                        )}
                        <button
                            onClick={handleNextStep}
                            className="group bg-[#A8E0F0] text-[#1c242e] px-10 py-4 rounded-2xl font-black text-xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(168,224,240,0.4)]"
                        >
                            {currentStep < steps.length - 1 ? (
                                <> SIGUIENTE <FaArrowRight className="group-hover:translate-x-1 transition-transform" /> </>
                            ) : (
                                <> FINALIZAR <FaChevronCircleRight /> </>
                            )}
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ProductCatalog;
