import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    FaUsers, FaCloud, FaFileInvoiceDollar, FaSearch, FaPlus, FaSync,
    FaWhatsapp, FaEye, FaEdit, FaMapMarkerAlt, FaCheckCircle,
    FaExclamationTriangle, FaBan, FaDollarSign, FaFilter, FaFileUpload,
    FaChevronDown, FaTimes, FaServer
} from 'react-icons/fa';

const API_URL = '/api';

const PLAN_LABELS = {
    local: { label: 'Local', icon: '🖥️', color: '#6B7280', bg: '#F3F4F6' },
    cloud: { label: 'Nube', icon: '☁️', color: '#3B82F6', bg: '#EFF6FF' },
    cloud_fe: { label: 'Nube + FE', icon: '☁️📄', color: '#8B5CF6', bg: '#F5F3FF' },
};

const STATUS_LABELS = {
    active: { label: 'Activo', icon: <FaCheckCircle />, color: '#10B981', bg: '#ECFDF5' },
    grace: { label: 'En gracia', icon: <FaExclamationTriangle />, color: '#F59E0B', bg: '#FFFBEB' },
    suspended: { label: 'Suspendido', icon: <FaBan />, color: '#EF4444', bg: '#FEF2F2' },
    cancelled: { label: 'Cancelado', icon: <FaTimes />, color: '#6B7280', bg: '#F3F4F6' },
};

const formatCurrency = (v) => {
    if (!v) return '$0';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);
};

// ============================================
// NEW CLIENT MODAL
// ============================================
const NewClientModal = ({ onClose, onCreated }) => {
    const [form, setForm] = useState({
        business_name: '', contact_name: '', whatsapp: '', email: '',
        city: 'Bucaramanga', plan_type: 'cloud', monthly_amount: 35000,
        cloud_url: '', notes: '', server_name: '', anydesk_id: ''
    });
    const [saving, setSaving] = useState(false);

    const handlePlanChange = (plan) => {
        const amounts = { local: 0, cloud: 35000, cloud_fe: 55000 };
        setForm(prev => ({ ...prev, plan_type: plan, monthly_amount: amounts[plan] || 0 }));
    };

    const handleSubmit = async () => {
        if (!form.business_name || !form.whatsapp) return alert('Nombre y WhatsApp son requeridos');
        setSaving(true);
        try {
            const res = await axios.post(`${API_URL}/api/clients`, form);
            if (res.data.success) {
                onCreated(res.data.client);
                onClose();
            }
        } catch (e) {
            alert('Error: ' + (e.response?.data?.error || e.message));
        }
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <FaPlus className="text-blue-500" /> Nuevo Cliente
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 block mb-1">Nombre del Negocio *</label>
                            <input value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 block mb-1">Contacto</label>
                            <input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 block mb-1">WhatsApp *</label>
                            <input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                                placeholder="3001234567"
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 block mb-1">Ciudad</label>
                            <select value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none">
                                <option>Bucaramanga</option>
                                <option>Bogotá</option>
                                <option>Medellín</option>
                                <option>Cali</option>
                                <option>Barranquilla</option>
                                <option>Otra</option>
                            </select>
                        </div>
                    </div>

                    {/* Plan selector */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 block mb-2">Plan</label>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.entries(PLAN_LABELS).map(([key, p]) => (
                                <button key={key} onClick={() => handlePlanChange(key)}
                                    className={`p-3 rounded-xl border-2 text-center transition-all ${form.plan_type === key
                                        ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <div className="text-xl mb-1">{p.icon}</div>
                                    <div className="text-xs font-bold" style={{ color: p.color }}>{p.label}</div>
                                    {key !== 'local' && (
                                        <div className="text-[10px] text-gray-400 mt-0.5">
                                            {formatCurrency(key === 'cloud' ? 35000 : 55000)}/mes
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {form.plan_type !== 'local' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 block mb-1">URL de la Nube</label>
                                <input value={form.cloud_url} onChange={e => setForm({ ...form, cloud_url: e.target.value })}
                                    placeholder="cliente.poslatino.com"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 block mb-1">Servidor</label>
                                <input value={form.server_name} onChange={e => setForm({ ...form, server_name: e.target.value })}
                                    placeholder="gota-1"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none" />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-bold text-gray-500 block mb-1">Notas</label>
                        <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none h-16 focus:ring-2 focus:ring-blue-300 focus:outline-none" />
                    </div>

                    <button onClick={handleSubmit} disabled={saving}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50">
                        {saving ? 'Guardando...' : '✅ Crear Cliente'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================
// MAIN CLIENTS Page
// ============================================
const CRMClients = () => {
    const [clients, setClients] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterPlan, setFilterPlan] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showNewModal, setShowNewModal] = useState(false);

    const fetchClients = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (filterPlan) params.append('plan_type', filterPlan);
            if (filterStatus) params.append('payment_status', filterStatus);
            const res = await axios.get(`${API_URL}/api/clients?${params.toString()}`);
            if (res.data.success) {
                setClients(res.data.clients);
                setStats(res.data.stats);
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [search, filterPlan, filterStatus]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    // Debounced search
    const [searchDebounce, setSearchDebounce] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => setSearch(searchDebounce), 300);
        return () => clearTimeout(timer);
    }, [searchDebounce]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FaUsers className="text-blue-500" /> Clientes
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {stats?.total_clients || 0} clientes registrados
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowNewModal(true)}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:shadow-lg transition-all flex items-center gap-2">
                        <FaPlus /> Nuevo Cliente
                    </button>
                    <button onClick={() => { setLoading(true); fetchClients(); }}
                        className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50">
                        <FaSync className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Total</p>
                        <p className="text-2xl font-black text-gray-800">{stats.total_clients || 0}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <p className="text-[10px] text-blue-500 font-bold uppercase">☁️ Nube</p>
                        <p className="text-2xl font-black text-blue-600">{stats.cloud_clients || 0}</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                        <p className="text-[10px] text-purple-500 font-bold uppercase">☁️📄 Nube+FE</p>
                        <p className="text-2xl font-black text-purple-600">{stats.cloud_fe_clients || 0}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                        <p className="text-[10px] text-green-500 font-bold uppercase">✅ Activos</p>
                        <p className="text-2xl font-black text-green-600">{stats.active_clients || 0}</p>
                    </div>
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                        <p className="text-[10px] text-emerald-500 font-bold uppercase">💰 Ingreso mensual</p>
                        <p className="text-xl font-black text-emerald-600">{formatCurrency(stats.expected_monthly)}</p>
                    </div>
                </div>
            )}

            {/* Search + Filters */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={searchDebounce}
                        onChange={e => setSearchDebounce(e.target.value)}
                        placeholder="Buscar por nombre, teléfono..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                </div>
                <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                    <option value="">Todos los planes</option>
                    <option value="cloud">☁️ Nube</option>
                    <option value="cloud_fe">☁️📄 Nube+FE</option>
                    <option value="local">🖥️ Local</option>
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                    <option value="">Todos los estados</option>
                    <option value="active">✅ Activo</option>
                    <option value="grace">⚠️ En gracia</option>
                    <option value="suspended">🚫 Suspendido</option>
                </select>
            </div>

            {/* Clients Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Negocio</th>
                                <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Ciudad</th>
                                <th className="text-left px-4 py-3 font-bold text-gray-500 text-xs uppercase">Plan</th>
                                <th className="text-right px-4 py-3 font-bold text-gray-500 text-xs uppercase">Mensual</th>
                                <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs uppercase">Estado</th>
                                <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs uppercase">Pagos</th>
                                <th className="text-center px-4 py-3 font-bold text-gray-500 text-xs uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {clients.map(client => {
                                const plan = PLAN_LABELS[client.plan_type] || PLAN_LABELS.local;
                                const status = STATUS_LABELS[client.payment_status] || STATUS_LABELS.active;
                                return (
                                    <tr key={client.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-semibold text-gray-800">{client.business_name}</p>
                                                {client.contact_name && (
                                                    <p className="text-[11px] text-gray-400">{client.contact_name}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <FaMapMarkerAlt className="text-[10px] text-blue-400" />
                                                {client.city || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: plan.bg, color: plan.color }}>
                                                {plan.icon} {plan.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-700">
                                            {formatCurrency(client.monthly_amount)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="text-xs font-bold px-2 py-1 rounded-full inline-flex items-center gap-1" style={{ backgroundColor: status.bg, color: status.color }}>
                                                {status.icon} {status.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="text-xs text-green-600 font-bold">{client.total_payments || 0}✓</span>
                                                {(client.pending_payments || 0) > 0 && (
                                                    <span className="text-xs text-red-500 font-bold">{client.pending_payments}⏳</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                {client.whatsapp && (
                                                    <a href={`https://wa.me/57${client.whatsapp.replace(/\D/g, '')}`}
                                                        target="_blank" rel="noreferrer"
                                                        className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition-colors"
                                                        title="WhatsApp">
                                                        <FaWhatsapp />
                                                    </a>
                                                )}
                                                {client.cloud_url && (
                                                    <a href={`https://${client.cloud_url}`}
                                                        target="_blank" rel="noreferrer"
                                                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                                                        title="Abrir nube">
                                                        <FaServer />
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {clients.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="7" className="text-center py-12 text-gray-400">
                                        <FaUsers className="text-4xl mx-auto mb-3 text-gray-300" />
                                        <p className="font-semibold">No hay clientes</p>
                                        <p className="text-xs mt-1">Agrega tu primer cliente o importa desde Excel</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* New Client Modal */}
            {showNewModal && (
                <NewClientModal
                    onClose={() => setShowNewModal(false)}
                    onCreated={() => fetchClients()}
                />
            )}
        </div>
    );
};

export default CRMClients;
