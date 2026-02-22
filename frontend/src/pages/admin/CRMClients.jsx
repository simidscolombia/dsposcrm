import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaUsers, FaSearch, FaFilter, FaEdit, FaServer,
    FaDesktop, FaVideo, FaCheckCircle, FaTimesCircle, FaWhatsapp, FaCopy, FaExternalLinkAlt, FaBuilding, FaWrench,
    FaArrowDown, FaBell, FaFileCsv, FaSpinner
} from 'react-icons/fa';

const API_URL = '/api';

const CRMClients = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [search, setSearch] = useState('');
    const [filterPlan, setFilterPlan] = useState('');
    const [options, setOptions] = useState({ distributors: [], advisors: [] });

    // Manage edit modal state
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchOptions();
        fetchClients();
        // eslint-disable-next-line
    }, [filterPlan]);

    const fetchOptions = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/crm/options`);
            if (res.data.success) {
                setOptions({
                    distributors: res.data.distributors || [],
                    advisors: res.data.advisors || []
                });
            }
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    };

    const fetchClients = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (filterPlan) params.append('plan_type', filterPlan);

            const res = await axios.get(`${API_URL}/clients?${params.toString()}`);
            if (res.data.success) {
                setClients(res.data.clients);
                setStats(res.data.stats);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchClients();
    };

    const handleCopy = (text, type) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        alert(`${type} copiado al portapapeles: ${text}`);
    };

    const getPlanBadge = (plan) => {
        if (plan === 'cloud') return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">Nube</span>;
        if (plan === 'cloud_fe') return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">Nube + FE</span>;
        if (plan === 'local') return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">Local</span>;
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">{plan}</span>;
    };

    const getStatusIndicator = (isActive) => {
        return isActive
            ? <FaCheckCircle className="text-green-500 w-4 h-4" title="Activo" />
            : <FaTimesCircle className="text-red-500 w-4 h-4" title="Inactivo" />;
    };

    const handleEditClick = (client) => {
        setFormData({ ...client });
        setEditingClient(client);
    };

    const handleUpdateChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const saveClient = async () => {
        try {
            const updateProps = {
                business_name: formData.business_name,
                whatsapp: formData.whatsapp,
                plan_type: formData.plan_type,
                monthly_amount: parseFloat(formData.monthly_amount) || 0,
                pos_version: formData.pos_version,
                server_name: formData.server_name,
                cloud_url: formData.cloud_url,
                anydesk_id: formData.anydesk_id,
                distributor_id: formData.distributor_id || null,
                technician_id: formData.technician_id || null,
                is_active: formData.is_active === 'true' || formData.is_active === true
            };

            const res = await axios.put(`${API_URL}/clients/${editingClient.id}`, updateProps);
            if (res.data.success) {
                alert('Cliente actualizado correctamente');
                setEditingClient(null);
                fetchClients(); // recargar
            }
        } catch (error) {
            console.error('Error saving client:', error);
            alert('Error al guardar el cliente');
        }
    };

    const handleStatusNotify = async (id, type) => {
        let confirmMsg = type === 'downgrade_to_local'
            ? '¿Estás seguro de dar de baja la NUBE de este cliente y enviarle el mensaje de WhatsApp de que ahora es LOCAL (Gratis)?'
            : '¿Enviar mensaje de WhatsApp notificando que lleva TIEMPO DESCONECTADO de la nube?';

        if (!window.confirm(confirmMsg)) return;

        try {
            const res = await axios.post(`${API_URL}/clients/${id}/status-notify`, { type });
            if (res.data.success) {
                alert(res.data.message);
                fetchClients(); // recarga para ver si cambió a local
            }
        } catch (error) {
            console.error('Error sending notification:', error);
            alert('Error al enviar notificación de estado');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            alert('Por favor selecciona un archivo con extensión .CSV (Puedes exportarlo desde Google Sheets / Excel)');
            e.target.value = null;
            return;
        }

        setLoading(true);
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        try {
            const res = await axios.post(`${API_URL}/clients/import`, formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                alert(res.data.message);
                fetchClients();
            }
        } catch (error) {
            console.error('Error uploading:', error);
            alert(error.response?.data?.error || 'Error subiendo el archivo. Asegúrate de que las columnas coincidan.');
        } finally {
            e.target.value = null;
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FaUsers className="w-6 h-6 text-blue-600" />
                        Control de Clientes
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Gestión técnica, soporte y asignación de distribuidores
                    </p>
                </div>

                <div className="flex gap-2">
                    <button onClick={fetchClients} className="px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm shadow-sm transition">
                        Actualizar
                    </button>

                    {/* Botón Importar CSV */}
                    <div className="relative">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            id="csv_upload"
                            disabled={loading}
                        />
                        <label
                            htmlFor="csv_upload"
                            className={`px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 flex items-center gap-2 text-sm shadow-sm transition cursor-pointer ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            {loading ? <FaSpinner className="animate-spin" /> : <FaFileCsv size={16} />}
                            Importar CSV Sheets
                        </label>
                    </div>
                </div>
            </div>

            {/* Metrics */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex justify-center items-center">
                            <FaUsers />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-semibold uppercase">Total Clientes</p>
                            <h3 className="text-xl font-bold text-gray-800">{stats.total_clients}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex justify-center items-center">
                            <FaServer />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-semibold uppercase">SaaS Activo</p>
                            <h3 className="text-xl font-bold text-gray-800">{parseInt(stats.cloud_clients || 0) + parseInt(stats.cloud_fe_clients || 0)}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex justify-center items-center">
                            <FaCheckCircle />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-semibold uppercase">Cartera Sana</p>
                            <h3 className="text-xl font-bold text-gray-800">{stats.active_clients}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex justify-center items-center">
                            <FaTimesCircle />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-semibold uppercase">Suspendidos</p>
                            <h3 className="text-xl font-bold text-gray-800">{stats.suspended_clients}</h3>
                        </div>
                    </div>
                </div>
            )}

            {/* List & Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 md:p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50">

                    <form onSubmit={handleSearch} className="relative w-full md:w-96">
                        <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar negocio, url, o WhatsApp..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                    </form>

                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-48">
                            <FaFilter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <select
                                value={filterPlan}
                                onChange={(e) => setFilterPlan(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
                            >
                                <option value="">Todos los Planes</option>
                                <option value="cloud">Nube (Básico)</option>
                                <option value="cloud_fe">Nube + Elec.</option>
                                <option value="local">P. Local</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-medium w-10">St</th>
                                <th className="px-6 py-4 font-medium">Negocio / Cliente</th>
                                <th className="px-6 py-4 font-medium">Plan</th>
                                <th className="px-6 py-4 font-medium">Técnica (Rápidas)</th>
                                <th className="px-6 py-4 font-medium">Distribuidor</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Cargando portafolio...</td></tr>
                            ) : clients.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No hay clientes con esos filtros.</td></tr>
                            ) : (
                                clients.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            {getStatusIndicator(c.is_active)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{c.business_name}</div>
                                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                <span>{c.city || 'Sin Ciudad'}</span>
                                                <a href={`https://wa.me/57${c.whatsapp?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-green-600 transition">
                                                    <FaWhatsapp className="text-green-500" /> {c.whatsapp}
                                                </a>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getPlanBadge(c.plan_type)}
                                            <div className="text-xs text-gray-400 mt-1">V: {c.pos_version || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {/* Botón rápido Anydesk */}
                                                <button
                                                    onClick={() => handleCopy(c.anydesk_id, 'AnyDesk ID')}
                                                    className={`px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition flex items-center gap-1 text-xs font-semibold ${!c.anydesk_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    title={c.anydesk_id ? `Intervenir AnyDesk: ${c.anydesk_id}` : 'No hay AnyDesk provisto'}
                                                >
                                                    <FaDesktop /> {c.anydesk_id || 'Sin AnyDesk'} <FaCopy className="opacity-50" />
                                                </button>

                                                {/* Botón rápido Nube */}
                                                <button
                                                    onClick={() => c.cloud_url ? window.open(c.cloud_url.startsWith('http') ? c.cloud_url : `https://${c.cloud_url}`, '_blank') : null}
                                                    className={`px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition flex items-center gap-1 text-xs font-semibold ${!c.cloud_url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    title={c.cloud_url ? `Abrir url: ${c.cloud_url}` : 'No opera en nube o url no configurada'}
                                                >
                                                    <FaServer /> WEB <FaExternalLinkAlt className="opacity-50" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <div className="text-sm font-medium text-gray-800 flex items-center gap-1"><FaBuilding className="text-gray-400 text-xs" /> {c.distributor_name || 'Discovery (Por defecto)'}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><FaWrench className="text-gray-400 text-xs" /> Téc: {options.advisors?.find(a => a.id === c.technician_id)?.name || 'Sin asignar'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleStatusNotify(c.id, 'long_disconnected')}
                                                    className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center hover:bg-orange-100 transition"
                                                    title="Aviso: Mucho tiempo Desconectado"
                                                >
                                                    <FaBell />
                                                </button>
                                                <button
                                                    onClick={() => handleStatusNotify(c.id, 'downgrade_to_local')}
                                                    className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center hover:bg-purple-100 transition"
                                                    title="Dar de baja NUBE -> Pasar a LOCAL"
                                                >
                                                    <FaArrowDown />
                                                </button>
                                                <button
                                                    onClick={() => handleEditClick(c)}
                                                    className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition"
                                                    title="Editar Ficha Técnica"
                                                >
                                                    <FaEdit />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal Minimalist */}
            {editingClient && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
                            <h2 className="text-xl font-bold flex items-center gap-2"><FaEdit className="text-blue-600" /> Editar Cliente Técnico</h2>
                            <button onClick={() => setEditingClient(null)} className="text-gray-400 hover:text-red-500"><FaTimesCircle className="w-6 h-6" /></button>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50">

                            {/* Basics */}
                            <div className="md:col-span-2"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Datos Básicos</h3></div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Negocio</label>
                                <input name="business_name" value={formData.business_name || ''} onChange={handleUpdateChange} className="w-full p-2 border border-gray-200 rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">WhatsApp</label>
                                <input name="whatsapp" value={formData.whatsapp || ''} onChange={handleUpdateChange} className="w-full p-2 border border-gray-200 rounded text-sm" />
                            </div>

                            {/* Plans */}
                            <div className="md:col-span-2 mt-4"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Facturación / Suscripción</h3></div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Plan</label>
                                <select name="plan_type" value={formData.plan_type || 'local'} onChange={handleUpdateChange} className="w-full p-2 border border-gray-200 rounded text-sm bg-white">
                                    <option value="local">Local Fijo</option>
                                    <option value="cloud">Nube Básico</option>
                                    <option value="cloud_fe">Nube Frontend Ex.</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Mensualidad Pactada ($)</label>
                                <input type="number" name="monthly_amount" value={formData.monthly_amount || 0} onChange={handleUpdateChange} className="w-full p-2 border border-gray-200 rounded text-sm" />
                            </div>

                            {/* Tech */}
                            <div className="md:col-span-2 mt-4"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Parámetros Técnicos</h3></div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">AnyDesk ID</label>
                                <input name="anydesk_id" value={formData.anydesk_id || ''} onChange={handleUpdateChange} placeholder="123 456 789" className="w-full p-2 border border-gray-200 rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">URL Acceso Nube</label>
                                <input name="cloud_url" value={formData.cloud_url || ''} onChange={handleUpdateChange} placeholder="empresa.poslatino.com" className="w-full p-2 border border-gray-200 rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Servidor (Droplet)</label>
                                <input name="server_name" value={formData.server_name || ''} onChange={handleUpdateChange} placeholder="App1, Nodo4..." className="w-full p-2 border border-gray-200 rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Versión POS Instalada</label>
                                <input name="pos_version" value={formData.pos_version || ''} onChange={handleUpdateChange} placeholder="v1.0.8" className="w-full p-2 border border-gray-200 rounded text-sm" />
                            </div>

                            {/* Ownership */}
                            <div className="md:col-span-2 mt-4"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Asignación Directa</h3></div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Distribuidor / Propietario</label>
                                <select name="distributor_id" value={formData.distributor_id || ''} onChange={handleUpdateChange} className="w-full p-2 border border-gray-200 rounded text-sm bg-white">
                                    <option value="">Directo (Discovery)</option>
                                    {options.distributors.map(d => (
                                        <option key={d.id} value={d.id}>{d.name} ({d.city})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Técnico A Cargo</label>
                                <select name="technician_id" value={formData.technician_id || ''} onChange={handleUpdateChange} className="w-full p-2 border border-gray-200 rounded text-sm bg-white">
                                    <option value="">Sin técnico asignado</option>
                                    {options.advisors.map(a => (
                                        <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2 mt-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer p-2 border border-gray-200 rounded bg-white mt-2">
                                    <input type="checkbox" name="is_active" checked={formData.is_active === true || formData.is_active === 'true'} onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))} className="w-4 h-4 text-blue-600" />
                                    Cliente Activo y Operando (Mostrar en verde)
                                </label>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                            <button onClick={() => setEditingClient(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition">
                                Cancelar
                            </button>
                            <button onClick={saveClient} className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium shadow-md transition">
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CRMClients;
