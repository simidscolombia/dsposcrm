import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    FaWhatsapp, FaFilePdf, FaCheckCircle, FaGift,
    FaCalendarAlt, FaPlay, FaUserCheck, FaCopy,
    FaFileAlt, FaCheck, FaBuilding, FaArrowRight
} from 'react-icons/fa';

const API_URL = '/api';

const QuoteFinal = ({ selectedProducts, prize, clientName, clientPhone, city, businessType, systemType }) => {
    const [quoteSaved, setQuoteSaved] = useState(false);
    const [quoteId, setQuoteId] = useState(null);
    const [whatsappNumber, setWhatsappNumber] = useState('573205792169');
    const [advisorName, setAdvisorName] = useState('un asesor');
    const [companyConfig, setCompanyConfig] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [localName, setLocalName] = useState(clientName || '');
    const [localPhone, setLocalPhone] = useState(clientPhone || '');

    // Helper to sanitize corrupted data
    const sanitizeText = (text, maxLength = 100) => {
        if (!text || typeof text !== 'string') return text;
        if (text.length > maxLength) return text.substring(0, Math.min(text.length, 50)) + '...';
        return text;
    };

    useEffect(() => {
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
                console.log('Config fetch failed:', e);
            }
        };
        fetchConfig();
    }, [city]);

    // ============================================
    // CALCULATIONS
    // ============================================
    const calculateSubtotal = () => {
        return (selectedProducts || []).reduce((sum, p) => sum + (parseFloat(p.price) * (p.quantity || 1)), 0);
    };

    const calculateDiscount = () => {
        if (!prize) return { type: 'none', label: 'Sin premio', value: 0, discountAmount: 0 };
        const label = (prize.label || prize || '').toString().toUpperCase();
        const subtotal = calculateSubtotal();
        const percentMatch = label.match(/(\d+)%/);

        if (percentMatch) {
            const percent = parseInt(percentMatch[1]);
            return {
                type: 'percentage',
                label: prize.label || prize,
                value: percent,
                discountAmount: Math.round(subtotal * percent / 100),
                description: `${percent}% de descuento aplicado`
            };
        }
        return {
            type: 'bonus',
            label: prize.label || prize,
            value: 0,
            discountAmount: 0,
            description: prize.detail || 'Beneficio especial incluido'
        };
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency', currency: 'COP', maximumFractionDigits: 0
        }).format(val || 0);
    };

    const disc = calculateDiscount();
    const subtotal = calculateSubtotal();
    const finalTotal = subtotal - disc.discountAmount;

    // ============================================
    // ACTIONS
    // ============================================
    const saveQuoteAndContinue = async () => {
        if (!localName.trim() || !localPhone.trim()) {
            alert('Por favor ingresa tu nombre y WhatsApp para guardar tu cotización.');
            return;
        }
        setIsSaving(true);
        try {
            const response = await axios.post(`${API_URL}/quotes`, {
                clientName: localName,
                clientPhone: localPhone,
                city: city || null,
                businessType: businessType || null,
                systemType: systemType || null,
                source: 'web',
                products: (selectedProducts || []).map(p => ({
                    id: p.id,
                    name: String(p.name || p.product_name || 'Articulo'),
                    category: String(p.category || p.category_name || 'General'),
                    price: parseFloat(p.price || 0),
                    quantity: parseInt(p.quantity || 1)
                })),
                prizeLabel: disc.label || null,
                prizeDetail: disc.description || null,
                discountPercent: disc.value || 0,
                discountAmount: disc.discountAmount || 0,
                subtotal: subtotal,
                finalTotal: finalTotal
            });

            if (response.data?.success) {
                const newQuoteId = response.data.data?.quote_id;
                // Redirect immediately to portal
                window.location.href = `/#/portal/${newQuoteId}`;
            }
        } catch (err) {
            console.error('Error saving quote:', err);
            alert('Error al procesar. Intenta de nuevo.');
            setIsSaving(false);
        }
    };

    const handleDownloadPDF = async () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFillColor(28, 36, 46);
        doc.rect(0, 0, pageWidth, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("DISCOVERY SYSTEMS", pageWidth / 2, 20, { align: "center" });

        doc.setTextColor(60, 60, 60);
        doc.setFontSize(10);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 15, 45);
        doc.text(`Cliente: ${localName}`, 15, 52);
        doc.text(`Propuesta: #${String(Date.now()).slice(-6)}`, pageWidth - 15, 45, { align: "right" });

        const tableData = (selectedProducts || []).map(p => [
            p.name, p.quantity || 1, formatCurrency(p.price), formatCurrency(p.price * (p.quantity || 1))
        ]);

        autoTable(doc, {
            startY: 65,
            head: [['Descripción', 'Cant', 'V. Unit', 'Subtotal']],
            body: tableData,
            headStyles: { fillColor: [28, 36, 46] },
            styles: { fontSize: 9 }
        });

        const finalY = doc.lastAutoTable.finalY + 10;
        doc.text(`Subtotal: ${formatCurrency(subtotal)}`, pageWidth - 15, finalY, { align: "right" });
        doc.setTextColor(220, 38, 38);
        doc.text(`Premio (${disc.label}): -${formatCurrency(disc.discountAmount)}`, pageWidth - 15, finalY + 7, { align: "right" });
        doc.setTextColor(28, 36, 46);
        doc.setFontSize(14);
        doc.text(`TOTAL FINAL: ${formatCurrency(finalTotal)}`, pageWidth - 15, finalY + 18, { align: "right" });

        doc.save(`Cotizacion_Discovery_${localName}.pdf`);
    };

    const handleWhatsApp = () => {
        const text = encodeURIComponent(
            `¡Hola! Soy *${localName}* y generé mi cotización.\n` +
            `✅ Total: *${formatCurrency(finalTotal)}*\n` +
            `🎁 Premio: *${disc.label}*\n` +
            `Me gustaría hablar con ${advisorName} para coordinar el pedido.`
        );
        window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');
    };

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className="p-4 md:p-8 animate-fade-in-up max-w-4xl mx-auto pb-24">

            {/* 🏆 CONGRATS BANNER */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-[2.5rem] p-8 md:p-12 mb-10 text-center shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                {/* Floating particles (CSS) */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                    <div className="absolute top-1/4 left-10 w-4 h-4 bg-yellow-400 rounded-full animate-pulse opacity-40"></div>
                    <div className="absolute bottom-1/4 right-10 w-6 h-6 bg-blue-400 rounded-full animate-bounce opacity-30"></div>
                </div>

                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-4 border border-white/10">
                        <FaGift className="animate-bounce" /> Beneficio Activado Correctamente
                    </div>
                    <h1 className="text-2xl md:text-5xl font-black text-white mb-4 tracking-tight">
                        ¡Felicidades, {localName.split(' ')[0]}! 🎉
                    </h1>
                    <p className="text-blue-100/80 text-sm md:text-lg mb-8 max-w-xl mx-auto font-medium">
                        Tu premio exclusivo ha sido aplicado al total de tu cotización. ¡Estás a un paso de revolucionar tu negocio!
                    </p>
                    <div className="inline-flex flex-col md:flex-row items-center gap-4">
                        <div className="bg-white text-blue-700 text-lg md:text-2xl font-black px-8 py-3 md:px-10 md:py-4 rounded-2xl md:rounded-3xl shadow-2xl transform transition-transform hover:scale-105">
                            🎁 {disc.label}
                        </div>
                    </div>
                </div>
            </div>

            {/* 📄 FINAL DOCUMENT (PREMIUM PAPER) */}
            <div className="bg-white rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden relative">

                {/* Header Formal */}
                <div className="bg-[#1c242e] p-6 md:p-10 flex flex-col md:flex-row justify-between items-center gap-6 border-b-4 border-blue-600">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-2xl flex items-center justify-center p-2 md:p-3">
                            <img src="/logo.png" alt="Discovery" className="w-full h-full object-contain" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-white font-black text-lg md:text-xl tracking-tight uppercase">Discovery Systems</h3>
                            <p className="text-blue-300 text-[9px] md:text-xs font-bold tracking-widest uppercase opacity-80">Cotización Final Confirmada</p>
                        </div>
                    </div>
                    <div className="text-right hidden md:block">
                        <p className="text-gray-400 text-[10px] uppercase font-black tracking-widest mb-1">ID de Sesión</p>
                        <p className="text-white font-mono text-base">#CONF-{String(Date.now()).slice(-6)}</p>
                    </div>
                </div>

                {/* Table Breakdown */}
                <div className="p-0 overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-left border-b border-gray-100">
                                <th className="px-6 md:px-12 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Detalle de Inversión</th>
                                <th className="px-4 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Cant</th>
                                <th className="px-6 md:px-12 py-4 md:py-5 text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {selectedProducts.map((p, idx) => (
                                <tr key={idx}>
                                    <td className="px-6 md:px-12 py-4 md:py-5">
                                        <h4 className="font-bold text-gray-800 text-sm whitespace-pre-wrap">{p.name || p.product_name || 'Artículo'}</h4>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{p.category || p.category_name || 'General'}</p>
                                    </td>
                                    <td className="px-4 py-4 md:py-5 text-center font-bold text-blue-600 text-sm">x{p.quantity || 1}</td>
                                    <td className="px-6 md:px-12 py-4 md:py-5 text-right font-bold text-gray-900 text-sm md:text-base">{formatCurrency(p.price * (p.quantity || 1))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Financial Summary */}
                <div className="bg-gray-50/50 p-8 md:p-12 border-t border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                    <div className="flex-1 space-y-4">
                        <div className="bg-green-50 border border-green-100 p-5 rounded-2xl flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-xl shadow-lg shadow-green-200">
                                <FaGift />
                            </div>
                            <div>
                                <h4 className="font-black text-green-800 text-sm">Premio Aplicado</h4>
                                <p className="text-green-600 text-xs font-bold leading-tight">{disc.label}</p>
                                {disc.discountAmount > 0 && (
                                    <p className="text-green-500 font-black text-lg mt-1 italic">
                                        - {formatCurrency(disc.discountAmount)} de ahorro directo
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                            <FaCalendarAlt /> Oferta válida por las próximas 48 horas
                        </div>
                    </div>

                    <div className="w-full md:w-[320px] bg-white p-6 rounded-3xl shadow-xl border border-blue-50">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor Comercial</span>
                            <span className="text-gray-400 font-bold line-through text-sm">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t-2 border-dashed border-gray-100">
                            <div>
                                <span className="text-xs font-black text-gray-900 uppercase">Total Final</span>
                                <p className="text-[9px] text-blue-600 font-black uppercase">Neto a Pagar</p>
                            </div>
                            <span className="text-2xl md:text-3xl font-black text-blue-600 tabular-nums">
                                {formatCurrency(finalTotal)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ACTION: SAVE & CONTINUE */}
                {!quoteId && (
                    <div className="p-8 md:p-12 border-t border-gray-100 bg-white">
                        <div className="max-w-md mx-auto space-y-6">
                            <div className="text-center space-y-2">
                                <h3 className="font-black text-xl text-gray-900 flex items-center justify-center gap-2">
                                    ¿Cómo recibes tu factura?
                                </h3>
                                <p className="text-gray-500 text-sm font-medium">Para enviarte la copia digital y el obsequio a tu WhatsApp, confirma tus datos:</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Tu Nombre / Empresa</label>
                                    <input
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-500 transition-all font-bold text-gray-800"
                                        placeholder="Laura Ramírez / Restaurante El Solar"
                                        value={localName}
                                        onChange={(e) => setLocalName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">WhatsApp de Contacto</label>
                                    <input
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-500 transition-all font-bold text-gray-800"
                                        placeholder="Ej: 320 579 2169"
                                        value={localPhone}
                                        onChange={(e) => setLocalPhone(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={saveQuoteAndContinue}
                                disabled={isSaving}
                                className="w-full bg-blue-600 text-white text-base md:text-lg font-black py-4 md:py-5 px-6 md:px-10 rounded-2xl shadow-2xl shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-4 relative overflow-hidden group active:scale-95 disabled:opacity-50"
                            >
                                {isSaving ? 'Guardando...' : (
                                    <>Ver Mi Cotización Oficial <FaArrowRight /></>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Formal Footer */}
                <div className="bg-gray-50 px-10 py-5 text-center">
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.3em]">Discovery Systems POS — Calidad & Tecnología Superior</p>
                </div>
            </div>

            {/* BUTTONS BAR (ONLY AFTER SAVING OR OPTIONAL) */}
            {quoteSaved && (
                <div className="mt-10 flex flex-wrap justify-center gap-4 animate-fade-in">
                    <button
                        onClick={handleDownloadPDF}
                        className="px-8 py-4 bg-white border-2 border-red-100 text-red-600 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:bg-red-50 transition-all shadow-lg"
                    >
                        <FaFilePdf size={20} /> Descargar PDF
                    </button>
                    <button
                        onClick={handleWhatsApp}
                        className="px-8 py-4 bg-[#25D366] text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:bg-[#128C7E] transition-all shadow-lg shadow-green-200"
                    >
                        <FaWhatsapp size={20} /> Hablar con un Humano
                    </button>
                </div>
            )}
        </div>
    );
};

export default QuoteFinal;
