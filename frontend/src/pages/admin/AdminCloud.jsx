import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    FaServer, FaPowerOff, FaSync, FaTrash, FaGlobe, FaCogs, FaRocket,
    FaPlus, FaTerminal, FaDatabase, FaNetworkWired, FaPlay, FaStop,
    FaSearch, FaTimes, FaCheckCircle, FaExclamationCircle, FaSpinner,
    FaDownload, FaCodeBranch, FaChevronDown, FaChevronUp, FaLink,
    FaCloud, FaMemory, FaMicrochip, FaHdd
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
                        { id: 'deploy',    icon: FaRocket, label: 'Deploy & Crear' },
                        { id: 'patches',   icon: FaCodeBranch, label: 'Parches' },
                    ].map(t => (
                        <button key={t.id} onClick={() => { setTab(t.id); if (t.id === 'patches') loadPatches(); if (t.id === 'instances') loadInstalledVPS(); }}
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
