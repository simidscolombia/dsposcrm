import React, { useState } from 'react';
import axios from 'axios';

const ConversationalStep = ({ onFinish, leadName }) => {
    const [messages, setMessages] = useState([
        { text: `Hola ${leadName}! Soy el asistente de IA de Discovery Systems. Cuéntame, ¿qué tipo de negocio tienes y qué productos o servicios vendes?`, sender: 'ai' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [conversationHistory, setConversationHistory] = useState([]);
    const [businessData, setBusinessData] = useState(null);
    const [questionCount, setQuestionCount] = useState(0);

    const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4050';
    const API_URL = '';

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userText = inputValue;
        setInputValue('');

        // Add user message to UI
        const newMessages = [...messages, { text: userText, sender: 'user' }];
        setMessages(newMessages);
        setLoading(true);

        try {
            // Keep track of conversation
            const currentHistory = [...conversationHistory, { question: messages[messages.length - 1].text, answer: userText }];
            setConversationHistory(currentHistory);

            if (!businessData) {
                // First interaction: Analyze business
                const response = await axios.post(`${API_URL}/api/ai/analyze-business`, {
                    description: userText,
                    previousAnswers: []
                });

                if (response.data.success) {
                    const analysis = response.data.analysis;
                    setBusinessData(analysis);

                    // Ask first follow-up question
                    if (analysis.followUpQuestions && analysis.followUpQuestions.length > 0) {
                        setMessages(prev => [...prev, { text: analysis.followUpQuestions[0], sender: 'ai' }]);
                        setQuestionCount(1);
                    } else {
                        finishWizard(analysis, currentHistory);
                    }
                } else {
                    // Fallback if AI fails (e.g. key issue)
                    fallbackFlow(userText);
                }
            } else {
                // Subsequent interactions
                const analysis = businessData;
                if (questionCount < (analysis.followUpQuestions?.length || 0)) {
                    // Ask next question
                    const nextQuestion = analysis.followUpQuestions[questionCount];
                    setMessages(prev => [...prev, { text: nextQuestion, sender: 'ai' }]);
                    setQuestionCount(prev => prev + 1);
                } else {
                    // Finished questions
                    finishWizard(businessData, currentHistory);
                }
            }

        } catch (error) {
            console.error('Error contacting AI:', error);
            // Fallback flow
            fallbackFlow(userText);
        } finally {
            setLoading(false);
        }
    };

    const fallbackFlow = (lastInput) => {
        // Simple linear fallback if API fails
        if (questionCount === 0) {
            setMessages(prev => [...prev, { text: "Entendido. ¿Cuántas sucursales manejas?", sender: 'ai' }]);
            setQuestionCount(1);
            setBusinessData({ fallback: true });
        } else if (questionCount === 1) {
            setMessages(prev => [...prev, { text: "¿Qué funcionalidad es vital para ti? (Ej. Inventario, Facturación)", sender: 'ai' }]);
            setQuestionCount(2);
        } else {
            finishWizard({ fallback: true }, conversationHistory);
        }
    };

    const finishWizard = async (data, history) => {
        setMessages(prev => [...prev, { text: "¡Perfecto! Tengo toda la información. Generando tu cotización personalizada...", sender: 'ai' }]);

        // Call generate quote API
        try {
            // We pass the gathered info to the parent or call API here
            // For now, let's pass it to parent which might handle the Quote Generation or just transition

            // Wait a bit for effect
            setTimeout(() => {
                onFinish({
                    businessData: data,
                    history: history
                });
            }, 1500);

        } catch (error) {
            console.error(error);
            onFinish({ error: true });
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg mt-10 p-6 flex flex-col h-[500px]">
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 text-gray-500 rounded-lg p-3">
                            Escribiendo...
                        </div>
                    </div>
                )}
            </div>

            <div className="border-t pt-4 flex gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Escribe tu respuesta..."
                    disabled={loading}
                    className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
                <button
                    onClick={handleSend}
                    disabled={loading}
                    className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition disabled:opacity-50"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ConversationalStep;
