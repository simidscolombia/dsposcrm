import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    FaUserPlus, FaPhone, FaFileInvoiceDollar, FaDesktop, FaHandshake,
    FaTrophy, FaTimesCircle, FaSync, FaWhatsapp, FaEye, FaFilter,
    FaChevronDown, FaChevronUp, FaClock, FaMapMarkerAlt, FaBriefcase,
    FaGift, FaDollarSign, FaArrowRight, FaSearch
} from 'react-icons/fa';

const API_URL = '/api';

const STAGES = [
    { key: 'new', label: 'Nuevos', icon: <FaUserPlus />, color: '#3B82F6', bgLight: '#EFF6FF', borderColor: '#BFDBFE' },
    { key: 'contacted', label: 'Contactados', icon: <FaPhone />, color: '#8B5CF6', bgLight: '#F5F3FF', borderColor: '#DDD6FE' },
    { key: 'quoted', label: 'Cotizados', icon: <FaFileInvoiceDollar />, color: '#F59E0B', bgLight: '#FFFBEB', borderColor: '#FDE68A' },
    { key: 'demo', label: 'Demo', icon: <FaDesktop />, color: '#EC4899', bgLight: '#FDF2F8', borderColor: '#FBCFE8' },
    { key: 'negotiating', label: 'Negociando', icon: <FaHandshake />, color: '#F97316', bgLight: '#FFF7ED', borderColor: '#FED7AA' },
    { key: 'won', label: 'Ganados', icon: <FaTrophy />, color: '#10B981', bgLight: '#ECFDF5', borderColor: '#A7F3D0' },
    { key: 'lost', label: 'Perdidos', icon: <FaTimesCircle />, color: '#EF4444', bgLight: '#FEF2F2', borderColor: '#FECACA' },
];

const formatCurrency = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
};

const timeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const d = new Date(date);
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `${diffMin}min`;
    if (diffHrs < 24) return `${diffHrs}h`;
    if (diffDays < 30) return `${diffDays}d`;
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
};

// ============================================
// LEAD CARD Component
// ============================================
const LeadCard = ({ lead, onMoveStage, onViewDetail }) => {
    const [showActions, setShowActions] = useState(false);

    return (
        <div
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-2 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
            onClick={() => onViewDetail(lead)}
        >
            {/* Header: Name + Time */}
            <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-gray-800 text-sm truncate">
                        {lead.name || 'Sin nombre'}
                    </h4>
                    {lead.business_name && (
                        <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                            <FaBriefcase className="text-[10px]" />
                            {lead.business_name}
                        </p>
                    )}
                </div>
                <span className="text-[10px] text-gray-400 flex items-center gap-0.5 flex-shrink-0 ml-1">
                    <FaClock className="text-[8px]" />
                    {timeAgo(lead.updated_at || lead.created_at)}
                </span>
            </div>

            {/* Tags: City, Business Type */}
            <div className="flex flex-wrap gap-1 mb-2">
                {lead.city && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <FaMapMarkerAlt className="text-[8px]" />
                        {lead.city}
                    </span>
                )}
                {lead.business_type && (
                    <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full">
                        {lead.business_type}
                    </span>
                )}
                {lead.system_type && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                        {lead.system_type}
                    </span>
                )}
            </div>

            {/* Quote info */}
            {lead.last_quote_amount && (
                <div className="flex items-center gap-1 mb-2">
                    <FaDollarSign className="text-green-500 text-xs" />
                    <span className="text-xs font-bold text-green-600">
                        {formatCurrency(lead.last_quote_amount)}
                    </span>
                    {lead.prize_won && (
                        <span className="text-[10px] bg-yellow-50 text-yellow-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ml-auto">
                            <FaGift className="text-[8px]" />
                            {lead.prize_won}
                        </span>
                    )}
                </div>
            )}

            {/* Advisor */}
            {lead.advisor_name && (
                <div className="flex items-center gap-1 mb-2">
                    <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 text-[8px] flex items-center justify-center font-bold">
                        {lead.advisor_name[0]}
                    </div>
                    <span className="text-[10px] text-gray-400">{lead.advisor_name}</span>
                </div>
            )}

            {/* Footer: Contact + Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <div className="flex items-center gap-1">
                    {lead.whatsapp && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const num = lead.whatsapp.replace(/\D/g, '');
                                window.open(`https://wa.me/${num.startsWith('57') ? num : '57' + num}`, '_blank');
                            }}
                            className="text-green-500 hover:text-green-600 p-1 rounded hover:bg-green-50 transition-colors"
                            title="WhatsApp"
                        >
                            <FaWhatsapp className="text-sm" />
                        </button>
                    )}
                    <span className="text-[10px] text-gray-400 truncate max-w-[80px]">
                        {lead.whatsapp || 'Sin teléfono'}
                    </span>
                </div>

                {/* Quick stage change */}
                <div className="relative">
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
                        className="text-gray-300 hover:text-blue-500 p-1 rounded hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Mover"
                    >
                        <FaArrowRight className="text-xs" />
                    </button>
                    {showActions && (
                        <div className="absolute right-0 bottom-full mb-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[140px]">
                            {STAGES.filter(s => s.key !== lead.pipeline_stage).map(stage => (
                                <button
                                    key={stage.key}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onMoveStage(lead.id, stage.key);
                                        setShowActions(false);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                    style={{ color: stage.color }}
                                >
                                    {stage.icon}
                                    <span>{stage.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ============================================
// LEAD DETAIL MODAL
// ============================================
const LeadDetailModal = ({ lead, onClose, onMoveStage }) => {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState(lead.notes || '');

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/pipeline/${lead.id}`);
                if (res.data.success) setDetail(res.data);
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        fetchDetail();
    }, [lead.id]);

    const saveNotes = async () => {
        try {
            await axios.put(`${API_URL}/api/pipeline/${lead.id}`, { notes });
        } catch (e) { console.error(e); }
    };

    const currentStage = STAGES.find(s => s.key === (lead.pipeline_stage || 'new'));

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-gray-100" style={{ borderLeftColor: currentStage?.color, borderLeftWidth: '4px' }}>
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{lead.name || 'Sin nombre'}</h2>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                {lead.city && <span className="flex items-center gap-1"><FaMapMarkerAlt className="text-xs" />{lead.city}</span>}
                                {lead.business_type && <span>• {lead.business_type}</span>}
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                    </div>
                    {/* Stage badge */}
                    <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ backgroundColor: currentStage?.color }}>
                            {currentStage?.label}
                        </span>
                        {/* Quick move buttons */}
                        <div className="flex gap-1 ml-2">
                            {STAGES.filter(s => s.key !== lead.pipeline_stage).slice(0, 3).map(s => (
                                <button
                                    key={s.key}
                                    onClick={() => onMoveStage(lead.id, s.key)}
                                    className="text-[10px] px-2 py-0.5 rounded-full border hover:opacity-80 transition-colors"
                                    style={{ color: s.color, borderColor: s.color + '40' }}
                                >
                                    → {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Contact Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">WhatsApp</p>
                            <div className="flex items-center gap-2">
                                <FaWhatsapp className="text-green-500" />
                                <span className="text-sm font-medium text-gray-700">{lead.whatsapp || '-'}</span>
                                {lead.whatsapp && (
                                    <a
                                        href={`https://wa.me/${(lead.whatsapp || '').replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full hover:bg-green-600"
                                    >
                                        Abrir
                                    </a>
                                )}
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Asesor</p>
                            <span className="text-sm font-medium text-gray-700">{lead.advisor_name || 'Sin asignar'}</span>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Sistema</p>
                            <span className="text-sm font-medium text-gray-700">{lead.system_type || '-'}</span>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Fuente</p>
                            <span className="text-sm font-medium text-gray-700">{lead.source || 'web'}</span>
                        </div>
                    </div>

                    {/* Quotes */}
                    {detail?.quotes?.length > 0 && (
                        <div>
                            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <FaFileInvoiceDollar className="text-yellow-500" /> Cotizaciones ({detail.quotes.length})
                            </h3>
                            <div className="space-y-2">
                                {detail.quotes.map(q => (
                                    <div key={q.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-blue-600">COT-{String(q.id).padStart(4, '0')}</span>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(q.created_at).toLocaleDateString('es-CO')}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-lg font-bold text-gray-800">{formatCurrency(q.final_amount || q.total_amount)}</p>
                                                {q.discount_amount > 0 && (
                                                    <p className="text-xs text-green-600 flex items-center gap-1">
                                                        <FaGift /> Premio: {q.prize_label} (-{formatCurrency(q.discount_amount)})
                                                    </p>
                                                )}
                                            </div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${q.status === 'accepted' ? 'bg-green-100 text-green-600' :
                                                    q.status === 'expired' ? 'bg-red-100 text-red-600' :
                                                        'bg-yellow-100 text-yellow-600'
                                                }`}>
                                                {q.status === 'accepted' ? 'Aceptada' : q.status === 'expired' ? 'Expirada' : q.status === 'sent' ? 'Enviada' : 'Borrador'}
                                            </span>
                                        </div>
                                        {/* Items */}
                                        {q.items && q.items.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-blue-100">
                                                {q.items.map((item, i) => (
                                                    <p key={i} className="text-[11px] text-gray-500">
                                                        {item.quantity}x {item.name} — {formatCurrency(item.subtotal)}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <h3 className="font-bold text-gray-700 mb-2">📝 Notas</h3>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            onBlur={saveNotes}
                            placeholder="Escribe notas sobre este lead..."
                            className="w-full bg-gray-50 rounded-xl p-3 border border-gray-200 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                    </div>

                    {/* Activity Timeline */}
                    {detail?.activities?.length > 0 && (
                        <div>
                            <h3 className="font-bold text-gray-700 mb-3">📅 Timeline</h3>
                            <div className="space-y-2 max-h-48 overflow-auto">
                                {detail.activities.map(act => (
                                    <div key={act.id} className="flex items-start gap-3 text-xs">
                                        <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                                        <div>
                                            <p className="text-gray-700">{act.description}</p>
                                            <p className="text-[10px] text-gray-400">
                                                {new Date(act.created_at).toLocaleString('es-CO')} • {act.performed_by}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="text-center py-4">
                            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                            <p className="text-xs text-gray-400 mt-2">Cargando detalles...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ============================================
// MAIN CRM PIPELINE Component
// ============================================
const CRMPipeline = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCity, setFilterCity] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const fetchPipeline = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (filterCity) params.append('city', filterCity);
            const res = await axios.get(`${API_URL}/api/pipeline?${params.toString()}`);
            if (res.data.success) setData(res.data);
        } catch (e) {
            console.error('Error fetching pipeline:', e);
        }
        setLoading(false);
    }, [filterCity]);

    useEffect(() => {
        fetchPipeline();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchPipeline, 30000);
        return () => clearInterval(interval);
    }, [fetchPipeline]);

    const handleMoveStage = async (leadId, newStage) => {
        try {
            await axios.put(`${API_URL}/api/pipeline/${leadId}/stage`, { stage: newStage });
            fetchPipeline();
            // Close modal if open
            if (selectedLead?.id === leadId) {
                setSelectedLead(prev => ({ ...prev, pipeline_stage: newStage }));
            }
        } catch (e) {
            console.error('Error moving lead:', e);
        }
    };

    // Filter leads by search term
    const filterLeads = (leads) => {
        if (!searchTerm) return leads;
        const term = searchTerm.toLowerCase();
        return leads.filter(l =>
            (l.name || '').toLowerCase().includes(term) ||
            (l.whatsapp || '').includes(term) ||
            (l.business_type || '').toLowerCase().includes(term) ||
            (l.city || '').toLowerCase().includes(term)
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-gray-500 mt-4">Cargando pipeline...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        🚀 Pipeline de Ventas
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {data?.total || 0} leads en total
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Buscar lead..."
                            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-48"
                        />
                    </div>
                    {/* Filter */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-xl border transition-colors ${showFilters ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    >
                        <FaFilter />
                    </button>
                    {/* Refresh */}
                    <button
                        onClick={() => { setLoading(true); fetchPipeline(); }}
                        className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                        <FaSync className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Filters Row */}
            {showFilters && (
                <div className="mb-4 p-3 bg-white rounded-xl border border-gray-200 flex items-center gap-3 animate-fade-in">
                    <span className="text-xs font-bold text-gray-500">Filtrar por ciudad:</span>
                    {['', 'Bogotá', 'Bucaramanga', 'Medellín', 'Cali'].map(c => (
                        <button
                            key={c}
                            onClick={() => setFilterCity(c)}
                            className={`text-xs px-3 py-1 rounded-full transition-colors ${filterCity === c ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {c || 'Todas'}
                        </button>
                    ))}
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-7 gap-2 mb-4">
                {STAGES.map(stage => {
                    const count = data?.summary?.[stage.key] || 0;
                    return (
                        <div
                            key={stage.key}
                            className="text-center p-2 rounded-xl border transition-all hover:shadow-sm"
                            style={{ backgroundColor: stage.bgLight, borderColor: stage.borderColor }}
                        >
                            <div className="text-2xl font-black" style={{ color: stage.color }}>{count}</div>
                            <div className="text-[10px] font-bold text-gray-500">{stage.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Kanban Board */}
            <div className="flex-1 flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '400px' }}>
                {STAGES.map(stage => {
                    const leads = filterLeads(data?.stages?.[stage.key]?.leads || []);
                    return (
                        <div
                            key={stage.key}
                            className="flex-shrink-0 w-64 flex flex-col rounded-2xl border"
                            style={{ backgroundColor: stage.bgLight + '80', borderColor: stage.borderColor }}
                        >
                            {/* Column Header */}
                            <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: stage.borderColor }}>
                                <div className="flex items-center gap-2">
                                    <span style={{ color: stage.color }}>{stage.icon}</span>
                                    <span className="font-bold text-sm" style={{ color: stage.color }}>{stage.label}</span>
                                </div>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: stage.color }}>
                                    {leads.length}
                                </span>
                            </div>

                            {/* Cards */}
                            <div className="flex-1 overflow-auto p-2 space-y-0">
                                {leads.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <p className="text-3xl mb-2">📭</p>
                                        <p className="text-xs">Sin leads</p>
                                    </div>
                                ) : (
                                    leads.map(lead => (
                                        <LeadCard
                                            key={lead.id}
                                            lead={lead}
                                            onMoveStage={handleMoveStage}
                                            onViewDetail={setSelectedLead}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Lead Detail Modal */}
            {selectedLead && (
                <LeadDetailModal
                    lead={selectedLead}
                    onClose={() => setSelectedLead(null)}
                    onMoveStage={(id, stage) => {
                        handleMoveStage(id, stage);
                    }}
                />
            )}
        </div>
    );
};

export default CRMPipeline;
