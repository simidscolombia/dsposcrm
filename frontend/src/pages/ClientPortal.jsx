import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaCheckCircle, FaPaperclip, FaPaperPlane, FaRobot, FaPlay,
    FaCalendarAlt, FaFileAlt, FaCheck, FaBuilding, FaHandshake,
    FaArrowRight, FaGift, FaUserCircle, FaWhatsapp, FaTimes, FaDownload, FaEye
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const ClientPortal = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);

    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [advisorName, setAdvisorName] = useState('Daniel');
    const [showFullProposal, setShowFullProposal] = useState(false);

    // Chat states
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Business flow states
    const [progress, setProgress] = useState(20);
    const [flowState, setFlowState] = useState('greet'); // 'greet' -> 'shipping' -> 'payment' -> 'completed'
    const [quickReplies, setQuickReplies] = useState([]);

    const [collectedData, setCollectedData] = useState({
        city: '', address: '', paymentMethod: '', rutFileUploaded: false
    });

    useEffect(() => {
        fetchQuote();
    }, [id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping, quickReplies]);

    const fetchQuote = async () => {
        try {
            const res = await axios.get(`${API_URL}/quotes/${id}`);
            if (res.data?.success) {
                const q = { ...res.data.quote, items: res.data.items || [] };
                setQuote(q);

                // Initialize advisor
                let adv = 'Daniel';
                const cityParam = (q.client_city || 'colombia').toLowerCase().replace(/\s+/g, '-');
                const waRes = await axios.get(`${API_URL}/config/whatsapp/${cityParam}`).catch(() => null);
                if (waRes?.data?.success && waRes.data.number?.advisor) {
                    adv = waRes.data.number.advisor;
                }
                setAdvisorName(adv);

                setLoading(false);
                setIsTyping(true);

                // Greeting
                setTimeout(() => {
                    setMessages([{
                        id: 1, sender: 'bot',
                        text: `¡Hola ${q.client_name}! 👋 Soy ${adv}, Asesor Personal en Discovery Systems. Veo que cotizaste un sistema con nosotros y tu propuesta está lista. ¿Qué te gustaría hacer ahora?`,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }]);

                    // Quote Summary Widget
                    setTimeout(() => {
                        const allItems = res.data.items || q.items || [];
                        console.log("Rendering items on summary:", allItems);
                        setMessages(prev => [...prev, {
                            id: 2, sender: 'app', type: 'quote_summary',
                            data: {
                                total: q.final_amount,
                                items: allItems
                            }
                        }]);
                        setIsTyping(false);
                        setQuickReplies([
                            { label: 'Empezar mi pedido 🚀', action: 'start_order', primary: true },
                            { label: 'Ver Mi Propuesta Formal 📋', action: 'view_proposal' },
                            { label: 'Tengo preguntas 🤔', action: 'ask_questions' }
                        ]);
                    }, 1200);
                }, 1000);
            } else {
                setError('Cotización no encontrada');
                setLoading(false);
            }
        } catch (err) {
            setError('Error al cargar la cotización.');
            setLoading(false);
        }
    };

    const handleQuickReply = async (reply) => {
        if (reply.action === 'view_proposal') {
            setShowFullProposal(true);
            return;
        }

        setQuickReplies([]);
        setMessages(prev => [...prev, {
            id: Date.now(), sender: 'user', text: reply.label,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setIsTyping(true);

        if (reply.action === 'start_order') {
            const msg1 = '¡Excelente decisión! 🎉 Vamos a preparar todo para tu envío.';
            await new Promise(r => setTimeout(r, 1500));
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: msg1, time: 'Ahora' }]);

            const msg2 = '¿A qué Ciudad y Dirección enviamos el equipo? (Ej: Medellín, Cra 43 # 10-20)';
            await new Promise(r => setTimeout(r, 1000));
            setMessages(prev => [...prev, { id: Date.now() + 2, sender: 'bot', text: msg2, time: 'Ahora' }]);
            setFlowState('shipping');
            setProgress(40);
        }

        if (reply.action === 'ask_questions') {
            const msg = '¡Claro! Pregúntame lo que necesites y yo revisaré el inventario por ti.';
            await new Promise(r => setTimeout(r, 1000));
            setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', text: msg, time: 'Ahora' }]);
            setFlowState('questions');
        }

        setIsTyping(false);
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        const text = inputValue.trim();
        if (!text) return;

        setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text, time: 'Ahora' }]);
        setInputValue('');
        setIsTyping(true);

        if (flowState === 'questions' || flowState === 'greet') {
            const aiRes = await axios.post(`${API_URL}/ai/chatbot`, {
                question: text, context: { total: quote?.final_amount, items: quote?.items }
            }).catch(() => ({ data: { answer: 'Claro, déjame revisar eso con el equipo técnico...' } }));

            await new Promise(r => setTimeout(r, 1000));
            setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', text: aiRes.data.answer, time: 'Ahora' }]);
            if (flowState !== 'questions') setQuickReplies([{ label: 'Empezar pedido 🚀', action: 'start_order', primary: true }]);
        }

        setIsTyping(false);
    };

    const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0);

    // ============================================
    // DOCUMENT RENDERER (PREMIUM PAPER)
    // ============================================
    const renderPremiumDocument = () => (
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto relative animate-scale-in">
            {/* Modal Close */}
            <button
                onClick={() => setShowFullProposal(false)}
                className="absolute top-6 right-6 w-10 h-10 bg-[#1c242e]/10 text-[#1c242e] rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all z-20"
            >
                <FaTimes />
            </button>
            <div className="bg-[#1c242e] p-8 md:p-10 flex flex-col md:flex-row justify-between items-center gap-6 border-b-4 border-blue-600">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center p-3 backdrop-blur-md">
                        <img src="/logo.png" alt="Discovery" className="w-full h-full object-contain" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-white font-black text-xl tracking-tight uppercase">Discovery Systems</h3>
                        <p className="text-blue-300 text-[10px] font-black tracking-[0.2em] uppercase opacity-80">Software & Hardware POS</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest mb-1">Cotización Oficial</p>
                    <p className="text-white font-mono text-lg">#DS-{String(id).padStart(4, '0')}</p>
                </div>
            </div>

            {/* Info Section */}
            <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-10 bg-white">
                <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Preparado para:</span>
                    <p className="text-2xl font-black text-gray-900 leading-tight">{quote?.client_name}</p>
                    <p className="text-gray-500 font-medium">{quote?.client_phone}</p>
                </div>
                <div className="md:text-right">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Fecha de Emisión:</span>
                    <p className="font-bold text-gray-800">{new Date(quote?.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    <span className="inline-flex items-center gap-2 text-green-600 font-black text-[10px] bg-green-50 px-3 py-1 rounded-full border border-green-100 mt-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Documento Verificado
                    </span>
                </div>
            </div>

            {/* Items Table */}
            <div className="px-8 md:px-12">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-left border-b-2 border-gray-100">
                            <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descripción</th>
                            <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Cant.</th>
                            <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Precio</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {quote?.items?.map((item, idx) => (
                            <tr key={idx} className="group">
                                <td className="py-5">
                                    <h4 className="font-bold text-gray-800 text-sm">{item.product_name || item.name}</h4>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{item.product_category || 'General'}</p>
                                </td>
                                <td className="py-5 text-center font-black text-gray-600">x{item.quantity}</td>
                                <td className="py-5 text-right font-black text-gray-900">{formatCurrency(item.subtotal)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="p-8 md:p-12 bg-gray-50/50 flex flex-col md:flex-row justify-between items-end gap-10 mt-6 border-t border-gray-100">
                <div className="flex-1">
                    <div className="bg-blue-600 text-white p-6 rounded-3xl shadow-xl flex items-center gap-5 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl"><FaGift /></div>
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-80">Beneficio Aplicado</h4>
                            <p className="text-lg font-black">{quote?.prize_label}</p>
                            {quote?.discount_amount > 0 && <p className="text-white/70 text-xs">- {formatCurrency(quote.discount_amount)} de descuento</p>}
                        </div>
                    </div>
                </div>
                <div className="w-full md:w-[320px] bg-white p-8 rounded-[2rem] shadow-2xl shadow-blue-900/10 border border-blue-50 text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Monto de Inversión</p>
                    <p className="text-4xl font-black text-blue-600">{formatCurrency(quote?.final_amount)}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-2">IVA Incluido / Colombia</p>
                </div>
            </div>

            {/* Footer */}
            <div className="px-12 py-6 border-t border-gray-100 flex justify-between items-center bg-white text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                <span>Discovery Systems POS © 2026</span>
                <span>Documento Impreso Digitalmente</span>
            </div>
        </div >
    );

    if (loading && !quote) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
    if (error) return <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6 text-center"><div className="bg-white p-10 rounded-3xl shadow-xl"><FaTimes className="text-red-500 text-5xl mx-auto mb-4" /><h2 className="text-2xl font-bold">{error}</h2></div></div>;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col font-sans h-screen overflow-hidden relative">

            {/* Header */}
            <header className="bg-[#1c242e] border-b border-gray-800 shadow-md z-10 sticky top-0">
                <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Discovery" className="w-10 h-10 object-contain" />
                        <div>
                            <h1 className="text-white font-bold text-base leading-none">{advisorName}</h1>
                            <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse"></span> Asesor Discovery
                            </p>
                        </div>
                    </div>
                </div>
                {/* Slim Progress */}
                <div className="w-full h-1 bg-black/20">
                    <div className="h-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)] transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                </div>
            </header>

            {/* Messages */}
            <main className="flex-1 w-full max-w-4xl mx-auto p-4 overflow-y-auto bg-gray-100 pb-20 custom-scrollbar">
                <div className="space-y-6">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                            {msg.sender === 'bot' && (
                                <div className="flex gap-3 max-w-[85%]">
                                    <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-xl mt-auto border border-gray-100">🤖</div>
                                    <div className="bg-white border border-gray-100 rounded-3xl rounded-bl-none p-4 shadow-sm relative">
                                        <p className="text-sm text-gray-800 leading-relaxed">{msg.text}</p>
                                        <span className="text-[8px] text-gray-300 uppercase font-black absolute -top-4 left-2">{msg.time}</span>
                                    </div>
                                </div>
                            )}

                            {msg.sender === 'app' && msg.type === 'quote_summary' && (
                                <div className="w-full sm:max-w-[80%] ml-14 group">
                                    <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] transition-all transform hover:-translate-y-1">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <FaFileAlt className="text-blue-500" /> Tu Propuesta Discovery
                                            </h4>
                                            <span className="text-[9px] bg-blue-50 text-blue-500 px-2 py-1 rounded-full font-black">Ref #{id}</span>
                                        </div>

                                        <div className="space-y-3 mb-6">
                                            {(msg.data.items || []).length === 0 ? (
                                                <p className="text-xs text-gray-400 italic">Cargando detalles del inventario...</p>
                                            ) : (msg.data.items || []).slice(0, 4).map((it, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-gray-50 last:border-0 hover:bg-blue-50/50 transition-colors">
                                                    <span className="truncate pr-4 font-medium text-gray-700">
                                                        📦 {it.product_name || it.name || it.description || 'Artículo'}
                                                    </span>
                                                    <span className="font-extrabold text-blue-600 whitespace-nowrap">x{it.quantity || 1}</span>
                                                </div>
                                            ))}
                                            {(msg.data.items || []).length > 4 && (
                                                <p className="text-[10px] text-gray-400 font-bold italic mt-2">+ {(msg.data.items || []).length - 4} elementos adicionales en el documento oficial</p>
                                            )}
                                        </div>
                                        <div className="flex flex-col sm:flex-row justify-between items-center pt-5 border-t border-gray-100 gap-4 mt-2">
                                            <div className="text-left w-full sm:w-auto">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Total Inversión</p>
                                                <p className="text-2xl font-black text-blue-800">{formatCurrency(msg.data.total)}</p>
                                            </div>
                                            <button
                                                onClick={() => setShowFullProposal(true)}
                                                className="w-full sm:w-auto px-6 py-4 bg-[#1c242e] text-[#A8E0F0] font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-gray-200 hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-95 group"
                                            >
                                                Ver Detalle Pro <FaEye className="group-hover:scale-125 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {msg.sender === 'user' && (
                                <div className="max-w-[85%]">
                                    <div className="bg-blue-600 text-white rounded-3xl rounded-br-none p-4 shadow-xl shadow-blue-100">
                                        <p className="text-sm font-bold leading-relaxed">{msg.text}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {isTyping && <div className="flex gap-2 ml-14"><div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce delay-100"></div><div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce delay-200"></div></div>}
                    <div ref={messagesEndRef}></div>
                </div>
            </main>

            {/* Input Footer */}
            <footer className="bg-white border-t border-gray-100 p-4 sticky bottom-0 z-20">
                <div className="max-w-4xl mx-auto">
                    {quickReplies.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                            {quickReplies.map((r, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleQuickReply(r)}
                                    className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest ${r.primary ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex gap-3 bg-gray-50 p-2 rounded-[2rem] border border-gray-200 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 transition-all">
                        <input
                            className="flex-1 bg-transparent px-6 py-3 outline-none font-bold text-gray-900 placeholder-gray-400"
                            placeholder="Escribe tu duda o responde aquí..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                        <button className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"><FaPaperPlane /></button>
                    </form>
                </div>
            </footer>

            {/* FULL PROPOSAL MODAL */}
            {showFullProposal && (
                <div className="fixed inset-0 z-[100] bg-[#1c242e]/80 backdrop-blur-lg flex items-center justify-center p-4">
                    {renderPremiumDocument()}
                </div>
            )}
        </div>
    );
};

export default ClientPortal;
