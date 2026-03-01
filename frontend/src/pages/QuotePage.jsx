import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Steps
import CitySelection from '../components/Wizard/Steps/CitySelection';
import BusinessTypeSelection from '../components/Wizard/Steps/BusinessTypeSelection';
import SystemTypeSelection from '../components/Wizard/Steps/SystemTypeSelection';
import ProductCatalog from '../components/Wizard/Catalog/ProductCatalog';
import QuotePreview from '../components/Wizard/QuotePreview';
import SpinningWheel from '../components/Roulette/SpinningWheel';
import QuoteFinal from '../components/PostRoulette/QuoteFinal';

// =============================================
// FLUJO COMPLETO DEL WIZARD:
// 0: Ciudad
// 1: Tipo de Negocio
// 2: Tipo de Sistema (Software / Combo / Mix)
// 3: Catálogo de Productos
// 4: Preview de Cotización (editable)
// 5: Ruleta de Premios (SIN RETROCESO)
// 6: Cotización Final (con premio aplicado)
// =============================================

const STEP_LABELS = [
    'Ciudad',
    'Tu Negocio',
    'Tipo de Sistema',
    'Productos',
    'Tu Cotización',
    'Premio',
    'Resultado Final'
];

// Anti-cheat: step from which you can't go back
const ROULETTE_STEP = 5;
const FINAL_STEP = 6;

const STEP_GUIDES = [
    { title: 'Paso 1: ¿De dónde nos visitas?', subtitle: 'Seleccionemos primero tu departamento para ver disponibilidad.' },
    { title: 'Paso 2: ¿Cuál es tu negocio?', subtitle: 'Cuéntanos un poco de ti para recomendarte lo mejor.' },
    { title: 'Paso 3: ¿Qué necesitas hoy?', subtitle: 'Filtremos las opciones dependiendo si ocupas equipos o solo software.' },
    { title: 'Paso 4: Tu Selección', subtitle: 'Revisa o agrega componentes y configura tu pedido a tu gusto.' },
    { title: 'Paso 5: Resumen', subtitle: 'Valida las cantidades antes de ir por tu premio.' },
    { title: '¡Gira y Gana!', subtitle: '¡Mucha suerte! Veamos qué beneficio adicional te llevas hoy.' },
    { title: '¡Listo!', subtitle: 'Cotización finalizada con éxito.' }
];

const QuotePage = () => {
    const [step, setStep] = useState(0);
    const [selections, setSelections] = useState({
        city: '',
        businessType: '',
        systemType: '',
        selectedProducts: [],
        prize: null
    });

    // Client data from URL params
    const [clientData, setClientData] = useState({
        name: '',
        phone: ''
    });

    // Anti-cheat: has the roulette been played?
    const [roulettePlayed, setRoulettePlayed] = useState(false);

    // =============================================
    // READ URL PARAMS (from WhatsApp link)
    // Example: https://app.com/#/?name=Juan&phone=573001234567
    // =============================================
    useEffect(() => {
        try {
            // HashRouter: params come after #/ in the URL
            const hash = window.location.hash; // e.g., "#/?name=Juan&phone=573001234"
            const queryString = hash.includes('?') ? hash.split('?')[1] : '';
            const params = new URLSearchParams(queryString);

            const name = params.get('name') || params.get('nombre') || '';
            const phone = params.get('phone') || params.get('whatsapp') || params.get('tel') || '';

            if (name || phone) {
                setClientData({ name: decodeURIComponent(name), phone: decodeURIComponent(phone) });
                console.log('📱 Client data from URL:', { name, phone });
            }
        } catch (e) {
            console.log('No URL params found');
        }

        // Check localStorage for anti-cheat (session-based)
        const played = localStorage.getItem('discovery_roulette_played');
        if (played) {
            try {
                const data = JSON.parse(played);
                // Only valid for 24 hours
                if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
                    setRoulettePlayed(true);
                    setSelections(prev => ({ ...prev, prize: data.prize }));
                } else {
                    localStorage.removeItem('discovery_roulette_played');
                }
            } catch (e) {
                localStorage.removeItem('discovery_roulette_played');
            }
        }
    }, []);

    // =============================================
    // BLOCK BROWSER BACK BUTTON after roulette
    // =============================================
    useEffect(() => {
        if (step >= ROULETTE_STEP) {
            const handlePopState = (e) => {
                e.preventDefault();
                window.history.pushState(null, '', window.location.href);
            };

            window.history.pushState(null, '', window.location.href);
            window.addEventListener('popstate', handlePopState);

            return () => window.removeEventListener('popstate', handlePopState);
        }
    }, [step]);

    // =============================================
    // NAVIGATION HANDLERS
    // =============================================
    const handleNext = (key, value) => {
        setSelections(prev => ({ ...prev, [key]: value }));
        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        // Cannot go back from roulette or after
        if (step >= ROULETTE_STEP) return;
        setStep(prev => Math.max(0, prev - 1));
    };

    // From QuotePreview: go back to catalog (step 3)
    const handleGoBackToCatalog = () => {
        setStep(3);
    };

    // From QuotePreview: update products and confirm (go to roulette)
    const handleQuoteConfirm = (updatedProducts) => {
        setSelections(prev => ({ ...prev, selectedProducts: updatedProducts }));
        setStep(ROULETTE_STEP); // Go to roulette
    };

    // =============================================
    // ROULETTE HANDLER (Anti-cheat)
    // =============================================
    const handleSpinEnd = (prize) => {
        // Save prize in state
        setSelections(prev => ({ ...prev, prize }));
        setRoulettePlayed(true);

        // Save to localStorage (anti-cheat - 24h window)
        try {
            localStorage.setItem('discovery_roulette_played', JSON.stringify({
                prize,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.error('Could not save to localStorage:', e);
        }

        // Quote saving is now handled by QuoteFinal component
        // which saves the complete data (lead + quote + items)

        // Go to final step
        setStep(FINAL_STEP);
    };

    // =============================================
    // RENDER STEP
    // =============================================
    const renderStep = () => {
        switch (step) {
            case 0:
                return <CitySelection onSelect={(val) => handleNext('city', val)} />;

            case 1:
                return <BusinessTypeSelection onSelect={(val) => handleNext('businessType', val)} />;

            case 2:
                return <SystemTypeSelection onSelect={(val) => handleNext('systemType', val)} />;
            case 3:
                return (
                    <ProductCatalog
                        systemType={selections.systemType}
                        businessType={selections.businessType}
                        onContinue={(products) => handleNext('selectedProducts', products)}
                    />
                );

            case 4:
                return (
                    <QuotePreview
                        selectedProducts={selections.selectedProducts}
                        clientName={clientData.name}
                        clientPhone={clientData.phone}
                        onUpdateClient={(name, phone) => setClientData({ name, phone })}
                        onConfirm={handleQuoteConfirm}
                        onGoBackToCatalog={handleGoBackToCatalog}
                    />
                );

            case 5:
                // If already played, skip directly to final
                if (roulettePlayed && selections.prize) {
                    setStep(FINAL_STEP);
                    return null;
                }
                return <SpinningWheel
                    onSpinEnd={handleSpinEnd}
                    cartCategories={[...new Set((selections.selectedProducts || []).map(p => p.category).filter(Boolean))]}
                />;

            case 6:
                return (
                    <QuoteFinal
                        selectedProducts={selections.selectedProducts}
                        prize={selections.prize}
                        clientName={clientData.name}
                        clientPhone={clientData.phone}
                        city={selections.city}
                        businessType={selections.businessType}
                        systemType={selections.systemType}
                    />
                );

            default:
                return <div>Paso desconocido</div>;
        }
    };

    // =============================================
    // PROGRESS BAR - should not show "back" arrow after roulette
    // =============================================
    const canGoBack = step > 0 && step < ROULETTE_STEP;
    const totalSteps = STEP_LABELS.length;
    const progressPercent = ((step + 1) / totalSteps) * 100;

    // Don't show header/progress on final step (cleaner result page)
    const showHeader = step < FINAL_STEP;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {showHeader && (
                <header className="bg-[#1c242e] shadow-lg pt-3 md:pt-4 px-4 md:px-6 fixed w-full top-0 z-50 border-b border-gray-800">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 mb-2 md:mb-4">
                        <div className="flex w-full md:w-auto items-center justify-between md:justify-start gap-4">
                            <div className="flex items-center gap-3">
                                {canGoBack && (
                                    <button
                                        onClick={handleBack}
                                        className="text-gray-400 hover:text-[#A8E0F0] transition-colors p-2 rounded-full hover:bg-white/5"
                                        aria-label="Volver"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                    </button>
                                )}
                                <div className="flex items-center gap-2">
                                    <img src="/logo.png" alt="Discovery Systems Pos" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold text-lg md:text-xl leading-none tracking-wide">Discovery</span>
                                        <span className="text-gray-400 text-[10px] md:text-xs font-semibold leading-none tracking-widest uppercase mt-0.5">Systems Pos</span>
                                    </div>
                                </div>
                            </div>
                            <div className="md:hidden text-xs font-bold text-[#1c242e] bg-[#A8E0F0] px-3 py-1 rounded-full shadow-[0_0_10px_rgba(168,224,240,0.3)]">
                                {step + 1} / {totalSteps}
                            </div>
                        </div>

                        {/* Middle Guided Text */}
                        <div className="flex-1 text-center hidden md:block">
                            <h2 className="text-sm font-bold text-white">{STEP_GUIDES[step]?.title}</h2>
                            <p className="text-xs text-gray-400 mt-0.5">{STEP_GUIDES[step]?.subtitle}</p>
                        </div>

                        <div className="hidden md:flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-400">
                                {STEP_LABELS[step] || ''}
                            </span>
                            <div className="text-sm font-bold text-[#1c242e] bg-[#A8E0F0] px-3 py-1 rounded-full shadow-[0_0_10px_rgba(168,224,240,0.3)]">
                                {step + 1} / {totalSteps}
                            </div>
                        </div>
                    </div>

                    {/* Thicker Progress Bar with Percentage */}
                    <div className="absolute bottom-0 left-0 w-full h-3 md:h-4 bg-[#12181f] overflow-hidden">
                        <div
                            className={`h-full transition-all duration-700 ease-out bg-[#A8E0F0] relative flex items-center justify-center`}
                            style={{ width: `${progressPercent}%`, boxShadow: '0 0 10px #A8E0F0' }}
                        >
                            <span className="text-[9px] md:text-[10px] font-black text-[#1c242e] whitespace-nowrap">
                                {Math.round(progressPercent)}% COMPLETADO
                            </span>
                        </div>
                    </div>
                </header>
            )}

            <main className={`flex-1 ${showHeader ? 'pt-28 md:pt-24' : 'pt-4'} px-2 md:px-4 pb-12 flex flex-col items-center justify-start md:justify-center`}>

                {/* Mobile Guided Text (appears below header on mobile) */}
                {showHeader && (
                    <div className="md:hidden text-center w-full mb-6 mt-4 animate-fade-in-up">
                        <h2 className="text-lg font-bold text-gray-800">{STEP_GUIDES[step]?.title}</h2>
                        <p className="text-sm text-gray-500 mt-1 px-4">{STEP_GUIDES[step]?.subtitle}</p>
                    </div>
                )}
                <div className="w-full max-w-4xl transition-all duration-500 ease-in-out transform">
                    {renderStep()}
                </div>
            </main>

            {/* Bottom Progress Bar Removed (Moved to header) */}
        </div>
    );
};

export default QuotePage;
