import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaHeadset, FaPlus, FaSync, FaSearch, FaFilter, FaTimes, FaExclamationTriangle,
    FaCheckCircle, FaClock, FaHourglassHalf, FaDesktop, FaBook,
    FaChevronDown, FaChevronUp, FaLightbulb, FaStar, FaArrowRight
} from 'react-icons/fa';

const API_URL = '';

const CRMSupport = () => {
    const [tickets, setTickets] = useState([]);
    const [stats, setStats] = useState(null);
    const [clients, setClients] = useState([]);
    const [advisors, setAdvisors] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [search, setSearch] = useState('');

    // Modals
    const [showNew, setShowNew] = useState(false);
    const [showDetail, setShowDetail] = useState(null);
    const [detailData, setDetailData] = useState(null);

    // New ticket form
    const [newTicket, setNewTicket] = useState({
        client_id: '', subject: '', description: '', category: 'software', priority: 'medium', assigned_to: ''
    });

    useEffect(() => { fetchTickets(); fetchOptions(); }, [filterStatus, filterPriority]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterStatus !== 'all') params.append('status', filterStatus);
            if (filterPriority !== 'all') params.append('priority', filterPriority);

            const res = await axios.get(`${API_URL}/tickets?${params.toString()}`);
            if (res.data.success) {
                setTickets(res.data.tickets);
                setStats(res.data.stats);
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOptions = async () => {
        try {
            const [clientsRes, optionsRes] = await Promise.all([
                axios.get(`${API_URL}/clients`),
                axios.get(`${API_URL}/admin/crm/options`)
            ]);
            if (clientsRes.data.success) setClients(clientsRes.data.clients || []);
            if (optionsRes.data.success) setAdvisors(optionsRes.data.advisors || []);
        } catch (e) { console.error(e); }
    };

    const createTicket = async (e) => {
        e.preventDefault();
        if (!newTicket.client_id || !newTicket.subject) {
            alert('Selecciona un cliente y escribe el asunto del ticket');
            return;
        }
        try {
            const res = await axios.post(`${API_URL}/tickets`, newTicket);
            if (res.data.success) {
                alert(`✅ Ticket #${res.data.ticket.id} creado exitosamente`);
                setShowNew(false);
                setNewTicket({ client_id: '', subject: '', description: '', category: 'software', priority: 'medium', assigned_to: '' });
                fetchTickets();
            }
        } catch (error) {
            alert(error.response?.data?.error || 'Error creando ticket');
        }
    };

    const openDetail = async (ticketId) => {
        try {
            const res = await axios.get(`${API_URL}/tickets/${ticketId}`);
            if (res.data.success) {
                setDetailData(res.data);
                setShowDetail(ticketId);
            }
        } catch (e) { console.error(e); }
    };

    const updateTicket = async (id, updates) => {
        try {
            const res = await axios.put(`${API_URL}/tickets/${id}`, updates);
            if (res.data.success) {
                fetchTickets();
                if (showDetail === id) openDetail(id);
            }
        } catch (e) {
            alert('Error actualizando ticket');
        }
    };

    const resolveTicket = async (id) => {
        const resolution = prompt('📝 Describe la solución aplicada:');
        if (!resolution) return;

        const learnChoice = window.confirm('💡 ¿Guardar esta solución en la Base de Conocimiento para futuros tickets similares?');

        await updateTicket(id, {
            status: 'resolved',
            resolution,
            resolution_learned: learnChoice,
            resolved_by: 1
        });
        alert('✅ Ticket resuelto');
    };

    const getPriorityBadge = (priority) => {
        const styles = {
            critical: 'bg-red-100 text-red-700 border-red-200',
            high: 'bg-orange-100 text-orange-700 border-orange-200',
            medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            low: 'bg-green-100 text-green-700 border-green-200'
        };
        const labels = { critical: '🔴 Crítico', high: '🟠 Alto', medium: '🟡 Medio', low: '🟢 Bajo' };
        return <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold border ${styles[priority] || styles.medium}`}>{labels[priority] || priority}</span>;
    };

    const getStatusBadge = (status) => {
        const map = {
            open: { icon: <FaExclamationTriangle className="w-3 h-3" />, label: 'Abierto', cls: 'bg-blue-100 text-blue-700' },
            in_progress: { icon: <FaHourglassHalf className="w-3 h-3" />, label: 'En Proceso', cls: 'bg-purple-100 text-purple-700' },
            waiting_client: { icon: <FaClock className="w-3 h-3" />, label: 'Esperando Cliente', cls: 'bg-yellow-100 text-yellow-700' },
            resolved: { icon: <FaCheckCircle className="w-3 h-3" />, label: 'Resuelto', cls: 'bg-green-100 text-green-700' },
            closed: { icon: <FaCheckCircle className="w-3 h-3" />, label: 'Cerrado', cls: 'bg-gray-100 text-gray-600' }
        };
        const s = map[status] || map.open;
        return <span className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1 w-fit ${s.cls}`}>{s.icon} {s.label}</span>;
    };

    const getCategoryIcon = (cat) => {
        const icons = { software: '💻', printer: '🖨️', scale: '⚖️', login: '🔑', hardware: '🔧', network: '🌐', general: '📋' };
        return icons[cat] || '📋';
    };

    const timeAgo = (date) => {
        const diff = (new Date() - new Date(date)) / 1000;
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        return `${Math.floor(diff / 86400)}d`;
    };

    const filteredTickets = tickets.filter(t =>
        !search || t.client_name?.toLowerCase().includes(search.toLowerCase()) ||
        t.subject?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FaHeadset className="w-6 h-6 text-purple-600" />
                        Centro de Soporte
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Gestión de tickets, resolución de incidentes y base de conocimiento
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchTickets} className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm">
                        <FaSync className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setShowNew(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2 font-medium text-sm shadow-lg shadow-purple-200"
                    >
                        <FaPlus className="w-3 h-3" /> Nuevo Ticket
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <p className="text-2xl font-bold text-blue-600">{stats.open_count}</p>
                        <p className="text-xs text-gray-500 mt-1">Abiertos</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <p className="text-2xl font-bold text-purple-600">{stats.in_progress_count}</p>
                        <p className="text-xs text-gray-500 mt-1">En Proceso</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <p className="text-2xl font-bold text-yellow-600">{stats.waiting_count}</p>
                        <p className="text-xs text-gray-500 mt-1">Esperando</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <p className="text-2xl font-bold text-green-600">{stats.resolved_count}</p>
                        <p className="text-xs text-gray-500 mt-1">Resueltos</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <p className="text-2xl font-bold text-red-600">{stats.critical_active}</p>
                        <p className="text-xs text-gray-500 mt-1">Críticos</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-3 items-center bg-gray-50/50">
                    <div className="relative w-full md:w-80">
                        <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text" placeholder="Buscar por cliente o asunto..."
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                            <option value="all">Todos los Estados</option>
                            <option value="open">Abiertos</option>
                            <option value="in_progress">En Proceso</option>
                            <option value="waiting_client">Esperando Cliente</option>
                            <option value="resolved">Resueltos</option>
                            <option value="closed">Cerrados</option>
                        </select>
                        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                            <option value="all">Todas las Prioridades</option>
                            <option value="critical">🔴 Crítico</option>
                            <option value="high">🟠 Alto</option>
                            <option value="medium">🟡 Medio</option>
                            <option value="low">🟢 Bajo</option>
                        </select>
                    </div>
                </div>

                {/* Ticket List */}
                <div className="divide-y divide-gray-50">
                    {loading && tickets.length === 0 ? (
                        <div className="px-6 py-12 text-center text-gray-500">Cargando tickets...</div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="px-6 py-12 text-center text-gray-400">
                            <FaHeadset className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No hay tickets</p>
                            <p className="text-sm">Los tickets de soporte aparecerán aquí</p>
                        </div>
                    ) : (
                        filteredTickets.map(ticket => (
                            <div key={ticket.id}
                                className="px-4 md:px-6 py-4 hover:bg-purple-50/30 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center gap-3"
                                onClick={() => openDetail(ticket.id)}
                            >
                                {/* Info principal */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-gray-400 text-xs font-mono">#{ticket.id}</span>
                                        {getPriorityBadge(ticket.priority)}
                                        {getStatusBadge(ticket.status)}
                                    </div>
                                    <p className="font-semibold text-gray-800 truncate">
                                        {getCategoryIcon(ticket.category)} {ticket.subject}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-0.5 truncate">
                                        {ticket.client_name || 'Sin cliente'} {ticket.client_whatsapp && `• ${ticket.client_whatsapp}`}
                                    </p>
                                </div>

                                {/* Metadata derecha */}
                                <div className="flex items-center gap-4 text-xs text-gray-400 shrink-0">
                                    {ticket.assigned_name && (
                                        <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">👤 {ticket.assigned_name}</span>
                                    )}
                                    {ticket.anydesk_session && (
                                        <span className="bg-blue-50 px-2 py-1 rounded text-blue-600"><FaDesktop className="w-3 h-3 inline" /> AnyDesk</span>
                                    )}
                                    <span>{timeAgo(ticket.created_at)}</span>
                                    <FaArrowRight className="w-3 h-3 text-gray-300" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ==================== MODAL: Nuevo Ticket ==================== */}
            {showNew && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
                    <form onSubmit={createTicket} onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in-up overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <FaPlus /> Nuevo Ticket de Soporte
                            </h2>
                            <button type="button" onClick={() => setShowNew(false)} className="text-white/70 hover:text-white">
                                <FaTimes className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Cliente *</label>
                                <select required value={newTicket.client_id}
                                    onChange={(e) => setNewTicket(p => ({ ...p, client_id: e.target.value }))}
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm">
                                    <option value="">Seleccionar cliente...</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.business_name} — {c.city}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
                                    <select value={newTicket.category}
                                        onChange={(e) => setNewTicket(p => ({ ...p, category: e.target.value }))}
                                        className="w-full p-2 border border-gray-200 rounded-lg text-sm">
                                        <option value="software">💻 Software</option>
                                        <option value="printer">🖨️ Impresora</option>
                                        <option value="scale">⚖️ Báscula</option>
                                        <option value="login">🔑 Login/Acceso</option>
                                        <option value="hardware">🔧 Hardware</option>
                                        <option value="network">🌐 Red/Internet</option>
                                        <option value="general">📋 General</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Prioridad</label>
                                    <select value={newTicket.priority}
                                        onChange={(e) => setNewTicket(p => ({ ...p, priority: e.target.value }))}
                                        className="w-full p-2 border border-gray-200 rounded-lg text-sm">
                                        <option value="low">🟢 Baja</option>
                                        <option value="medium">🟡 Media</option>
                                        <option value="high">🟠 Alta</option>
                                        <option value="critical">🔴 Crítica</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Asunto *</label>
                                <input required type="text" value={newTicket.subject}
                                    onChange={(e) => setNewTicket(p => ({ ...p, subject: e.target.value }))}
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                                    placeholder="Ej: El sistema no abre, sale error 502" />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Descripción (detalles)</label>
                                <textarea rows={3} value={newTicket.description}
                                    onChange={(e) => setNewTicket(p => ({ ...p, description: e.target.value }))}
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm resize-none"
                                    placeholder="Describe el problema con más detalle..." />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Asignar a (opcional)</label>
                                <select value={newTicket.assigned_to}
                                    onChange={(e) => setNewTicket(p => ({ ...p, assigned_to: e.target.value }))}
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm">
                                    <option value="">Sin asignar</option>
                                    {advisors.filter(a => a.role === 'support' || a.role === 'admin').map(a =>
                                        <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                                    )}
                                </select>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                            <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg text-sm">Cancelar</button>
                            <button type="submit" className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 text-sm shadow">Crear Ticket</button>
                        </div>
                    </form>
                </div>
            )}

            {/* ==================== MODAL: Detalle de Ticket ==================== */}
            {showDetail && detailData && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDetail(null)}>
                    <div onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-fade-in-up overflow-hidden max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gradient-to-r from-purple-600 to-indigo-600 text-white shrink-0">
                            <div>
                                <p className="text-white/70 text-xs font-mono">Ticket #{detailData.ticket.id}</p>
                                <h2 className="text-lg font-bold mt-1">{getCategoryIcon(detailData.ticket.category)} {detailData.ticket.subject}</h2>
                                <p className="text-white/70 text-sm mt-0.5">{detailData.ticket.client_name}</p>
                            </div>
                            <button onClick={() => setShowDetail(null)} className="text-white/70 hover:text-white">
                                <FaTimes className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body scrollable */}
                        <div className="p-5 space-y-5 overflow-y-auto flex-1">
                            {/* Status row */}
                            <div className="flex flex-wrap gap-2 items-center">
                                {getStatusBadge(detailData.ticket.status)}
                                {getPriorityBadge(detailData.ticket.priority)}
                                {detailData.ticket.assigned_name && (
                                    <span className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600">👤 {detailData.ticket.assigned_name}</span>
                                )}
                                <span className="text-xs text-gray-400 ml-auto">
                                    Creado: {new Date(detailData.ticket.created_at).toLocaleString('es-CO')}
                                </span>
                            </div>

                            {/* Description */}
                            {detailData.ticket.description && (
                                <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 whitespace-pre-wrap">
                                    {detailData.ticket.description}
                                </div>
                            )}

                            {/* Client quick info */}
                            <div className="bg-blue-50 p-3 rounded-xl text-sm grid grid-cols-2 gap-2">
                                <div><strong className="text-blue-700">WhatsApp:</strong> {detailData.ticket.client_whatsapp || 'N/A'}</div>
                                <div><strong className="text-blue-700">Plan:</strong> {detailData.ticket.client_plan || 'N/A'}</div>
                                <div><strong className="text-blue-700">AnyDesk:</strong> {detailData.ticket.client_anydesk || 'No configurado'}</div>
                                <div><strong className="text-blue-700">URL Nube:</strong> {detailData.ticket.client_cloud_url || 'N/A'}</div>
                            </div>

                            {/* Resolution (if resolved) */}
                            {detailData.ticket.resolution && (
                                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                    <p className="text-xs font-bold text-green-700 mb-1 flex items-center gap-1"><FaCheckCircle /> Solución aplicada:</p>
                                    <p className="text-sm text-green-800 whitespace-pre-wrap">{detailData.ticket.resolution}</p>
                                    {detailData.ticket.resolved_by_name && (
                                        <p className="text-xs text-green-600 mt-2">Resuelto por: {detailData.ticket.resolved_by_name}</p>
                                    )}
                                </div>
                            )}

                            {/* Knowledge suggestions */}
                            {detailData.suggestions && detailData.suggestions.length > 0 && (
                                <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                                    <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1"><FaLightbulb /> Sugerencias de la Base de Conocimiento:</p>
                                    {detailData.suggestions.map(s => (
                                        <div key={s.id} className="mb-2 p-2 bg-white rounded-lg border border-amber-100 text-sm">
                                            <p className="font-medium text-gray-800">{s.question}</p>
                                            <p className="text-gray-600 text-xs mt-1 whitespace-pre-wrap">{s.answer}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Satisfaction (if resolved) */}
                            {detailData.ticket.status === 'resolved' && detailData.ticket.satisfaction_rating && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-500">Satisfacción:</span>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <FaStar key={i} className={`w-4 h-4 ${i <= detailData.ticket.satisfaction_rating ? 'text-yellow-400' : 'text-gray-200'}`} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Actions footer */}
                        <div className="p-4 border-t border-gray-100 flex flex-wrap gap-2 justify-end bg-gray-50 shrink-0">
                            {detailData.ticket.status === 'open' && (
                                <button onClick={() => updateTicket(showDetail, { status: 'in_progress' })}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition">
                                    Tomar Ticket
                                </button>
                            )}
                            {(detailData.ticket.status === 'in_progress' || detailData.ticket.status === 'open') && (
                                <>
                                    <button onClick={() => updateTicket(showDetail, { status: 'waiting_client' })}
                                        className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-200 transition">
                                        Esperando Cliente
                                    </button>
                                    <button onClick={() => resolveTicket(showDetail)}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition">
                                        ✅ Resolver
                                    </button>
                                </>
                            )}
                            {detailData.ticket.status === 'waiting_client' && (
                                <>
                                    <button onClick={() => updateTicket(showDetail, { status: 'in_progress' })}
                                        className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition">
                                        Retomar
                                    </button>
                                    <button onClick={() => resolveTicket(showDetail)}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition">
                                        ✅ Resolver
                                    </button>
                                </>
                            )}
                            {detailData.ticket.status === 'resolved' && (
                                <button onClick={() => updateTicket(showDetail, { status: 'closed' })}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition">
                                    Cerrar Ticket
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CRMSupport;
