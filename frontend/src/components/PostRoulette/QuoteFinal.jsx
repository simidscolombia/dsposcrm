import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
    const [isSaving, setIsSaving] = useState(false);
    const [localName, setLocalName] = useState(clientName || '');
    const [localPhone, setLocalPhone] = useState(clientPhone || '');

    // Helper to sanitize corrupted data (long hashes/base64)
    const sanitizeText = (text, maxLength = 100) => {
        if (!text || typeof text !== 'string') return text;
        if (text.length > maxLength) return text.substring(0, Math.min(text.length, 50)) + '...';
        return text;
    };

    const renderImage = (img, size = 'sm') => {
        const isUrl = img && (typeof img === 'string') && (img.startsWith('http') || img.startsWith('/') || img.startsWith('data:image'));
        const sizeClasses = size === 'sm' ? 'w-10 h-10' : 'w-14 h-14';

        return (
            <div className={`${sizeClasses} rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-100 overflow-hidden shadow-inner`}>
                {isUrl ? (
                    <img
                        src={img}
                        alt="Product"
                        className="w-full h-full object-contain p-1"
                        onError={(e) => { e.target.src = ''; e.target.parentElement.innerHTML = '<span class="text-xl">📦</span>'; }}
                    />
                ) : (
                    <span className={size === 'sm' ? 'text-xl' : 'text-3xl'}>📦</span>
                )}
            </div>
        );
    };

    // ============================================
    // FETCH CONFIG ON MOUNT
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
        fetchConfig();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ============================================
    // SAVE QUOTE TO DATABASE
    // ============================================
    const saveQuoteAndContinue = async () => {
        if (!localName.trim() || !localPhone.trim()) {
            alert('Por favor ingresa tu nombre y WhatsApp para poder enviarte los datos y la factura a tu número.');
            return;
        }
        setIsSaving(true);
        try {
            const discount = calculateDiscount();
            const sub = calculateSubtotal();
            const final_total = sub - discount.discountAmount;

            const response = await axios.post(`${API_URL}/quotes`, {
                clientName: localName,
                clientPhone: localPhone,
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
                const newQuoteId = response.data.data?.quote_id;
                setQuoteSaved(true);
                setQuoteId(newQuoteId);
                // Redirect immediately to portal
                window.location.href = `/#/portal/${newQuoteId}`;
            }
        } catch (err) {
            console.error('Error guardando cotización:', err);
            alert('Hubo un error al guardar. Por favor, intenta de nuevo.');
            setIsSaving(false);
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
    // ============================================
    const handleDownloadPDF = async () => {
        try {
            const btn = document.getElementById('btn-download-pdf');
            const originalBtnText = btn?.innerHTML;
            if (btn) btn.innerHTML = '<span class="animate-spin mr-2">↻</span> Generando PDF...';

            // 1. Crear documento PDF
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            let yPos = 20;

            // Header - Logo y Empresa
            doc.setFillColor(43, 108, 176); // Azul Discovery
            doc.rect(0, 0, pageWidth, 25, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("DISCOVERY SYSTEMS", pageWidth / 2, 17, { align: "center" });

            // Info del Cliente y Fecha
            yPos = 40;
            doc.setTextColor(40, 40, 40);
            doc.setFontSize(10);
            const today = new Date();
            const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

            doc.text(`Fecha: ${dateStr}`, 15, yPos);
            doc.text(`Cliente: ${clientName || 'N/A'}`, 15, yPos + 7);
            doc.text(`Teléfono: ${clientPhone || 'N/A'}`, 15, yPos + 14);
            doc.text(`Ciudad: ${city || 'N/A'}`, 15, yPos + 21);

            // Validez y Asesor
            doc.setFont("helvetica", "bold");
            doc.text("PROPUESTA ECONÓMICA FORMAL", pageWidth - 15, yPos, { align: "right" });
            doc.setFont("helvetica", "normal");
            doc.text(`Doc Ref: #${String(Date.now()).slice(-6)}`, pageWidth - 15, yPos + 7, { align: "right" });
            doc.text(`Válida por: 10 Días`, pageWidth - 15, yPos + 14, { align: "right" });
            doc.text(`Asesor: ${advisorName || 'Comercial'}`, pageWidth - 15, yPos + 21, { align: "right" });

            yPos += 35;

            // Preparar items para la tabla
            const tableData = (selectedProducts || []).map(p => [
                p.name,
                p.quantity?.toString() || '1',
                formatCurrency(p.price),
                formatCurrency((p.price || 0) * (p.quantity || 1))
            ]);

            // Dibujar Tabla de Productos
            autoTable(doc, {
                startY: yPos,
                head: [['EQUIPO / SERVICIO', 'CANT.', 'V. UNITARIO', 'V. TOTAL']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [43, 108, 176], textColor: [255, 255, 255], fontStyle: 'bold' },
                columnStyles: {
                    0: { cellWidth: 80 },
                    1: { cellWidth: 20, halign: 'center' },
                    2: { cellWidth: 40, halign: 'right' },
                    3: { cellWidth: 40, halign: 'right' },
                },
                styles: { fontSize: 9 }
            });

            yPos = doc.lastAutoTable.finalY + 15;

            // Resumen Financiero
            doc.setFontSize(11);
            doc.setTextColor(40, 40, 40);

            const resumenX = pageWidth - 90;
            autoTable(doc, {
                startY: yPos,
                margin: { left: resumenX },
                body: [
                    [{ content: 'Subtotal:', styles: { fontStyle: 'bold' } }, { content: formatCurrency(subtotal), styles: { halign: 'right' } }],
                    [{ content: `Premio (${discount.label}):`, styles: { fontStyle: 'bold', textColor: [220, 38, 38] } }, { content: `-${formatCurrency(discount.discountAmount)}`, styles: { halign: 'right', textColor: [220, 38, 38] } }],
                    [{ content: 'TOTAL NETO COP:', styles: { fontStyle: 'bold', fontSize: 13, fillColor: [240, 240, 240] } }, { content: formatCurrency(finalTotal), styles: { halign: 'right', fontStyle: 'bold', fontSize: 13, fillColor: [240, 240, 240] } }]
                ],
                theme: 'plain',
                styles: { fontSize: 10 }
            });

            // Footer / Términos
            yPos = doc.lastAutoTable.finalY + 30;
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text("Términos y Condiciones:", 15, yPos);
            doc.text("1. Esta cotización está sujeta a disponibilidad de inventario.", 15, yPos + 5);
            doc.text("2. Los valores no incluyen costos de envío nacional a menos que se especifique expresamente.", 15, yPos + 10);
            doc.text("3. Soporte técnico cubierto durante los primeros 12 meses de garantía de fábrica.", 15, yPos + 15);

            doc.text("www.discovery-systems.com", pageWidth / 2, 285, { align: "center", fontStyle: "italic" });

            // Guardar o mostrar documento
            const fileName = `Cotizacion_Discovery_${(clientName || 'Cliente').replace(/\s+/g, '_')}_${Date.now()}.pdf`;

            // Si el dispositivo es movil, a veces es mejor abrirlo o guardar limpio
            doc.save(fileName);

            setPdfGenerated(true);

            if (btn) btn.innerHTML = '<span class="mr-2 text-green-500">✓</span> ¡PDF Descargado!';
            setTimeout(() => { if (btn) btn.innerHTML = originalBtnText; }, 3000);

            // Adicionalmente marcamos a nivel backend si es necesario que alguien descargó el pdf
            if (quoteId) {
                axios.post(`${API_URL}/crm/quotes/${quoteId}/logs`, {
                    action: 'PDF_DOWNLOADED',
                    details: 'Cliente generó y descargó el PDF directamente'
                }).catch(() => { });
            }

        } catch (error) {
            console.error("Error generando PDF nativo:", error);
            const btn = document.getElementById('btn-download-pdf');
            if (btn) btn.innerHTML = '<span class="mr-2">❌</span> Error PDF. Intenta de nuevo';
            alert("No se pudo generar el documento localmente. Reinicia la página.");
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
                    {(selectedProducts || []).map((product, index) => {
                        const name = sanitizeText(product.name, 120);
                        const category = sanitizeText(product.category, 50);

                        return (
                            <div key={product.id || index} className="flex items-center gap-3 px-4 md:px-6 py-3">
                                {renderImage(product.image_url, 'sm')}
                                <div className="flex-grow min-w-0 pr-4">
                                    <h4 className="font-bold text-gray-800 text-sm md:text-base truncate">
                                        {name}
                                    </h4>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{category}</span>
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
                        );
                    })}
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

            {/* 🎯 Contact Info Capture & Action Button */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 mt-6 rounded-2xl p-5 md:p-6 shadow-sm mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">✓</div>
                    <div>
                        <h3 className="font-bold text-blue-900">¿A dónde te enviamos el Obsequio y la Copia?</h3>
                        <p className="text-xs text-blue-700">Por favor confirma tus datos para procesar el envío de información.</p>
                    </div>
                </div>
                <div className="space-y-4 mb-5">
                    <div>
                        <label className="block text-xs font-bold text-blue-900 mb-1 ml-1">Tu Nombre / Empresa *</label>
                        <input
                            type="text"
                            placeholder="Ej: Laura Ramírez"
                            value={localName}
                            onChange={(e) => setLocalName(e.target.value)}
                            className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-blue-900 mb-1 ml-1">Tu WhatsApp *</label>
                        <input
                            type="tel"
                            placeholder="Ej: 300 123 4567"
                            value={localPhone}
                            onChange={(e) => setLocalPhone(e.target.value)}
                            className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                </div>

                {/* Continue to Portal */}
                <button
                    onClick={saveQuoteAndContinue}
                    disabled={isSaving}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-bold py-4 px-6 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                >
                    {isSaving ? (
                        <>
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>Procesando...</span>
                        </>
                    ) : (
                        <>
                            <span>Continuar</span>
                            <FaCheckCircle className="text-xl" />
                        </>
                    )}
                </button>
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
