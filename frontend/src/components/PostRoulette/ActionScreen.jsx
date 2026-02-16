// frontend/src/components/PostRoulette/ActionScreen.jsx
// Pantalla post-ruleta con múltiples opciones para el usuario

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import ChatbotWidget from './ChatbotWidget';

const ActionScreen = (props) => {
  const location = useLocation();
  const state = location.state || {}; // Fallback to location state

  // Use props if available (direct render), otherwise use location state (route navigation)
  const leadData = props.leadData || state.leadData || { name: 'Empresario' };
  const quoteData = props.quoteData || state.quoteData || { total: 0, modules: [] };
  const prizeWon = props.prizeWon || state.prizeWon || 'Descuento Soporte';
  const [showChatbot, setShowChatbot] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      `Hola! Soy ${leadData.name} y acabo de generar mi cotización. Me gustaría hablar con un asesor sobre el sistema Discovery POS.`
    );
    const phone = '573001234567'; // Número de Discovery Systems
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handleDownloadPDF = () => {
    if (quoteData.pdfUrl) {
      window.open(quoteData.pdfUrl, '_blank');
    }
  };

  const handleViewDemo = () => {
    // Abrir modal con video demo o redirigir a página de demo
    window.open('https://www.youtube.com/watch?v=demo-video', '_blank');
  };

  const handleScheduleDemo = () => {
    // Abrir Calendly embebido o modal
    window.open('https://calendly.com/discovery-systems/demo', '_blank');
  };

  const handleEditQuote = () => {
    // Volver al wizard
    window.location.href = '/cotizador?edit=true';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header - Premio ganado */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-8 mb-8 text-center shadow-2xl border-4 border-dashed border-red-500 animate-pulse-slow">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl font-bold text-white mb-2">
            ¡Felicidades {leadData.name}!
          </h1>
          <div className="text-2xl font-semibold text-white mb-2">
            Ganaste:
          </div>
          <div className="text-3xl font-black text-red-600 bg-white rounded-lg py-3 px-6 inline-block">
            {prizeWon}
          </div>
        </div>

        {/* Mensaje principal */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Tu cotización está lista
            </h2>
          </div>
          <p className="text-gray-600 text-lg leading-relaxed">
            Hemos preparado una propuesta personalizada para <strong>{leadData.businessName || 'tu negocio'}</strong>.
            Ahora puedes elegir cómo continuar:
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Acción Rápida
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Hablar con asesor - Prioridad #1 */}
            <button
              onClick={handleWhatsAppContact}
              className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-4xl">💬</span>
                  <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold animate-bounce">
                    RECOMENDADO
                  </span>
                </div>
                <h4 className="text-xl font-bold mb-2">Hablar con Asesor AHORA</h4>
                <p className="text-green-100 text-sm">
                  Respuesta inmediata por WhatsApp
                </p>
              </div>
            </button>

            {/* Descargar PDF */}
            <button
              onClick={handleDownloadPDF}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-4xl">📥</span>
              </div>
              <h4 className="text-xl font-bold mb-2">Descargar Cotización PDF</h4>
              <p className="text-blue-100 text-sm">
                Guarda tu propuesta completa
              </p>
            </button>
          </div>
        </div>

        {/* Conocer Más */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="text-2xl">🔍</span>
            Conocer Más
          </h3>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Ver demo */}
            <button
              onClick={handleViewDemo}
              className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 text-purple-700 p-6 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-4xl mb-3">🎬</div>
              <h4 className="text-lg font-bold mb-2">Ver Demo del Software</h4>
              <p className="text-purple-600 text-sm">
                Video de 2 minutos
              </p>
            </button>

            {/* Agendar demostración */}
            <button
              onClick={handleScheduleDemo}
              className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 text-orange-700 p-6 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-4xl mb-3">📅</div>
              <h4 className="text-lg font-bold mb-2">Agendar Demostración</h4>
              <p className="text-orange-600 text-sm">
                Elige tu horario
              </p>
            </button>

            {/* Ajustar cotización */}
            <button
              onClick={handleEditQuote}
              className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 text-gray-700 p-6 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="text-4xl mb-3">✏️</div>
              <h4 className="text-lg font-bold mb-2">Ajustar Cotización</h4>
              <p className="text-gray-600 text-sm">
                Modifica tus respuestas
              </p>
            </button>
          </div>
        </div>

        {/* Chatbot Widget - IA */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow-lg p-6 mb-6 border-2 border-indigo-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  ¿Tienes preguntas?
                </h3>
                <p className="text-sm text-gray-600">
                  Nuestro asistente con IA está aquí para ayudarte
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowChatbot(!showChatbot)}
              className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition-colors font-semibold"
            >
              {showChatbot ? 'Cerrar Chat' : 'Abrir Chat'}
            </button>
          </div>

          {showChatbot && (
            <ChatbotWidget
              quoteContext={quoteData}
              leadName={leadData.name}
            />
          )}
        </div>

        {/* Resumen de cotización */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            📊 Resumen de tu Cotización
          </h3>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {quoteData.modules?.length || 3}
              </div>
              <div className="text-sm text-gray-600">Módulos Incluidos</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  minimumFractionDigits: 0,
                }).format(quoteData.total || 0)}
              </div>
              <div className="text-sm text-gray-600">Inversión Total</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                3-5
              </div>
              <div className="text-sm text-gray-600">Días de Implementación</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-orange-400 p-4 rounded">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <p className="font-semibold text-gray-800 mb-1">
                  Oferta especial válida por 48 horas
                </p>
                <p className="text-sm text-gray-600">
                  Si tomas la decisión en los próximos 2 días, obtienes un 15% de descuento adicional + instalación gratuita.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600 text-sm">
          <p>¿Necesitas ayuda? Escríbenos por WhatsApp o llámanos al +57 300 123 4567</p>
          <p className="mt-2">Discovery Systems © 2026 | Todos los derechos reservados</p>
        </div>
      </div>

      {/* Estilos adicionales */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default ActionScreen;
