import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    FaServer, FaPowerOff, FaSync, FaTrash, FaGlobe, FaCogs, FaRocket,
    FaPlus, FaTerminal, FaDatabase, FaNetworkWired, FaPlay, FaStop,
    FaSearch, FaTimes, FaCheckCircle, FaExclamationCircle, FaSpinner,
    FaDownload, FaCodeBranch, FaChevronDown, FaChevronUp, FaLink,
    FaCloud, FaMemory, FaMicrochip, FaHdd,
    FaExchangeAlt, FaExclamationTriangle, FaInbox, FaWhatsapp, FaBuilding, FaInfoCircle
} from 'react-icons/fa';

const RAW_API = import.meta.env.VITE_API_URL || 'http://localhost:4050/api';
const API = RAW_API.replace(/\/api\/?$/, '');

const getToken = () => localStorage.getItem('adminToken');

const STATUS_COLORS = {
    online:    { dot: 'bg-emerald-400', badge: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50', label: 'Online' },
    offline:   { dot: 'bg-red-400',     badge: 'bg-red-900/40 text-red-300 border-red-700/50',             label: 'Offline' },
    deploying: { dot: 'bg-amber-400 animate-pulse', badge: 'bg-amber-900/40 text-amber-300 border-amber-700/50', label: 'Deploying' },
    unknown:   { dot: 'bg-slate-500',   badge: 'bg-slate-800 text-slate-400 border-slate-700',              label: 'Unknown' },
};

// ─── Small helpers ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const c = STATUS_COLORS[status] || STATUS_COLORS.unknown;
    return (
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${c.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
};

const LogLine = ({ line }) => {
    if (!line) return null;
    let cls = 'text-slate-400';
    if (line.includes('✅') || line.includes('[COMPLETE]') || line.includes('success'))   cls = 'text-emerald-400';
    if (line.includes('❌') || line.includes('error') || line.includes('Error'))          cls = 'text-red-400';
    if (line.includes('[PROGRESS]'))   cls = 'text-blue-300';
    if (line.includes('[SYSTEM]'))     cls = 'text-cyan-300';
    if (line.includes('⚠️') || line.includes('warn'))  cls = 'text-amber-400';
    return <div className={`font-mono text-xs leading-relaxed ${cls}`}>{line}</div>;
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminCloud = () => {
    const [tab, setTab]                   = useState('instances');   // instances | deploy | patches
    const [instances, setInstances]       = useState([]);
    const [installedClients, setInstalled]= useState([]);
    const [clusters, setClusters]         = useState([]);
    const [patches, setPatches]           = useState([]);
    const [loadingInst, setLoadingInst]   = useState(false);
    const [loadingVPS, setLoadingVPS]     = useState(false);
    const [search, setSearch]             = useState('');
    const [logs, setLogs]                 = useState([]);
    const [isStreaming, setIsStreaming]   = useState(false);
    const [showConsole, setShowConsole]   = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    // Cruce y Uso state
    const [cruceLoading, setCruceLoading] = useState(false);
    const [cruceStats, setCruceStats]     = useState(null);
    const [cruceReport, setCruceReport]   = useState([]);
    const [cruceOrphans, setCruceOrphans] = useState([]);
    const [cruceUnlinked, setCruceUnlinked] = useState([]);
    const [cruceSearch, setCruceSearch]   = useState('');
    const [cruceFilter, setCruceFilter]   = useState('todos'); // todos, al_dia, en_mora, sin_facturar, sin_meses
    const [downloadingId, setDownloadingId] = useState(null);

    // New Client form
    const [showNewClient, setShowNewClient] = useState(false);
    const [newClient, setNewClient]         = useState({ subdomain: '', cluster: '', forcePort: '', cloneFrom: '' });
    const [creating, setCreating]           = useState(false);

    // Patch selection
    const [selectedPatch, setSelectedPatch] = useState(null);
    const [applyingPatch, setApplyingPatch] = useState(false);

    const logRef    = useRef(null);
    const esRef     = useRef(null);
    const sseToken  = getToken();

    // Auto-scroll console
    useEffect(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, [logs]);

    // ── SSE Connection ─────────────────────────────────────────────────────
    const connectSSE = useCallback(() => {
        if (esRef.current) { esRef.current.close(); }
        const url = `${API}/api/cloud/deploy/stream?token=${sseToken}`;
        const es = new EventSource(url);
        esRef.current = es;
        setIsStreaming(true);

        es.onmessage = (e) => {
            const data = e.data;
            if (data === ':ping') return;
            setLogs(prev => [...prev.slice(-500), data]);
        };
        es.onerror = () => {
            setIsStreaming(false);
        };
    }, [sseToken]);

    useEffect(() => {
        connectSSE();
        loadInstances();
        loadClusters();
        return () => { if (esRef.current) esRef.current.close(); };
    }, []);

    // ── API Loaders ────────────────────────────────────────────────────────
    const loadInstances = async () => {
        setLoadingInst(true);
        try {
            const res = await fetch(`${API}/api/cloud/instances`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            setInstances(data.clients || data || []);
        } catch (e) {
            console.error('Error loading instances', e);
        } finally {
            setLoadingInst(false);
        }
    };

    const loadInstalledVPS = async () => {
        setLoadingVPS(true);
        try {
            const res = await fetch(`${API}/api/cloud/installed`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            setInstalled(data.clients || data || []);
        } catch (e) {
            console.error('Error loading VPS clients', e);
        } finally {
            setLoadingVPS(false);
        }
    };

    const loadClusters = async () => {
        try {
            const res = await fetch(`${API}/api/cloud/clusters`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            setClusters(data.clusters || data || []);
        } catch (e) { console.error('Error loading clusters', e); }
    };

    const loadPatches = async () => {
        try {
            const res = await fetch(`${API}/api/cloud/patches`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            setPatches(data.patches || data || []);
        } catch (e) { console.error('Error loading patches', e); }
    };

    // ── Cruce y Uso Actions ──────────────────────────────────────────────────
    const loadCruceData = async () => {
        setCruceLoading(true);
        try {
            const res = await fetch(`${API}/api/billing/cross-check`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (data.success) {
                setCruceStats(data.stats);
                setCruceReport(data.report || []);
                setCruceOrphans(data.orphanClouds || []);
                setCruceUnlinked(data.unlinkedInvoices || []);
            }
        } catch (e) {
            console.error('Error loading cross-check data', e);
        } finally {
            setCruceLoading(false);
        }
    };

    const handleDownloadPDF = async (invoiceId) => {
        setDownloadingId(invoiceId);
        try {
            const res = await fetch(`${API}/api/billing/admin-invoices/${invoiceId}/pdf`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            if (!res.ok) throw new Error('Error al descargar PDF');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `factura-${invoiceId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error("Error downloading PDF:", error);
            alert("Error al descargar PDF");
        } finally {
            setDownloadingId(null);
        }
    };

    const handleDeleteOrphan = async (id, name) => {
        const dropDb = window.confirm(`¿Estás seguro de eliminar la nube huérfana '${name}'?\n\nPresiona ACEPTAR si también deseas ELIMINAR la base de datos MongoDB asociada.\nPresiona CANCELAR si solo deseas limpiar el proceso PM2 e Nginx sin borrar los datos.`);
        const confirmDelete = window.confirm(`CONFIRMACIÓN FINAL: ¿Realmente deseas eliminar '${name}'? Esta acción no se puede deshacer.`);
        if (!confirmDelete) return;

        setLogs(prev => [...prev, `[SYSTEM] 🗑️ Iniciando eliminación de nube huérfana: ${name}...`]);
        try {
            const res = await fetch(`${API}/api/infrastructure/clients/${id}`, {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}` 
                },
                body: JSON.stringify({ dropDatabase: dropDb })
            });
            const data = await res.json();
            if (data.success) {
                setLogs(prev => [...prev, `[SYSTEM] ✅ Nube huérfana ${name} eliminada con éxito.`]);
                alert(`Nube huérfana ${name} eliminada con éxito.`);
                loadCruceData();
            } else {
                setLogs(prev => [...prev, `[SYSTEM] ❌ Error al eliminar: ${data.error}`]);
                alert(`Error al eliminar: ${data.error}`);
            }
        } catch (e) {
            setLogs(prev => [...prev, `[SYSTEM] ❌ Error de red: ${e.message}`]);
            alert(`Error de red: ${e.message}`);
        }
    };

    const last6Months = (() => {
        const months = [];
        const d = new Date();
        for (let i = 5; i >= 0; i--) {
            const target = new Date(d.getFullYear(), d.getMonth() - i, 1);
            months.push({
                year: target.getFullYear(),
                month: target.getMonth() + 1,
                name: target.toLocaleString('es-ES', { month: 'short' }).toUpperCase(),
                fullName: target.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
            });
        }
        return months;
    })();

    const getInvoiceForPeriod = (invoices, year, month) => {
        if (!invoices) return null;
        return invoices.find(inv => {
            const d = new Date(inv.fecha);
            return d.getFullYear() === year && (d.getMonth() + 1) === month;
        });
    };

    // ── PM2 Actions ────────────────────────────────────────────────────────
    const handleAction = async (clientName, action) => {
        setActionLoading(`${clientName}-${action}`);
        setLogs(prev => [...prev, `[SYSTEM] 🎯 Ejecutando ${action} en ${clientName}...`]);
        try {
            const res = await fetch(`${API}/api/cloud/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ client: clientName, action })
            });
            const data = await res.json();
            if (data.ok) {
                setLogs(prev => [...prev, `[SYSTEM] ✅ ${action} completado en ${clientName}`]);
                loadInstances();
            } else {
                setLogs(prev => [...prev, `[SYSTEM] ❌ Error: ${data.error || 'Acción fallida'}`]);
            }
        } catch (e) {
            setLogs(prev => [...prev, `[SYSTEM] ❌ Error de red: ${e.message}`]);
        } finally {
            setActionLoading(null);
        }
    };

    // ── Deploy Existing ────────────────────────────────────────────────────
    const handleDeploy = async (clientName) => {
        setLogs(prev => [...prev, `[SYSTEM] 🚀 Iniciando deploy de ${clientName}...`]);
        try {
            const res = await fetch(`${API}/api/cloud/deploy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ clients: [clientName] })
            });
            const data = await res.json();
            setLogs(prev => [...prev, data.ok ? `[SYSTEM] ✅ Deploy iniciado para ${clientName}` : `[SYSTEM] ❌ ${data.error}`]);
        } catch (e) {
            setLogs(prev => [...prev, `[SYSTEM] ❌ Error: ${e.message}`]);
        }
    };

    // ── Create New Client ──────────────────────────────────────────────────
    const handleCreateClient = async (e) => {
        e.preventDefault();
        if (!newClient.subdomain.trim()) return;
        setCreating(true);
        setShowConsole(true);
        setLogs(prev => [...prev, `[SYSTEM] ➕ Iniciando creación de ${newClient.subdomain}...`]);
        try {
            const res = await fetch(`${API}/api/cloud/clients/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({
                    subdomain: newClient.subdomain.trim().toLowerCase(),
                    cluster: newClient.cluster || undefined,
                    forcePort: newClient.forcePort ? parseInt(newClient.forcePort) : undefined,
                    cloneFrom: newClient.cloneFrom || undefined
                })
            });
            const data = await res.json();
            if (data.ok || data.success) {
                setLogs(prev => [...prev, `[SYSTEM] ✅ Solicitud enviada para ${newClient.subdomain}`]);
                setShowNewClient(false);
                setNewClient({ subdomain: '', cluster: '', forcePort: '', cloneFrom: '' });
                setTimeout(loadInstances, 5000);
            } else {
                setLogs(prev => [...prev, `[SYSTEM] ❌ ${data.error || 'Error creando cliente'}`]);
            }
        } catch (e) {
            setLogs(prev => [...prev, `[SYSTEM] ❌ ${e.message}`]);
        } finally {
            setCreating(false);
        }
    };

    // ── Apply Patch ────────────────────────────────────────────────────────
    const handleApplyPatch = async () => {
        if (!selectedPatch) return;
        setApplyingPatch(true);
        setShowConsole(true);
        setLogs(prev => [...prev, `[SYSTEM] 🔧 Aplicando parche: ${selectedPatch}...`]);
        try {
            const res = await fetch(`${API}/api/cloud/patches/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ patch: selectedPatch, clients: 'all' })
            });
            const data = await res.json();
            setLogs(prev => [...prev, data.ok ? `[SYSTEM] ✅ Parche ${selectedPatch} aplicado.` : `[SYSTEM] ❌ ${data.error}`]);
        } catch (e) {
            setLogs(prev => [...prev, `[SYSTEM] ❌ ${e.message}`]);
        } finally {
            setApplyingPatch(false);
        }
    };

    // ── Filter ─────────────────────────────────────────────────────────────
    const filteredInstances = instances.filter(c => {
        const q = search.toLowerCase();
        return (c.subdomain || c.name || '').toLowerCase().includes(q)
            || (c.port || '').toString().includes(q);
    });

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full gap-0 font-sans">

            {/* ═══ Top Header ═══════════════════════════════════════════════ */}
            <div className="bg-slate-900 px-6 pt-6 pb-0 rounded-t-3xl border border-slate-700/50 border-b-0">
                <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <FaCloud className="text-white text-2xl" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Torre de Control Cloud</h1>
                            <p className="text-slate-400 text-xs font-mono mt-0.5">DigitalOcean · VPS 24.144.114.69 · PM2 Cluster</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* SSE Status */}
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${isStreaming ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-400' : 'bg-red-900/30 border-red-700/50 text-red-400'}`}>
                            <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                            {isStreaming ? 'Live' : 'Desconectado'}
                        </div>

                        <button onClick={() => { loadInstances(); loadInstalledVPS(); }}
                            className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-xl transition-all" title="Recargar">
                            <FaSync size={13} />
                        </button>

                        <button onClick={() => { setShowNewClient(true); setTab('deploy'); }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-blue-600/30">
                            <FaPlus size={12} /> Nueva Nube
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1">
                    {[
                        { id: 'instances', icon: FaServer, label: `Instancias (${instances.length})` },
                        { id: 'cruce',     icon: FaExchangeAlt, label: 'Cruce y Uso' },
                        { id: 'deploy',    icon: FaRocket, label: 'Deploy & Crear' },
                        { id: 'patches',   icon: FaCodeBranch, label: 'Parches' },
                    ].map(t => (
                        <button key={t.id} onClick={() => { setTab(t.id); if (t.id === 'patches') loadPatches(); if (t.id === 'instances') loadInstalledVPS(); if (t.id === 'cruce') loadCruceData(); }}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold rounded-t-xl transition-all ${tab === t.id ? 'bg-slate-800 text-white border-t border-x border-slate-700/50' : 'text-slate-500 hover:text-slate-300'}`}>
                            <t.icon size={12} /> {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ═══ Content Panel ════════════════════════════════════════════ */}
            <div className="bg-slate-800 border border-slate-700/50 border-t-0 rounded-b-3xl flex-1 overflow-hidden flex flex-col">

                {/* ─── Instances Tab ─── */}
                {tab === 'instances' && (
                    <div className="flex-1 overflow-auto p-4">
                        {/* Search */}
                        <div className="flex gap-3 mb-4">
                            <div className="relative flex-1">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Buscar por dominio o puerto..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors" />
                            </div>
                            <button onClick={loadInstalledVPS} disabled={loadingVPS}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-bold transition-all">
                                {loadingVPS ? <FaSpinner className="animate-spin" size={12} /> : <FaNetworkWired size={12} />}
                                Escanear VPS
                            </button>
                        </div>

                        {loadingInst ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <FaSpinner className="animate-spin text-blue-400 text-4xl" />
                                <p className="text-slate-400 font-mono text-sm">Cargando catálogo de instancias...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                                {filteredInstances.map((inst, i) => {
                                    const name = inst.subdomain || inst.slug || inst.name || `client-${i}`;
                                    const port = inst.port || inst.env?.PORT || '—';
                                    const status = inst.status || 'unknown';
                                    const domain = inst.domain || `${name}.poslatino.com`;
                                    const key = `${name}-${i}`;
                                    const isActing = actionLoading?.startsWith(name);

                                    return (
                                        <div key={key} className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-5 hover:border-blue-500/40 transition-all group">
                                            {/* Card Header */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-blue-400 flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                        <FaGlobe size={16} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-black text-white text-sm truncate">{name}</p>
                                                        <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer"
                                                            className="text-blue-400 text-[10px] font-mono hover:text-blue-300 flex items-center gap-1 truncate">
                                                            <FaLink size={8} /> {domain}
                                                        </a>
                                                    </div>
                                                </div>
                                                <StatusBadge status={status} />
                                            </div>

                                            {/* Card Stats */}
                                            <div className="grid grid-cols-2 gap-2 mb-4">
                                                <div className="bg-slate-800 rounded-lg px-3 py-2">
                                                    <p className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Puerto PM2</p>
                                                    <p className="text-sm font-black text-white font-mono">{port}</p>
                                                </div>
                                                <div className="bg-slate-800 rounded-lg px-3 py-2">
                                                    <p className="text-[9px] text-slate-500 uppercase font-bold mb-0.5">Servidor</p>
                                                    <p className="text-sm font-black text-cyan-400 font-mono">NY-01</p>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-1.5 pt-3 border-t border-slate-800">
                                                <button onClick={() => handleAction(name, 'restart')} disabled={isActing}
                                                    title="Reiniciar PM2"
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50">
                                                    {isActing && actionLoading === `${name}-restart` ? <FaSpinner className="animate-spin" size={10} /> : <FaSync size={10} />} Restart
                                                </button>
                                                <button onClick={() => handleAction(name, 'stop')} disabled={isActing}
                                                    title="Detener"
                                                    className="flex items-center justify-center gap-1 px-3 py-2 bg-slate-800 hover:bg-amber-600 text-slate-400 hover:text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50">
                                                    {isActing && actionLoading === `${name}-stop` ? <FaSpinner className="animate-spin" size={10} /> : <FaStop size={10} />}
                                                </button>
                                                <button onClick={() => handleAction(name, 'start')} disabled={isActing}
                                                    title="Iniciar"
                                                    className="flex items-center justify-center gap-1 px-3 py-2 bg-slate-800 hover:bg-emerald-600 text-slate-400 hover:text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50">
                                                    {isActing && actionLoading === `${name}-start` ? <FaSpinner className="animate-spin" size={10} /> : <FaPlay size={10} />}
                                                </button>
                                                <button onClick={() => handleDeploy(name)} disabled={isActing}
                                                    title="Re-deploy"
                                                    className="flex items-center justify-center gap-1 px-3 py-2 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50">
                                                    <FaRocket size={10} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {filteredInstances.length === 0 && !loadingInst && (
                                    <div className="col-span-full py-20 text-center">
                                        <FaServer className="text-slate-700 text-5xl mx-auto mb-4" />
                                        <p className="text-slate-500 font-bold">No hay instancias en el catálogo.</p>
                                        <p className="text-slate-600 text-sm mt-1">Haz click en "Nueva Nube" para crear un cliente.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* VPS Installed (extra) */}
                        {installedClients.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <FaServer size={10} /> Clientes instalados en VPS ({installedClients.length})
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {installedClients.map((c, i) => (
                                        <span key={i} className="px-3 py-1 bg-slate-900 border border-slate-700 text-slate-300 rounded-lg text-xs font-mono">{c}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Cruce y Uso Tab ─── */}
                {tab === 'cruce' && (
                    <div className="flex-1 overflow-auto p-6 bg-white text-slate-800 space-y-6">
                        {/* Statistics Grid */}
                        {cruceLoading && !cruceStats ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <FaSpinner className="animate-spin text-blue-600 w-10 h-10" />
                                <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Sincronizando Facturación e Infraestructura...</p>
                            </div>
                        ) : (
                            <>
                                {cruceStats && (
                                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 transition-all duration-300">
                                            <div className="flex items-center gap-3 mb-2">
                                                <FaBuilding className="text-blue-600" />
                                                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Clientes</span>
                                            </div>
                                            <div className="text-2xl font-black text-slate-800">{cruceStats.total_clients}</div>
                                        </div>
                                        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 transition-all duration-300">
                                            <div className="flex items-center gap-3 mb-2">
                                                <FaCheckCircle className="text-green-600" />
                                                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Al Día Nube</span>
                                            </div>
                                            <div className="text-2xl font-black text-slate-800">{cruceStats.al_dia}</div>
                                        </div>
                                        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 transition-all duration-300">
                                            <div className="flex items-center gap-3 mb-2">
                                                <FaExclamationTriangle className="text-red-600" />
                                                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">En Mora</span>
                                            </div>
                                            <div className="text-2xl font-black text-slate-800">{cruceStats.en_mora}</div>
                                        </div>
                                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 transition-all duration-300">
                                            <div className="flex items-center gap-3 mb-2">
                                                <FaFileInvoice className="text-amber-600" />
                                                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Falta Facturar</span>
                                            </div>
                                            <div className="text-2xl font-black text-slate-800">{cruceStats.sin_facturar}</div>
                                        </div>
                                        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 transition-all duration-300">
                                            <div className="flex items-center gap-3 mb-2">
                                                <FaCloud className="text-purple-600" />
                                                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Nubes Huérfanas</span>
                                            </div>
                                            <div className="text-2xl font-black text-slate-800">{cruceStats.total_orphans}</div>
                                        </div>
                                        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 transition-all duration-300">
                                            <div className="flex items-center gap-3 mb-2">
                                                <FaInbox className="text-slate-600" />
                                                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Facturas Libres</span>
                                            </div>
                                            <div className="text-2xl font-black text-slate-800">{cruceUnlinked.length}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Filter / Search bar */}
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                                    <div className="relative flex-1 w-full md:max-w-md">
                                        <FaSearch className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            placeholder="Buscar negocio, NIT o dominio..."
                                            value={cruceSearch}
                                            onChange={(e) => setCruceSearch(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
                                        />
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto items-center flex-wrap">
                                        <button 
                                            onClick={loadCruceData} 
                                            disabled={cruceLoading}
                                            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition active:scale-95 shadow-sm"
                                        >
                                            {cruceLoading ? <FaSpinner className="animate-spin" /> : <FaSync />} Cruzar y Sincronizar
                                        </button>
                                        <select 
                                            value={cruceFilter} 
                                            onChange={(e) => setCruceFilter(e.target.value)}
                                            className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="todos">Todos los Clientes</option>
                                            <option value="al_dia">Al Día</option>
                                            <option value="en_mora">En Mora</option>
                                            <option value="sin_facturar">Falta Facturar</option>
                                            <option value="sin_meses">Sin Períodos</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Comparison Table */}
                                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto max-h-[50vh]">
                                        <table className="w-full text-left text-sm whitespace-nowrap">
                                            <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100 sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-5 py-3">Cliente / Nube</th>
                                                    <th className="px-5 py-3">Cruce</th>
                                                    <th className="px-5 py-3">Uso Técnico</th>
                                                    <th className="px-5 py-3">Servicios VPS</th>
                                                    {last6Months.map((m, idx) => (
                                                        <th key={idx} className="px-4 py-3 text-center border-l border-slate-100" title={m.fullName}>
                                                            {m.name}
                                                        </th>
                                                    ))}
                                                    <th className="px-5 py-3 text-right">Contacto</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                                {cruceReport
                                                    .filter(c => {
                                                        const matchesSearch = 
                                                            c.business_name?.toLowerCase().includes(cruceSearch.toLowerCase()) ||
                                                            c.nit?.toLowerCase().includes(cruceSearch.toLowerCase()) ||
                                                            c.cloud_url?.toLowerCase().includes(cruceSearch.toLowerCase());
                                                        if (!matchesSearch) return false;
                                                        if (cruceFilter === 'al_dia') return c.status_check === 'Al día';
                                                        if (cruceFilter === 'en_mora') return c.status_check === 'En mora';
                                                        if (cruceFilter === 'sin_facturar') return c.status_check === 'Sin facturar';
                                                        if (cruceFilter === 'sin_meses') return c.status_check === 'Sin registrar meses';
                                                        return true;
                                                    })
                                                    .map((c) => (
                                                        <tr key={c.id} className="hover:bg-slate-50/55 transition-colors">
                                                            <td className="px-5 py-3">
                                                                <div className="font-bold text-slate-900">{c.business_name}</div>
                                                                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-mono">
                                                                    <span>{c.nit || 'Sin NIT'}</span>
                                                                    <span>•</span>
                                                                    <a 
                                                                        href={c.cloud_url.startsWith('http') ? c.cloud_url : `https://${c.cloud_url}`} 
                                                                        target="_blank" 
                                                                        rel="noreferrer" 
                                                                        className="text-blue-500 hover:text-blue-700 flex items-center gap-0.5 hover:underline"
                                                                    >
                                                                        {c.cloud_url} <FaLink size={8} />
                                                                    </a>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3">
                                                                {c.status_check === 'Al día' && (
                                                                    <span className="px-2 py-0.5 bg-green-100 text-green-800 border border-green-200 rounded text-[10px] font-extrabold uppercase">Al Día</span>
                                                                )}
                                                                {c.status_check === 'En mora' && (
                                                                    <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 rounded text-[10px] font-extrabold uppercase animate-pulse">En Mora</span>
                                                                )}
                                                                {c.status_check === 'Sin facturar' && (
                                                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded text-[10px] font-extrabold uppercase">Falta Facturar</span>
                                                                )}
                                                                {c.status_check === 'Sin registrar meses' && (
                                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[10px] font-extrabold uppercase">Sin Períodos</span>
                                                                )}
                                                            </td>
                                                            <td className="px-5 py-3 text-xs font-mono">
                                                                {c.usage ? (
                                                                    <div>
                                                                        <div className="font-bold text-slate-800">{c.usage.db_size_mb.toFixed(2)} MB</div>
                                                                        <div className="text-[10px] text-slate-400">{c.usage.server_name} · P:{c.usage.port}</div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-400">Sin mapeo técnico</span>
                                                                )}
                                                            </td>
                                                            <td className="px-5 py-3 text-xs">
                                                                {c.usage ? (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className={`w-2 h-2 rounded-full ${c.usage.has_link ? 'bg-green-500' : 'bg-red-500'}`} title={c.usage.has_link ? 'Nginx Ok' : 'Nginx Falta'} />
                                                                        <span className={`w-2 h-2 rounded-full ${c.usage.has_system ? 'bg-green-500' : 'bg-red-500'}`} title={c.usage.has_system ? 'PM2 Ok' : 'PM2 Falta'} />
                                                                        <span className={`w-2 h-2 rounded-full ${c.usage.has_db ? 'bg-green-500' : 'bg-red-500'}`} title={c.usage.has_db ? 'MongoDB Ok' : 'MongoDB Falta'} />
                                                                        <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">({c.usage.status})</span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-400">—</span>
                                                                )}
                                                            </td>
                                                            
                                                            {last6Months.map((m, idx) => {
                                                                const inv = getInvoiceForPeriod(c.invoices, m.year, m.month);
                                                                return (
                                                                    <td key={idx} className="px-3 py-3 border-l border-slate-100 text-center text-xs">
                                                                        {inv ? (
                                                                            <button
                                                                                onClick={() => handleDownloadPDF(inv.id)}
                                                                                disabled={downloadingId === inv.id}
                                                                                className="px-2 py-1 rounded bg-green-50 border border-green-200 text-green-700 font-extrabold text-[10px] hover:bg-green-100 transition shadow-sm inline-flex items-center gap-0.5"
                                                                                title={`Factura #${inv.numero}\nMonto: $${parseFloat(inv.monto).toLocaleString('es-CO')}`}
                                                                            >
                                                                                {downloadingId === inv.id ? <FaSpinner className="animate-spin text-green-700" /> : `📄 #${inv.numero}`}
                                                                            </button>
                                                                        ) : (
                                                                            <span 
                                                                                className="text-amber-500 font-extrabold text-[10px] px-1.5 py-0.5 bg-amber-50/50 border border-amber-200/50 rounded inline-block"
                                                                                title="No se detecta factura emitida"
                                                                            >
                                                                                ⚠️ Falta
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                );
                                                            })}

                                                            <td className="px-5 py-3 text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <a 
                                                                        href={`https://wa.me/57${c.whatsapp?.replace(/\D/g, '')}`} 
                                                                        target="_blank" 
                                                                        rel="noreferrer" 
                                                                        className="w-8 h-8 rounded-lg bg-green-50 border border-green-200 text-green-600 flex items-center justify-center hover:bg-green-100 transition"
                                                                        title="Hablar por WhatsApp"
                                                                    >
                                                                        <FaWhatsapp size={14} />
                                                                    </a>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Orphan Clouds Section */}
                                <div className="pt-4 border-t border-slate-200">
                                    <h3 className="text-slate-800 font-black text-lg mb-2 flex items-center gap-2">
                                        <FaExclamationTriangle className="text-purple-600" /> Nubes Huérfanas en Infraestructura
                                    </h3>
                                    <p className="text-slate-500 text-xs mb-4">
                                        Estas nubes están consumiendo recursos en el VPS y MongoDB, pero no tienen un registro comercial correspondiente en el CRM.
                                    </p>

                                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm whitespace-nowrap">
                                                <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-5 py-3">Subdominio</th>
                                                        <th className="px-5 py-3">Base de Datos</th>
                                                        <th className="px-5 py-3">Servidor / Puerto</th>
                                                        <th className="px-5 py-3">Servicios VPS</th>
                                                        <th className="px-5 py-3">Estado Infra</th>
                                                        <th className="px-5 py-3 text-right">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-xs">
                                                    {cruceOrphans.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="6" className="px-5 py-8 text-center text-slate-400 font-bold font-sans">
                                                                No hay nubes huérfanas detectadas. ¡Todo está en orden comercial! ✨
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        cruceOrphans.map(orphan => (
                                                            <tr key={orphan.id} className="hover:bg-purple-50/25 transition-colors">
                                                                <td className="px-5 py-3 font-bold text-slate-900 font-sans">
                                                                    {orphan.name}
                                                                </td>
                                                                <td className="px-5 py-3">
                                                                    <div className="font-bold text-slate-800">{orphan.db_size_mb.toFixed(2)} MB</div>
                                                                    <div className="text-[10px] text-slate-400">{orphan.db_name || 'Sin DB'}</div>
                                                                </td>
                                                                <td className="px-5 py-3">
                                                                    {orphan.server_name} · Puerto {orphan.port || '—'}
                                                                </td>
                                                                <td className="px-5 py-3">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className={`w-2 h-2 rounded-full ${orphan.has_link ? 'bg-green-500' : 'bg-red-500'}`} title={orphan.has_link ? 'Nginx Ok' : 'Nginx Falta'} />
                                                                        <span className={`w-2 h-2 rounded-full ${orphan.has_system ? 'bg-green-500' : 'bg-red-500'}`} title={orphan.has_system ? 'PM2 Ok' : 'PM2 Falta'} />
                                                                        <span className={`w-2 h-2 rounded-full ${orphan.has_db ? 'bg-green-500' : 'bg-red-500'}`} title={orphan.has_db ? 'MongoDB Ok' : 'MongoDB Falta'} />
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-3">
                                                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 rounded text-[10px] font-extrabold uppercase font-sans">{orphan.status}</span>
                                                                </td>
                                                                <td className="px-5 py-3 text-right">
                                                                    <button 
                                                                        onClick={() => handleDeleteOrphan(orphan.id, orphan.name)}
                                                                        className="p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg hover:text-red-700 transition"
                                                                        title="Eliminar de Infraestructura"
                                                                    >
                                                                        <FaTrash size={12} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ─── Deploy & Crear Tab ─── */}
                {tab === 'deploy' && (
                    <div className="flex-1 overflow-auto p-4 space-y-5">
                        {/* New Client Form */}
                        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
                            <h2 className="text-white font-black text-base mb-1 flex items-center gap-2">
                                <FaPlus size={14} className="text-blue-400" /> Crear Nueva Nube
                            </h2>
                            <p className="text-slate-500 text-xs mb-4">Crea, siembra la base de datos y despliega un nuevo cliente en el VPS.</p>

                            <form onSubmit={handleCreateClient} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="md:col-span-1">
                                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Subdominio *</label>
                                    <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl overflow-hidden focus-within:border-blue-500">
                                        <input value={newClient.subdomain}
                                            onChange={e => setNewClient(p => ({ ...p, subdomain: e.target.value.replace(/[^a-z0-9-]/g, '') }))}
                                            placeholder="micliente"
                                            className="flex-1 w-full bg-transparent px-3 py-2.5 text-white text-sm focus:outline-none placeholder-slate-600"
                                            required />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Clonar Desde...</label>
                                    <select value={newClient.cloneFrom}
                                        onChange={e => setNewClient(p => ({ ...p, cloneFrom: e.target.value }))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500">
                                        <option value="">-- No (Usar Semilla) --</option>
                                        {instances.map((c, i) => {
                                            const name = c.subdomain || c.name || `client-${i}`;
                                            return <option key={i} value={name}>{name}</option>;
                                        })}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Clúster MongoDB</label>
                                    <select value={newClient.cluster}
                                        onChange={e => setNewClient(p => ({ ...p, cluster: e.target.value }))}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500">
                                        <option value="">Auto (restaurantes)</option>
                                        {clusters.map((c, i) => (
                                            <option key={i} value={c.name || c}>{c.name || c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Puerto Forzado (opcional)</label>
                                    <input value={newClient.forcePort}
                                        onChange={e => setNewClient(p => ({ ...p, forcePort: e.target.value }))}
                                        type="number" placeholder="Auto"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500" />
                                </div>

                                <div className="md:col-span-4 flex items-center gap-3 mt-2">
                                    <button type="submit" disabled={creating || !newClient.subdomain.trim()}
                                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-sm transition-all active:scale-95 shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {creating ? <FaSpinner className="animate-spin" /> : <FaRocket />}
                                        {creating ? 'Creando...' : (newClient.cloneFrom ? 'Clonar y Desplegar' : 'Crear y Desplegar')}
                                    </button>
                                    {creating && <p className="text-amber-400 text-xs font-mono animate-pulse">Sigue el progreso en la consola ↓</p>}
                                </div>
                            </form>
                        </div>

                        {/* Quick Deploy existing */}
                        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
                            <h2 className="text-white font-black text-base mb-1 flex items-center gap-2">
                                <FaRocket size={14} className="text-indigo-400" /> Re-deploy de Clientes Existentes
                            </h2>
                            <p className="text-slate-500 text-xs mb-4">Selecciona clientes del catálogo para hacer redeploy en el VPS.</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-52 overflow-y-auto custom-scrollbar">
                                {instances.slice(0, 60).map((c, i) => {
                                    const name = c.subdomain || c.name || `client-${i}`;
                                    return (
                                        <button key={i} onClick={() => { setShowConsole(true); handleDeploy(name); }}
                                            className="text-left px-3 py-2 bg-slate-800 hover:bg-indigo-900/50 border border-slate-700 hover:border-indigo-500/50 text-slate-300 hover:text-white rounded-xl text-xs font-mono transition-all truncate">
                                            {name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Patches Tab ─── */}
                {tab === 'patches' && (
                    <div className="flex-1 overflow-auto p-4 space-y-4">
                        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-white font-black text-base flex items-center gap-2">
                                        <FaCodeBranch size={14} className="text-emerald-400" /> Gestión de Parches
                                    </h2>
                                    <p className="text-slate-500 text-xs mt-0.5">Parches disponibles en el servidor VPS para aplicar masivamente.</p>
                                </div>
                                <button onClick={loadPatches} className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-bold transition-all">
                                    <FaSync size={11} /> Recargar
                                </button>
                            </div>

                            {patches.length === 0 ? (
                                <div className="text-center py-12">
                                    <FaDownload className="text-slate-700 text-4xl mx-auto mb-3" />
                                    <p className="text-slate-500 text-sm">No se encontraron parches disponibles.</p>
                                    <button onClick={loadPatches} className="mt-3 text-blue-400 hover:text-blue-300 text-xs underline">Intentar de nuevo</button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {patches.map((patch, i) => {
                                        const pname = patch.name || patch.file || patch;
                                        const isSelected = selectedPatch === pname;
                                        return (
                                            <div key={i} onClick={() => setSelectedPatch(isSelected ? null : pname)}
                                                className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer border transition-all ${isSelected ? 'bg-emerald-900/20 border-emerald-500/50 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'}`}>
                                                <div className="flex items-center gap-3">
                                                    <FaCodeBranch size={12} className={isSelected ? 'text-emerald-400' : 'text-slate-500'} />
                                                    <span className="font-mono text-sm">{pname}</span>
                                                    {patch.size && <span className="text-slate-500 text-xs">{patch.size}</span>}
                                                </div>
                                                {isSelected && <FaCheckCircle className="text-emerald-400" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {selectedPatch && (
                                <div className="mt-4 flex items-center gap-3 p-4 bg-emerald-900/10 border border-emerald-700/30 rounded-xl">
                                    <FaCodeBranch className="text-emerald-400" />
                                    <div className="flex-1">
                                        <p className="text-white text-sm font-bold">Parche seleccionado: <span className="font-mono text-emerald-300">{selectedPatch}</span></p>
                                        <p className="text-slate-400 text-xs">Se aplicará a TODOS los clientes activos.</p>
                                    </div>
                                    <button onClick={handleApplyPatch} disabled={applyingPatch}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50">
                                        {applyingPatch ? <FaSpinner className="animate-spin" size={13} /> : <FaPlay size={13} />}
                                        {applyingPatch ? 'Aplicando...' : 'Aplicar Parche'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══ Live Console (always visible) ═══════════════════════ */}
                <div className="border-t border-slate-700/50 bg-slate-950">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 cursor-pointer select-none"
                        onClick={() => setShowConsole(p => !p)}>
                        <div className="flex items-center gap-2">
                            <FaTerminal size={11} className="text-cyan-400" />
                            <span className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-widest">Live Console</span>
                            {isStreaming && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
                            <span className="text-slate-600 text-xs">{logs.length} líneas</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={e => { e.stopPropagation(); setLogs([]); }}
                                className="text-slate-600 hover:text-red-400 text-xs transition-colors px-2 py-0.5 rounded">
                                Limpiar
                            </button>
                            {showConsole ? <FaChevronDown size={11} className="text-slate-500" /> : <FaChevronUp size={11} className="text-slate-500" />}
                        </div>
                    </div>

                    {showConsole && (
                        <div ref={logRef} className="h-48 overflow-y-auto p-4 space-y-0.5 custom-scrollbar">
                            {logs.length === 0 ? (
                                <p className="text-slate-600 font-mono text-xs">Esperando eventos del servidor...</p>
                            ) : (
                                logs.map((line, i) => <LogLine key={i} line={line} />)
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminCloud;
