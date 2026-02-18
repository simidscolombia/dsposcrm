// frontend/src/components/PostRoulette/ChatbotWidget.jsx
// Chatbot con IA para responder dudas post-cotización

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const ChatbotWidget = ({ quoteContext, leadName }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: `¡Hola ${leadName}! 👋 Soy el asistente virtual de Discovery Systems. ¿Tienes alguna pregunta sobre tu cotización? Estoy aquí para ayudarte.`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const API_URL = '/api';

  // Scroll automático al último mensaje
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Preguntas rápidas sugeridas
  const quickQuestions = [
    '¿Cuánto tiempo toma la implementación?',
    '¿Qué incluye el soporte técnico?',
    '¿Puedo pagar en cuotas?',
    '¿Necesito internet para usar el sistema?',
  ];

  const handleSendMessage = async (messageText = null) => {
    const text = messageText || inputValue.trim();
    if (!text) return;

    // Agregar mensaje del usuario
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setIsLoading(true);

    try {
      // Llamar al backend (Claude AI)
      const response = await axios.post(`${API_URL}/api/ai/chatbot`, {
        question: text,
        context: quoteContext,
      });

      // Simular delay de "escribiendo..."
      await new Promise(resolve => setTimeout(resolve, 1000));

      const botMessage = {
        id: messages.length + 2,
        type: 'bot',
        text: response.data.answer,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error en chatbot:', error);

      const errorMessage = {
        id: messages.length + 2,
        type: 'bot',
        text: 'Disculpa, tuve un problema procesando tu pregunta. ¿Quieres hablar directamente con un asesor? 😊',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    handleSendMessage(question);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Chat messages area */}
      <div className="h-96 overflow-y-auto p-4 bg-gray-50 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${message.type === 'user'
                ? 'bg-indigo-500 text-white rounded-br-none'
                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                }`}
            >
              {message.type === 'bot' && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-xs">🤖</span>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600">
                    Asistente Discovery
                  </span>
                </div>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.text}
              </p>
              <div
                className={`text-xs mt-2 ${message.type === 'user' ? 'text-indigo-200' : 'text-gray-400'
                  }`}
              >
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-none">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-xs text-gray-500">Escribiendo...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick questions */}
      {messages.length <= 2 && (
        <div className="px-4 py-3 bg-indigo-50 border-t border-indigo-100">
          <p className="text-xs text-indigo-600 font-semibold mb-2">
            Preguntas frecuentes:
          </p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                disabled={isLoading}
                className="text-xs bg-white text-indigo-600 px-3 py-2 rounded-full border border-indigo-200 hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu pregunta..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            className="bg-indigo-500 text-white p-2 rounded-full hover:bg-indigo-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed w-10 h-10 flex items-center justify-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
          <span>Asistido por IA • Respuestas en tiempo real</span>
        </div>
      </div>
    </div>
  );
};

export default ChatbotWidget;
