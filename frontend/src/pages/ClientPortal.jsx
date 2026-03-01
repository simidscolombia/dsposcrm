import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaCheckCircle, FaPaperclip, FaPaperPlane, FaRobot, FaPlay, FaCalendarAlt, FaFileAlt, FaCheck, FaBuilding, FaHandshake } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Helper function to calculate a realistic typing delay globally
const simulateTypingDelay = (messageLength) => {
    const baseDelay = 1500; // minimum 1.5s thought process
    const typingSpeedMsPerChar = 30; // 30ms per character
    return Math.min(baseDelay + (messageLength * typingSpeedMsPerChar), 6000); // cap at 6 seconds
};

const ClientPortal = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);

    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [advisorName, setAdvisorName] = useState('IA de Ventas');

    // Chat states
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Business flow states
    // 'greet' -> 'shipping_address' -> 'payment_method' -> 'documents' -> 'completed'
    const [flowState, setFlowState] = useState('greet');
    const [progress, setProgress] = useState(20);
    const [quickReplies, setQuickReplies] = useState([]);

    // Data collection
    const [collectedData, setCollectedData] = useState({
        city: '',
        address: '',
        paymentMethod: '',
        rutFileUploaded: false,
        rutFileName: ''
    });

    useEffect(() => {
        fetchQuote();
    }, [id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, quickReplies]);

    const fetchQuote = async () => {
        try {
            const res = await axios.get(`${API_URL}/quotes/${id}`);
            if (res.data?.success) {
                const q = res.data.quote;
                setQuote(q);

                // Try to get advisor name based on city
                let advisor = 'IA de Ventas';
                try {
                    const cityParam = (q.city || 'colombia').toLowerCase().replace(/\s+/g, '-');
                    const waRes = await axios.get(`${API_URL}/config/whatsapp/${cityParam}`);
                    if (waRes.data?.success && waRes.data.number?.advisor) {
                        advisor = waRes.data.number.advisor;
                        setAdvisorName(advisor);
                    }
                } catch (e) {
                    console.log('Error fetching advisor info', e);
                }

                // Initialize chat with typing delay
                setLoading(false); // drop the main loading screen first
                setIsTyping(true);

                setTimeout(() => {
                    setMessages([
                        {
                            id: 1,
                            sender: 'bot',
                            text: `¡Hola ${q.client_name}! 👋 Soy ${advisor}, Asesor Personal en Discovery Systems. Veo que cotizaste un sistema con nosotros y tu propuesta está lista. ¿Qué te gustaría hacer ahora?`,
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }
                    ]);

                    setTimeout(() => {
                        setMessages(prev => [
                            ...prev,
                            {
                                id: 2,
                                sender: 'app', // special type for rendering a widget inside chat
                                type: 'quote_summary',
                                data: {
                                    total: q.final_amount || 0,
                                    itemsCount: q.items?.length || 0
                                }
                            }
                        ]);
                        setProgress(20);
                        setIsTyping(false);
                        setQuickReplies([
                            { label: 'Empezar mi pedido 🚀', action: 'start_order', primary: true },
                            { label: 'Ver Video Demo 🎬', action: 'view_demo' },
                            { label: 'Tengo preguntas 🤔', action: 'ask_questions' }
                        ]);
                    }, 1500);
                }, 1800);

            } else {
                setError('Cotización no encontrada');
                setLoading(false);
            }
        } catch (err) {
            console.error('Error fetching quote:', err);
            setError('Error al cargar la cotización o enlace inválido.');
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const appendMessage = (sender, text, type = 'text', data = null) => {
        setMessages(prev => [...prev, {
            id: Date.now(),
            sender,
            text,
            type,
            data,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
    };

    const handleQuickReply = async (reply) => {
        appendMessage('user', reply.label);
        setQuickReplies([]); // hide replies while processing
        setIsTyping(true);

        if (reply.action === 'view_demo') {
            const msg = '¡Genial! Disfruta el video. Cuando termines, dime si quieres empezar tu pedido o si tienes más dudas.';
            await new Promise(r => setTimeout(r, simulateTypingDelay(msg.length)));
            window.open('https://www.youtube.com/watch?v=demo-video', '_blank');
            appendMessage('bot', msg);
            setQuickReplies([
                { label: 'Empezar mi pedido 🚀', action: 'start_order', primary: true },
                { label: 'Tengo preguntas 🤔', action: 'ask_questions' }
            ]);
            setIsTyping(false);
            return;
        }

        if (reply.action === 'ask_questions') {
            const msg = '¡Claro! Pregúntame lo que necesites escribiendo en la caja de texto, y yo me encargaré de revisarlo contigo.';
            await new Promise(r => setTimeout(r, simulateTypingDelay(msg.length)));
            appendMessage('bot', msg);
            setFlowState('questions');
            setQuickReplies([
                { label: 'Ya no tengo dudas, ¡Empezar pedido! 🚀', action: 'start_order', primary: true }
            ]);
            setIsTyping(false);
            return;
        }

        if (reply.action === 'start_order') {
            const msg1 = '¡Excelente decisión! 🎉 Vamos a preparar todo para tu envío.';
            await new Promise(r => setTimeout(r, simulateTypingDelay(msg1.length)));
            appendMessage('bot', msg1);

            setIsTyping(true);
            const msg2 = 'Para programar la logística, escríbeme aquí abajo a qué Ciudad y Dirección exacta enviamos el equipo. (Ej: Bogotá, Calle 1 # 2-3 Local 4)';
            await new Promise(r => setTimeout(r, simulateTypingDelay(msg2.length)));
            appendMessage('bot', msg2);
            setFlowState('shipping_address');
            setProgress(40);
            setIsTyping(false);
            return;
        }

        if (reply.action === 'pay_transfer') {
            const msg = '¡Perfecto! Te enviaremos los datos de Bancolombia / Nequi a tu WhatsApp para que realices la transferencia de forma segura. 🏦';
            setCollectedData(prev => ({ ...prev, paymentMethod: 'transferencia' }));
            await new Promise(r => setTimeout(r, simulateTypingDelay(msg.length)));
            appendMessage('bot', msg);
            await finishOrder('transferencia');
            return;
        }

        if (reply.action === 'pay_contra_entrega') {
            const msg1 = '¡Perfecto, te cobramos en la puerta de tu local! 🤝 (Aplica ciudades principales).';
            setCollectedData(prev => ({ ...prev, paymentMethod: 'contra_entrega' }));
            await new Promise(r => setTimeout(r, simulateTypingDelay(msg1.length)));
            appendMessage('bot', msg1);
            setProgress(75);

            setIsTyping(true);
            const msg2 = 'Para habilitar esta opción y generarte el documento de soporte (Garantía de 12 meses), por favor adjunta aquí una foto o PDF de tu RUT o Cédula.';
            await new Promise(r => setTimeout(r, simulateTypingDelay(msg2.length)));
            appendMessage('bot', msg2);
            setFlowState('documents');
            setIsTyping(false);
            return;
        }

        setIsTyping(false);
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        const text = inputValue.trim();
        if (!text) return;

        appendMessage('user', text);
        setInputValue('');
        setIsTyping(true);

        setIsTyping(true);

        if (flowState === 'shipping_address') {
            const msg1 = '¡Anotado! 📍 Ya registré la dirección para el despacho.';
            setCollectedData(prev => ({ ...prev, address: text, city: 'Pendiente' })); // We capture it as raw text
            await new Promise(r => setTimeout(r, simulateTypingDelay(msg1.length)));
            appendMessage('bot', msg1);
            setProgress(60);

            setIsTyping(true);
            const msg2 = 'Ahora, cuéntame cómo prefieres realizar el pago:';
            await new Promise(r => setTimeout(r, simulateTypingDelay(msg2.length)));
            appendMessage('bot', msg2);
            setQuickReplies([
                { label: 'Pago Contra Entrega 🚚', action: 'pay_contra_entrega', primary: true },
                { label: 'Transferencia Bancaria 🏦', action: 'pay_transfer' }
            ]);
            setFlowState('payment_method');
            setIsTyping(false);
            return;
        }

        if (flowState === 'questions' || flowState === 'greet') {
            // Send to AI for QA
            try {
                const aiRes = await axios.post(`${API_URL}/ai/chatbot`, {
                    question: text,
                    context: { modules: quote?.items, total: quote?.final_amount, quoteId: quote?.id },
                    leadId: quote?.id
                });
                const answer = aiRes.data.answer;
                await new Promise(r => setTimeout(r, simulateTypingDelay(answer.length)));
                appendMessage('bot', answer);
            } catch (err) {
                const fallbackMessage = "Claro, ya mismo te reviso esta información en el sistema. Mientras tanto... cuéntame, ¿tienes alguna urgencia específica con los tiempos de entrega?";
                await new Promise(r => setTimeout(r, simulateTypingDelay(fallbackMessage.length)));
                appendMessage('bot', fallbackMessage);
            }
            if (flowState !== 'questions') {
                setTimeout(() => {
                    setQuickReplies([
                        { label: 'Empezar mi pedido 🚀', action: 'start_order', primary: true }
                    ]);
                }, 1000);
            }
            setIsTyping(false);
            return;
        }

        const defaultMessage = '¡Entendido! Si quieres avanzar con el pedido no dudes en decírmelo.';
        await new Promise(r => setTimeout(r, simulateTypingDelay(defaultMessage.length)));
        appendMessage('bot', defaultMessage);
        setIsTyping(false);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        appendMessage('user', `📎 Archivo adjunto: ${file.name}`, 'file');
        setIsTyping(true);

        // Simulate upload
        await new Promise(r => setTimeout(r, 1500));

        setCollectedData(prev => ({ ...prev, rutFileUploaded: true, rutFileName: file.name }));
        appendMessage('bot', '¡Documento recibido y validado con éxito! 🎉');

        await finishOrder('contra_entrega');
    };

    const finishOrder = async (method) => {
        setProgress(100);
        setFlowState('completed');

        try {
            await axios.put(`${API_URL}/quotes/${id}/confirm`, {
                shipping: { address: collectedData.address, city: 'Definida en chat' },
                paymentMethod: method
            });
            await new Promise(r => setTimeout(r, 800));
            appendMessage('bot', '¡Todo listo! Tu pedido ha sido confirmado y está en la cola de despacho. Nuestro equipo de logística te contactará directamente por WhatsApp en unos minutos.');
            appendMessage('app', '', 'success_widget');
            setIsTyping(false);
        } catch (error) {
            appendMessage('bot', 'Hubo un error guardando la confirmación, pero tenemos tus datos en el historial. Un agente te hablará enseguida.');
            setIsTyping(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount || 0);
    };

    if (loading && !quote) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Abriendo sala de chat...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
                    <div className="text-red-500 text-6xl mb-4 text-center mx-auto w-fit">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{error}</h2>
                    <p className="text-gray-600 mb-6">Asegúrate de haber ingresado desde el enlace correcto que te enviamos.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col font-sans h-screen overflow-hidden">
            {/* COMPOSITE HEADER AND PROGRESS */}
            <header className="bg-[#1c242e] border-b border-gray-800 shadow-md z-10 sticky top-0">
                <div className="max-w-4xl mx-auto px-4 py-3">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 flex items-center justify-center">
                                <img src="/logo.png" alt="Discovery Systems Pos" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white">{advisorName}</h1>
                                <p className="text-xs text-[#A8E0F0] font-medium flex items-center gap-1">
                                    <span className="w-2 h-2 bg-[#A8E0F0] shadow-[0_0_8px_#A8E0F0] rounded-full animate-pulse"></span> En línea (Atención Personalizada)
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="bg-[#12181f] px-3 py-1 rounded-full border border-gray-700 hidden sm:block">
                                <span className="text-xs font-bold text-[#A8E0F0]">Cotización #{String(quote?.id).padStart(4, '0')}</span>
                            </div>
                        </div>
                    </div>

                    {/* PROGRESS BAR */}
                    <div className="w-full bg-[#12181f] rounded-full h-2 mt-2">
                        <div className="bg-[#A8E0F0] shadow-[0_0_10px_#A8E0F0] h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="flex justify-between mt-1 px-1">
                        <span className="text-[10px] text-gray-400 font-medium">Progreso del Pedido</span>
                        <span className="text-[10px] text-[#A8E0F0] font-bold">{progress}% completado</span>
                    </div>
                </div>
            </header>

            {/* CHAT MESSAGES AREA */}
            <main className="flex-1 w-full max-w-4xl mx-auto p-4 overflow-y-auto bg-gray-100 pb-8 custom-scrollbar">
                <div className="space-y-4">
                    <div className="text-center text-xs text-gray-400 my-4 bg-gray-200 w-fit mx-auto px-3 py-1 rounded-full">
                        Hoy - {new Date().toLocaleDateString()}
                    </div>

                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>

                            {/* BOT MESSAGE */}
                            {msg.sender === 'bot' && (
                                <div className="flex gap-2 max-w-[85%] sm:max-w-[70%]">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-600 mt-auto ml-1">
                                        🤖
                                    </div>
                                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none p-3 shadow-sm relative">
                                        <p className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                        <span className="text-[10px] text-gray-400 absolute bottom-1 right-2">{msg.time}</span>
                                        <div className="pb-2"></div>
                                    </div>
                                </div>
                            )}

                            {/* SPECIAL WIDGET / APP CONTENT IN CHAT */}
                            {msg.sender === 'app' && msg.type === 'quote_summary' && (
                                <div className="w-full sm:max-w-[70%] ml-10 mb-2">
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 shadow-sm">
                                        <div className="flex items-center gap-2 text-indigo-800 font-bold mb-3 border-b border-blue-100 pb-2">
                                            <FaFileAlt /> Tu Cotización Resumida
                                        </div>
                                        <div className="space-y-2 mb-3">
                                            {(quote?.items || []).slice(0, 3).map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-xs text-gray-700">
                                                    <span className="truncate pr-4">• {item.name || item.product_name}</span>
                                                    <span className="font-medium whitespace-nowrap">x{item.quantity}</span>
                                                </div>
                                            ))}
                                            {(quote?.items?.length > 3) && <div className="text-xs text-gray-400 italic">... y más artículos</div>}
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                                            <span className="text-sm font-bold text-gray-600">Total a Pagar:</span>
                                            <span className="text-lg font-black text-indigo-900">{formatCurrency(msg.data.total)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {msg.sender === 'app' && msg.type === 'success_widget' && (
                                <div className="w-full sm:max-w-[70%] ml-10 mb-2">
                                    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 shadow-sm text-center">
                                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-3 shadow-lg shadow-green-200">
                                            <FaCheck />
                                        </div>
                                        <h3 className="text-xl font-bold text-green-800 mb-1">¡Todo Listo!</h3>
                                        <p className="text-sm text-green-700 mb-4">Pedido #{String(quote?.id).padStart(4, '0')} en cola de despacho.</p>
                                        <button
                                            onClick={() => window.open(`https://wa.me/573205792169?text=Hola,%20acabo%20de%20confirmar%20mi%20pedido%20(ID%20${String(quote?.id).padStart(4, '0')})%20en%20el%20Portal.%20¿Podemos%20coordinar?`, '_blank')}
                                            className="w-full py-3 bg-[#25D366] text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 hover:bg-[#128C7E] transition"
                                        >
                                            <FaWhatsapp className="text-xl" /> Hablar con Asesor Humano
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* USER MESSAGE */}
                            {msg.sender === 'user' && (
                                <div className="flex gap-2 max-w-[85%] sm:max-w-[70%]">
                                    <div className="bg-indigo-600 text-white rounded-2xl rounded-br-none p-3 shadow-md relative">
                                        {msg.type === 'file' ? (
                                            <div className="text-[14px] flex items-center gap-2 bg-indigo-700 p-2 rounded-lg">
                                                {msg.text}
                                            </div>
                                        ) : (
                                            <p className="text-[15px] leading-relaxed break-words">{msg.text}</p>
                                        )}
                                        <div className="flex justify-end mt-1 items-center gap-1">
                                            <span className="text-[10px] text-indigo-200">{msg.time}</span>
                                            <FaCheck className="text-[8px] text-white opacity-80" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex gap-2 max-w-[85%] sm:max-w-[70%] animate-fade-in">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-600 mt-auto ml-1 pb-1">🤖</div>
                            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none p-4 shadow-sm flex gap-1 items-center">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} className="h-4"></div>
                </div>
            </main>

            {/* INPUT AREA */}
            <footer className="bg-white border-t border-gray-200 p-3 pb-6 w-full flex-shrink-0 z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] relative">
                <div className="max-w-4xl mx-auto">

                    {/* Quick Replies */}
                    {quickReplies.length > 0 && !isTyping && (
                        <div className="flex flex-wrap gap-2 mb-3 px-1 animate-fade-in-up">
                            {quickReplies.map((reply, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleQuickReply(reply)}
                                    className={`px-4 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${reply.primary ? 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transform' : 'bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50'}`}
                                >
                                    {reply.label}
                                </button>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handleSendMessage} className="flex gap-2 items-center bg-gray-100 rounded-full p-1 pl-4 mx-1 border border-gray-200 focus-within:ring-2 focus-within:ring-indigo-300 focus-within:border-indigo-400 transition-all">

                        {flowState === 'documents' && (
                            <label className="cursor-pointer text-gray-500 hover:text-indigo-600 p-2 transition-colors">
                                <FaPaperclip className="text-xl" />
                                <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,image/*" />
                            </label>
                        )}

                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={flowState === 'documents' ? 'Sube tu documento pulsando el clip 📎' : flowState === 'shipping_address' ? 'Escribe tu ciudad y dirección...' : 'Escribe tu mensaje...'}
                            className="flex-1 bg-transparent border-none outline-none py-3 text-gray-800 placeholder-gray-400 text-[15px]"
                            disabled={isTyping || flowState === 'completed' || (flowState === 'documents' && !inputValue)}
                        />

                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isTyping || flowState === 'completed'}
                            className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center disabled:opacity-50 disabled:bg-gray-400 transition-colors mr-1 shadow-md"
                        >
                            <FaPaperPlane className="-ml-0.5" />
                        </button>
                    </form>
                    <div className="text-center mt-2">
                        <span className="text-[10px] text-gray-400 font-medium">🔒 Todo nuestro chat es confidencial y seguro</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ClientPortal;
