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
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showFullProposal, setShowFullProposal] = useState(false);
    const [progress, setProgress] = useState(20);
    const [quickReplies, setQuickReplies] = useState([]);
    const [advisorName, setAdvisorName] = useState('Daniel');
    const [flowState, setFlowState] = useState('greeting');

    useEffect(() => {
        fetchQuoteData();
        // Keyboard listener for ESC
        const handleEsc = (e) => {
            if (e.key === 'Escape') setShowFullProposal(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [id]);

    const fetchQuoteData = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/quotes/${id}`);
            setQuote(res.data);

            // Fetch Advisor Name based on city
            try {
                const cityParam = res.data.client_city || 'Bogotá';
                const advisorRes = await axios.get(`${API_URL}/config/whatsapp/${cityParam}`);
                if (advisorRes.data.success) {
                    setAdvisorName(advisorRes.data.advisor.name);
                }
            } catch (e) { console.log("Using default advisor"); }

            // Initial messages
            const initialMsgs = [
                {
                    id: 1, sender: 'bot', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    text: `¡Hola ${res.data.client_name.split(' ')[0]}! 👋 Soy ${advisorName}, Asesor Personal en Discovery Systems. Veo que cotizaste un sistema con nosotros y tu propuesta está lista. ¿Qué te gustaría hacer ahora?`,
                    type: 'proposal_card',
                    data: {
                        total: res.data.final_amount,
                        items: res.data.items
                    }
                }
            ];
            setMessages(initialMsgs);
            setQuickReplies([
                { label: 'Empezar mi pedido 🚀', action: 'start_order', primary: true },
                { label: 'Ver Video Demo 🎬', action: 'watch_demo' },
                { label: 'Tengo preguntas 🧐', action: 'ask_questions' }
            ]);

        } catch (err) {
            console.error(err);
            setError('No pudimos cargar tu propuesta. Verifica el enlace o contacta a soporte.');
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isTyping]);

    const handleQuickReply = (reply) => {
        const userMsg = { id: Date.now(), sender: 'user', text: reply.label, time: 'Ahora' };
        setMessages(prev => [...prev, userMsg]);
        processBotResponse(reply.action);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        const userMsg = { id: Date.now(), sender: 'user', text: inputValue, time: 'Ahora' };
        setMessages(prev => [...prev, userMsg]);
        const text = inputValue;
        setInputValue('');
        processBotResponse('chat', text);
    };

    const processBotResponse = async (action, text = '') => {
        setIsTyping(true);
        await new Promise(r => setTimeout(r, 1500));

        if (action === 'start_order') {
            setMessages(prev => [...prev, {
                id: Date.now(), sender: 'bot', time: 'Ahora',
                text: '¡Excelente elección! 🚀 Para procesar tu pedido y coordinar el despacho, por favor envíame foto de tu RUT o tus datos de facturación (NIT, Dirección, Correo).'
            }]);
            setQuickReplies([{ label: 'Enviar por WhatsApp 📱', action: 'whatsapp_redirect', primary: true }]);
            setProgress(60);
        } else if (action === 'watch_demo') {
            setMessages(prev => [...prev, {
                id: Date.now(), sender: 'bot', time: 'Ahora',
                text: 'Aquí tienes un resumen rápido de cómo funciona el Sistema POS Discovery. Te va a encantar lo fácil que es gestionar tu inventario.'
            }]);
            setMessages(prev => [...prev, {
                id: Date.now() + 1, sender: 'bot', type: 'video',
                videoUrl: 'https://www.youtube.com/embed/example'
            }]);
            setQuickReplies([{ label: 'Empezar pedido 🚀', action: 'start_order', primary: true }]);
        } else if (action === 'ask_questions' || action === 'chat') {
            setFlowState('questions');
            // Mock AI call
            const aiRes = await axios.post(`${API_URL}/ai/expert-chat`, {
                message: text || '¿Qué incluye la garantía?',
                context: { client_name: quote?.client_name, business: quote?.client_business }
            });
            await new Promise(r => setTimeout(r, 1000));
            setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', text: aiRes.data.answer, time: 'Ahora' }]);
            setQuickReplies([{ label: 'Empezar pedido 🚀', action: 'start_order', primary: true }]);
        }

        setIsTyping(false);
    };

    const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val || 0);

    const renderPremiumDocument = () => (
        <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full relative animate-scale-in my-8 overflow-hidden">
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

            <div className="px-12 py-6 border-t border-gray-100 flex justify-between items-center bg-white text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                <span>Discovery Systems POS © 2026</span>
                <span>Documento Impreso Digitalmente</span>
            </div>
        </div>
    );

    if (loading && !quote) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
    if (error) return <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6 text-center"><div className="bg-white p-10 rounded-3xl shadow-xl"><FaTimes className="text-red-500 text-5xl mx-auto mb-4" /><h2 className="text-2xl font-bold">{error}</h2></div></div>;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col font-sans h-screen overflow-hidden relative">
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
                <div className="w-full h-1 bg-black/20">
                    <div className="h-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)] transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 relative no-scrollbar">
                <div className="max-w-4xl mx-auto space-y-6 pb-24">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'bot' && (
                                <div className="flex gap-4 max-w-[90%]">
                                    <div className="w-10 h-10 bg-[#1c242e] rounded-2xl flex items-center justify-center text-white shadow-xl flex-shrink-0">
                                        <FaRobot className="text-blue-300" />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="bg-white p-5 rounded-3xl rounded-tl-none shadow-xl shadow-gray-200 border border-gray-50">
                                            <p className="text-sm text-gray-800 leading-relaxed font-medium">{msg.text}</p>
                                            <span className="text-[10px] text-gray-400 font-bold mt-2 block">{msg.time}</span>
                                        </div>

                                        {msg.type === 'proposal_card' && (
                                            <div className="bg-gradient-to-br from-white to-blue-50/30 p-1 rounded-[2rem] shadow-2xl border border-white">
                                                <div className="bg-white/80 backdrop-blur-md rounded-[1.8rem] p-6 border border-blue-100">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                            <FaFileAlt className="text-blue-500" /> Tu Propuesta Discovery
                                                        </h4>
                                                        <span className="text-[9px] bg-blue-50 text-blue-500 px-2 py-1 rounded-full font-black">Ref #{id}</span>
                                                    </div>

                                                    <div className="space-y-3 mb-6">
                                                        {(msg.data.items || []).slice(0, 4).map((it, idx) => (
                                                            <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-gray-50 last:border-0">
                                                                <span className="truncate pr-4 font-medium text-gray-700">📦 {it.product_name || it.name}</span>
                                                                <span className="font-extrabold text-blue-600">x{it.quantity || 1}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row justify-between items-center pt-5 border-t border-gray-100 gap-4">
                                                        <div className="text-left w-full sm:w-auto">
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Total Inversión</p>
                                                            <p className="text-2xl font-black text-blue-800">{formatCurrency(msg.data.total)}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => setShowFullProposal(true)}
                                                            className="w-full sm:w-auto px-6 py-4 bg-[#1c242e] text-[#A8E0F0] font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-95"
                                                        >
                                                            Ver Detalle Pro <FaEye />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
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

            <footer className="bg-white border-t border-gray-100 p-4 sticky bottom-0 z-20">
                <div className="max-w-4xl mx-auto">
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
                    <form onSubmit={handleSendMessage} className="flex gap-3 bg-gray-50 p-2 rounded-[2rem] border border-gray-200 focus-within:bg-white transition-all">
                        <input
                            className="flex-1 bg-transparent px-6 py-3 outline-none font-bold text-gray-900"
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
                <div className="fixed inset-0 z-[100] bg-[#1c242e]/95 backdrop-blur-2xl flex flex-col items-center p-0 md:p-8 overflow-y-auto" onClick={() => setShowFullProposal(false)}>
                    {/* Fixed High-Visibility Close Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowFullProposal(false); }}
                        className="fixed top-4 right-4 md:top-8 md:right-8 w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] z-[200] hover:bg-red-500 hover:text-white transition-all active:scale-90 border-2 border-white/20"
                        aria-label="Cerrar Propuesta"
                    >
                        <FaTimes size={20} />
                    </button>

                    <div className="w-full max-w-4xl relative z-[110] mt-16 md:mt-0" onClick={e => e.stopPropagation()}>
                        {renderPremiumDocument()}

                        {/* Redundant bottom close button for mobile/long scrolls */}
                        <div className="flex justify-center py-10">
                            <button
                                onClick={() => setShowFullProposal(false)}
                                className="px-10 py-4 bg-white/10 text-white border border-white/20 rounded-2xl font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-3"
                            >
                                <FaTimes /> Volver al Chat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientPortal;
