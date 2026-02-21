import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

import { FaWhatsapp, FaFilePdf, FaCheckCircle, FaGift, FaCalendarAlt, FaPlay, FaUserCheck, FaCopy } from 'react-icons/fa';
import ChatbotWidget from './ChatbotWidget';

const API_URL = '/api';

const QuoteFinal = ({ selectedProducts, prize, clientName, clientPhone, city, businessType, systemType }) => {
    const [showChatbot, setShowChatbot] = useState(false);
    const [pdfGenerated, setPdfGenerated] = useState(false);
    const [quoteSaved, setQuoteSaved] = useState(false);
    const [quoteId, setQuoteId] = useState(null);
    const [whatsappNumber, setWhatsappNumber] = useState('573205792169'); // Default Colombia
    const [advisorName, setAdvisorName] = useState('un asesor');
    const [companyConfig, setCompanyConfig] = useState(null);
    const savedRef = useRef(false); // Prevent double save

    // ============================================
    // FETCH CONFIG + SAVE QUOTE ON MOUNT
    // ============================================
    useEffect(() => {
        // 1. Fetch WhatsApp number for this city
        const fetchConfig = async () => {
            try {
                const cityParam = (city || 'Colombia').toLowerCase().replace(/\s+/g, '-');
                const [waRes, companyRes] = await Promise.all([
                    axios.get(`${API_URL}/config/whatsapp/${cityParam}`).catch(() => null),
                    axios.get(`${API_URL}/config/company`).catch(() => null)
                ]);
                if (waRes?.data?.success) {
                    setWhatsappNumber(waRes.data.number?.number || '573205792169');
                    setAdvisorName(waRes.data.number?.advisor || 'un asesor');
                }
                if (companyRes?.data?.success) {
                    setCompanyConfig(companyRes.data.config);
                }
            } catch (e) {
                console.log('Config fetch failed (using defaults):', e);
            }
        };
        fetchConfig();

        // 2. Save the quote (only once)
        if (!savedRef.current) {
            savedRef.current = true;
            saveQuote();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ============================================
    // SAVE QUOTE TO DATABASE
    // ============================================
    const saveQuote = async () => {
        try {
            const discount = calculateDiscount();
            const sub = calculateSubtotal();
            const final_total = sub - discount.discountAmount;

            const response = await axios.post(`${API_URL}/quotes`, {
                clientName: clientName || 'Cliente Web',
                clientPhone: clientPhone || null,
                city: city || null,
                businessType: businessType || null,
                systemType: systemType || null,
                source: 'web',
                products: (selectedProducts || []).map(p => ({
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    price: p.price,
                    quantity: p.quantity || 1
                })),
                prizeLabel: discount.label || null,
                prizeDetail: discount.description || null,
                discountPercent: discount.value || 0,
                discountAmount: discount.discountAmount || 0,
                subtotal: sub,
                finalTotal: final_total
            });

            if (response.data?.success) {
                setQuoteSaved(true);
                setQuoteId(response.data.data?.quote_id);
                console.log('✅ Cotización guardada en CRM:', response.data.data);
            }
        } catch (err) {
            console.error('Error guardando cotización (no crítico):', err);
        }
    };

    // ============================================
    // CÁLCULO DEL DESCUENTO SEGÚN EL PREMIO
    // ============================================
    const calculateDiscount = () => {
        if (!prize) return { type: 'none', label: 'Sin premio', value: 0, discountAmount: 0 };

        const prizeLabel = (prize.label || prize || '').toString().toUpperCase();
        const prizeDetail = (prize.detail || '').toString();

        // Detectar porcentaje de descuento
        const percentMatch = prizeLabel.match(/(\d+)%/);
        if (percentMatch) {
            const percent = parseInt(percentMatch[1]);
            const subtotal = calculateSubtotal();
            return {
                type: 'percentage',
                label: prize.label || prize,
                value: percent,
                discountAmount: Math.round(subtotal * percent / 100),
                description: `${percent}% de descuento aplicado`
            };
        }

        // Otros tipos de premios (no afectan el precio directamente)
        if (prizeLabel.includes('MES GRATIS') || prizeLabel.includes('FREE')) {
            return {
                type: 'bonus',
                label: prize.label || prize,
                value: 0,
                discountAmount: 0,
                description: prizeDetail || 'Beneficio adicional incluido en tu compra'
            };
        }

        if (prizeLabel.includes('KIT') || prizeLabel.includes('LECTOR') || prizeLabel.includes('SETUP')) {
            return {
                type: 'bonus',
                label: prize.label || prize,
                value: 0,
                discountAmount: 0,
                description: prizeDetail || 'Producto/servicio adicional gratis'
            };
        }

        // Default: premio sin descuento monetario
        return {
            type: 'bonus',
            label: prize.label || prize,
            value: 0,
            discountAmount: 0,
            description: prizeDetail || 'Beneficio especial incluido'
        };
    };

    const calculateSubtotal = () => {
        return (selectedProducts || []).reduce((sum, p) => sum + (parseFloat(p.price) * (p.quantity || 1)), 0);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const discount = calculateDiscount();
    const subtotal = calculateSubtotal();
    const finalTotal = subtotal - discount.discountAmount;

    // ============================================
    // GENERAR PDF CON DESCUENTO APLICADO
    // ============================================
    const handleDownloadPDF = async () => {
        try {
            const originalBtnText = document.getElementById('btn-download-pdf')?.innerHTML;
            const btn = document.getElementById('btn-download-pdf');
            if (btn) btn.innerHTML = '<span class="animate-spin mr-2">↻</span> Generando PDF...';

            const payload = {
                clientName,
                clientPhone,
                city,
                businessType,
                systemType,
                products: selectedProducts,
                prizeLabel: discount.label,
                prizeDetail: discount.description,
                discountPercent: discount.value,
                discountAmount: discount.discountAmount,
                subtotal: subtotal,
                finalTotal: finalTotal
            };

            const res = await axios.post(`${API_URL}/pdf/generate`, payload, {
                responseType: 'arraybuffer'
            });

            const contentType = res.headers['content-type'];

            if (contentType && contentType.includes('application/json')) {
                // If Vercel blocked PDF Puppeteer generation, we get a JSON fallback
                const text = new TextDecoder().decode(res.data);
                const json = JSON.parse(text);

                if (json.html) {
                    const win = window.open('', '_blank');
                    win.document.write(json.html);
                    win.document.close();
                    setTimeout(() => {
                        win.print();
                    }, 800);
                } else {
                    alert('Error al generar PDF: ' + json.error);
                }
            } else {
                // Happy path: We received a PDF blob
                const blob = new Blob([res.data], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Cotizacion_Discovery_${(clientName || 'Cliente').replace(/\\s+/g, '_')}_${Date.now()}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            }

            setPdfGenerated(true);
            if (btn) btn.innerHTML = originalBtnText;

        } catch (error) {
            console.error("Error generando PDF:", error);
            const btn = document.getElementById('btn-download-pdf');
            if (btn) btn.innerHTML = '<span class="mr-2">❌</span> Error. Intenta de nuevo';
            alert("Hubo un error generando el PDF. Por favor intenta nuevamente.");
        }
    };

    // ============================================
    // WHATSAPP
    // ============================================
    const handleWhatsAppContact = () => {
        const productList = (selectedProducts || []).map(p =>
            `• ${p.quantity || 1}x ${p.name} — ${formatCurrency(parseFloat(p.price) * (p.quantity || 1))}`
        ).join('\n');

        const message = encodeURIComponent(
            `¡Hola! Soy *${clientName || 'un cliente interesado'}* y acabo de generar mi cotización en Discovery Systems.\n\n` +
            `📋 *Mi cotización:*\n${productList}\n\n` +
            `💰 *Subtotal:* ${formatCurrency(subtotal)}\n` +
            (discount.discountAmount > 0 ? `🎁 *Premio:* ${discount.label} (-${formatCurrency(discount.discountAmount)})\n` : `🎁 *Premio:* ${discount.label}\n`) +
            `✅ *Total Final:* ${formatCurrency(finalTotal)}\n\n` +
            `Me gustaría hablar con un asesor para continuar.`
        );
        window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
    };

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className="p-4 md:p-6 animate-fade-in-up max-w-3xl mx-auto pb-12">
            {/* 🎉 Prize Banner */}
            <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-6 md:p-8 mb-6 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-30"></div>
                <div className="relative z-10">
                    <div className="text-5xl md:text-6xl mb-3">🎉</div>
                    <h1 className="text-2xl md:text-3xl font-black text-white mb-2">
                        ¡Felicidades{clientName ? `, ${clientName}` : ''}!
                    </h1>
                    <p className="text-white/80 text-sm mb-3">Tu premio ha sido aplicado a la cotización</p>
                    <div className="inline-block bg-white/95 backdrop-blur-sm text-orange-600 text-xl md:text-2xl font-black py-2 px-6 rounded-xl shadow-lg">
                        🎁 {discount.label}
                    </div>
                    {discount.description && (
                        <p className="text-white/90 text-sm mt-3 font-medium">{discount.description}</p>
                    )}
                </div>
            </div>

            {/* 📋 Quotation Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                <FaCheckCircle /> Cotización Final
                            </h3>
                            <p className="text-blue-200 text-sm">
                                {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                        <div className="text-white text-3xl">🚀</div>
                    </div>
                </div>

                {/* Product List */}
                <div className="divide-y divide-gray-100">
                    {(selectedProducts || []).map((product, index) => (
                        <div key={product.id || index} className="flex items-center gap-3 px-4 md:px-6 py-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 border text-xl">
                                {product.image_url && (product.image_url.startsWith('http') || product.image_url.startsWith('/'))
                                    ? <img src={product.image_url} alt="" className="w-full h-full object-contain p-1 rounded-lg" />
                                    : (product.image_url || '📦')
                                }
                            </div>
                            <div className="flex-grow min-w-0">
                                <h4 className="font-medium text-gray-800 text-sm truncate">{product.name}</h4>
                                <span className="text-[10px] text-gray-400 uppercase">{product.category}</span>
                            </div>
                            <div className="text-center flex-shrink-0 min-w-[30px]">
                                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                                    x{product.quantity || 1}
                                </span>
                            </div>
                            <div className="text-right min-w-[100px]">
                                <p className="font-bold text-gray-800 text-sm">
                                    {formatCurrency(parseFloat(product.price) * (product.quantity || 1))}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Totals */}
                <div className="bg-gray-50 px-6 py-5 space-y-3 border-t-2 border-gray-100">
                    {/* Subtotal */}
                    <div className="flex items-center justify-between text-gray-600">
                        <span className="font-medium">Subtotal</span>
                        <span className="font-semibold">{formatCurrency(subtotal)}</span>
                    </div>

                    {/* Prize/Discount */}
                    {discount.discountAmount > 0 ? (
                        <div className="flex items-center justify-between bg-green-50 -mx-6 px-6 py-3 border-y border-green-100">
                            <span className="font-semibold text-green-700 flex items-center gap-2">
                                <FaGift className="text-yellow-500" /> {discount.label}
                            </span>
                            <span className="font-bold text-green-600 text-lg">
                                - {formatCurrency(discount.discountAmount)}
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between bg-green-50 -mx-6 px-6 py-3 border-y border-green-100">
                            <span className="font-semibold text-green-700 flex items-center gap-2">
                                <FaGift className="text-yellow-500" /> {discount.label}
                            </span>
                            <span className="font-bold text-green-600">
                                ✅ Incluido
                            </span>
                        </div>
                    )}

                    {/* Final Total */}
                    <div className="flex items-center justify-between pt-2 border-t-2 border-blue-200">
                        <span className="text-lg font-bold text-gray-800">TOTAL FINAL</span>
                        <div className="text-right">
                            {discount.discountAmount > 0 && (
                                <span className="text-sm text-gray-400 line-through block">
                                    {formatCurrency(subtotal)}
                                </span>
                            )}
                            <span className="text-2xl md:text-3xl font-black text-blue-600">
                                {formatCurrency(finalTotal)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🎯 Action Buttons */}
            <div className="space-y-3 mb-6">
                {/* WhatsApp - Primary CTA */}
                <button
                    onClick={handleWhatsAppContact}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white text-lg font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-[0.98] flex items-center justify-center gap-3 relative overflow-hidden group"
                >
                    <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></span>
                    <FaWhatsapp className="text-2xl" />
                    <span>Hablar con {advisorName}</span>
                    <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                        RECOMENDADO
                    </span>
                </button>

                {/* Download PDF */}
                <button
                    id="btn-download-pdf"
                    onClick={handleDownloadPDF}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all active:scale-[0.99] flex items-center justify-center gap-3"
                >
                    <FaFilePdf className="text-xl" />
                    <span>{pdfGenerated ? '✅ Descargar de Nuevo' : 'Descargar Cotización PDF'}</span>
                </button>

                {/* Go to Client Portal (Checkout / Review) */}
                {quoteId && (
                    <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-xl mt-4 text-center animate-fade-in">
                        <div className="w-12 h-12 bg-indigo-200 text-indigo-600 rounded-full flex items-center justify-center text-xl mx-auto mb-3">
                            <FaCheckCircle />
                        </div>
                        <h4 className="text-indigo-900 font-bold text-lg mb-2">¡Tu cotización está guardada! 🚀</h4>
                        <p className="text-sm text-indigo-700 mb-5 leading-relaxed">
                            Tienes un <strong>acceso seguro y temporal</strong> a tu panel. Desde allí podrás dar seguimiento a tu pedido, modificar o agregar servicios, subir documentos y chatear directamente con nosotros.
                        </p>
                        <button
                            onClick={() => window.location.href = `/#/portal/${quoteId}`}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-bold py-4 px-6 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                        >
                            <FaUserCheck className="text-2xl" />
                            <span>Dar seguimiento a mi propuesta</span>
                        </button>
                    </div>
                )}
            </div>


            {/* ⏰ Urgency Banner */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-orange-400 p-4 rounded-r-xl">
                <div className="flex items-start gap-3">
                    <span className="text-2xl">⚡</span>
                    <div>
                        <p className="font-bold text-gray-800 text-sm mb-1">
                            Oferta válida por 48 horas
                        </p>
                        <p className="text-xs text-gray-600">
                            Tu premio "{discount.label}" está reservado. Contacta a un asesor para asegurar tu descuento.
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 text-gray-400 text-xs space-y-1">
                <p>{companyConfig?.name || 'Discovery Systems POS'} © {new Date().getFullYear()} | {companyConfig?.slogan || 'Soluciones Tecnológicas POS'}</p>
                <p>Contacto: +57 {companyConfig?.phone || '320 579 2169'} | {companyConfig?.website || 'www.discoverysystems.com'}</p>
                {quoteId && <p className="text-gray-300">Ref: COT-{String(quoteId).padStart(4, '0')}</p>}
            </div>
        </div>
    );
};

export default QuoteFinal;
