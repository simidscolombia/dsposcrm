import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CitySelection from '../components/Wizard/Steps/CitySelection';
import BusinessTypeSelection from '../components/Wizard/Steps/BusinessTypeSelection';
import SystemTypeSelection from '../components/Wizard/Steps/SystemTypeSelection';
import ProductCatalog from '../components/Wizard/Catalog/ProductCatalog';
import SpinningWheel from '../components/Roulette/SpinningWheel';
import LeadCapture from '../components/Wizard/Steps/LeadCapture';

const QuotePage = () => {
    const [step, setStep] = useState(0);
    const [selections, setSelections] = useState({
        city: '',
        businessType: '',
        systemType: '',
        hardware: [],
        prize: ''
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const API_URL = '/api';

    const handleNext = (key, value) => {
        setSelections(prev => ({ ...prev, [key]: value }));
        setStep(prev => prev + 1);
    };

    const handleSpinEnd = (prize) => {
        setSelections(prev => ({ ...prev, prize }));
        setStep(prev => prev + 1); // Move to Lead Capture
    };

    const handleLeadSubmit = async (leadData) => {
        setLoading(true);
        let capturedLeadId = null;

        try {
            // 1. Guardar Lead en Base de Datos
            try {
                const leadResponse = await axios.post(`${API_URL}/api/leads`, {
                    name: leadData.name,
                    whatsapp: leadData.whatsapp,
                    city: selections.city,
                    businessType: selections.businessType
                });

                if (leadResponse.data.success) {
                    capturedLeadId = leadResponse.data.lead.id;
                    console.log("Lead guardado en BD con ID:", capturedLeadId);
                }
            } catch (err) {
                console.error("Error guardando lead en BD (continuando flujo):", err);
            }

            // Combine all data
            const fullData = {
                leadId: capturedLeadId,
                leadData: {
                    name: leadData.name,
                    whatsapp: leadData.whatsapp,
                    city: selections.city
                },
                wizardAnswers: {
                    businessType: selections.businessType,
                    systemType: selections.systemType,
                    selectedProducts: selections.selectedProducts || [],
                    prizeWon: selections.prize,
                    // Synthesize a description for the AI based on tags
                    businessDescription: `${selections.businessType} en ${selections.city}. Interesado en: ${selections.systemType}. Carrito de compras: ${(selections.selectedProducts || []).map(p => `${p.quantity}x ${p.name}`).join(', ') || 'Ninguno'}.`
                }
            };

            // Generate quote using AI
            const response = await axios.post(`${API_URL}/api/ai/generate-quote`, fullData);

            navigate('/resultado', {
                state: {
                    leadData: fullData.leadData,
                    quoteData: response.data.success ? response.data.quote : fallbackQuote(fullData),
                    prizeWon: selections.prize
                }
            });

        } catch (error) {
            console.error('Error generating quote:', error);
            // Fallback navigation
            navigate('/resultado', {
                state: {
                    leadData: { name: leadData.name }, // incomplete but safe
                    quoteData: fallbackQuote({ wizardAnswers: { businessType: selections.businessType } }),
                    prizeWon: selections.prize
                }
            });
        } finally {
            setLoading(false);
        }
    };

    // Helper fallback
    const fallbackQuote = (data) => ({
        modules: [
            { name: 'Licencia Sistema POS', description: 'Facturación, Inventario y Ventas', price: 1500000 },
            { name: 'Módulo de Reportes', description: 'Estadísticas en tiempo real', price: 500000 },
            { name: 'Soporte e Implementación', description: 'Capacitación y configuración remota', price: 500000 }
        ],
        total: 2500000,
        pdfUrl: '#'
    });

    const renderStep = () => {
        switch (step) {
            case 0: return <CitySelection onSelect={(val) => handleNext('city', val)} />;
            case 1: return <BusinessTypeSelection onSelect={(val) => handleNext('businessType', val)} />;
            case 2: return <SystemTypeSelection onSelect={(val) => handleNext('systemType', val)} />;
            case 3: return <ProductCatalog systemType={selections.systemType} onContinue={(products) => handleNext('selectedProducts', products)} />;
            case 4: return <SpinningWheel onSpinEnd={handleSpinEnd} />;
            case 5: return <LeadCapture onComplete={handleLeadSubmit} />;
            default: return <div>Paso desconocido</div>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-6"></div>
                <h2 className="text-2xl font-bold text-gray-800 animate-pulse">
                    🤖 La IA está diseñando tu oferta...
                </h2>
                <p className="text-gray-500 mt-2">Personalizando según tu negocio en {selections.city}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow-sm py-4 px-6 fixed w-full top-0 z-50">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        {step > 0 && (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="text-gray-500 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                        )}
                        <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
                            <span className="text-2xl">🚀</span> Discovery Systems
                        </h1>
                    </div>
                    <div className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        Paso {step + 1} de 6
                    </div>
                </div>
            </header>

            <main className="flex-1 pt-24 px-4 pb-12 flex items-center justify-center">
                <div className="w-full max-w-4xl transition-all duration-500 ease-in-out transform">
                    {renderStep()}
                </div>
            </main>

            {/* Progress Bar */}
            <div className="fixed bottom-0 left-0 w-full h-2 bg-gray-200">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                    style={{ width: `${((step + 1) / 6) * 100}%` }}
                ></div>
            </div>
        </div>
    );
};

export default QuotePage;
