import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiServer, FiDatabase, FiAlertTriangle, FiCheckCircle, FiSearch, 
  FiRefreshCw, FiX, FiSave, FiHardDrive, FiUsers, FiExternalLink, FiTrash2, FiTerminal, 
  FiFolder, FiFileText, FiPlay, FiSquare, FiRotateCcw, FiArrowLeft, 
  FiPhone, FiCloud, FiFile, FiMoreHorizontal, FiFilter, FiLink, FiActivity, FiGlobe,
  FiEdit, FiTrash2, FiChevronRight, FiChevronLeft, FiPlus
} from 'react-icons/fi';

const API = '/api/infrastructure';
const getToken = () => localStorage.getItem('token');
const headers = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

// --- UTILS ---
const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-center gap-4 mb-3">
      <div className={`p-3 rounded-xl ${bg} ${color} group-hover:scale-110 transition-transform`}><Icon size={22} /></div>
      <span className="text-gray-500 font-medium text-sm">{label}</span>
    </div>
    <div className="text-3xl font-bold text-gray-800">{value}</div>
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    active: { bg: 'bg-green-100 text-green-700 border-green-200', text: 'Activo' },
    empty_db: { bg: 'bg-red-100 text-red-700 border-red-200', text: 'DB Vacía' },
    orphan: { bg: 'bg-orange-100 text-orange-700 border-orange-200', text: 'Huérfano' },
    online: { bg: 'bg-green-100 text-green-700 border-green-200', text: 'Online' },
    stopped: { bg: 'bg-gray-100 text-gray-700 border-gray-200', text: 'Detenido' },
    errored: { bg: 'bg-red-100 text-red-700 border-red-200', text: 'Error' },
  };
  const s = map[status] || { bg: 'bg-gray-100 text-gray-600 border-gray-200', text: status || 'Unknown' };
  return <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${s.bg}`}>{s.text}</span>;
};

const PlanBadge = ({ plan }) => {
  const isFE = plan && plan.toLowerCase().includes('fe');
  return (
    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit ${isFE ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
      {isFE ? <><FiFile size={10} /> Nube + FE</> : <><FiCloud size={10} /> Solo Nube</>}
    </span>
  );
};

export default function AdminCloud() {
  const [activeTab, setActiveTab] = useState('infra');
  const [crossCheckData, setCrossCheckData] = useState(null);
  const [loadingCrossCheck, setLoadingCrossCheck] = useState(false);

  const [stats, setStats] = useState(null);
  const [clients, setClients] = useState([]);
  const [servers, setServers] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // --- Modals States ---
  const [pm2Modal, setPm2Modal] = useState({ open: false, serverId: null, data: [], loading: false, serverName: '' });
  const [fsModal, setFsModal] = useState({ open: false, serverId: null, path: '/var/www/', items: [], loading: false, fileContent: null, fileName: '', serverName: '' });
  const [mongoModal, setMongoModal] = useState({
    lastActivity: null, 
    open: false, clusterId: null, clusterName: '', dbName: null, colName: null, 
    databases: [], collections: [], documents: [], total: 0, page: 1, loading: false,
    editingDoc: null, docJson: ''
  });
  const [clientModal, setClientModal] = useState({ open: false, client: null, saving: false });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, c, sv, cl] = await Promise.all([
        axios.get(`${API}/stats`, headers()),
        axios.get(`${API}/pos-clients`, headers()),
        axios.get(`${API}/servers`, headers()),
        axios.get(`${API}/clusters`, headers()),
      ]);
      setStats(s.data.data);
      setClients(c.data.data);
      setServers(sv.data.data);
      setClusters(cl.data.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchCrossCheck = async () => {
    setLoadingCrossCheck(true);
    try {
      const res = await axios.get('/api/billing/cross-check', headers());
      setCrossCheckData(res.data);
    } catch (e) { console.error(e); }
    setLoadingCrossCheck(false);
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (activeTab === 'crossCheck' && !crossCheckData) fetchCrossCheck(); }, [activeTab]);

  // --- HANDLERS ---
  
  // 1. Client Hub (Admin Info)
  const openClientHub = (client) => {
    setClientModal({ open: true, client: { ...client }, saving: false });
  };

  const deleteFullClient = async () => {
    if (!window.confirm("¿Estás SEGURO de eliminar este cliente? Esta acción no se puede deshacer.")) return;
    const dropDb = window.confirm("¿También quieres ELIMINAR la base de datos de MongoDB?");
    try {
      await api.delete(`/infrastructure/clients/${clientModal.client.id}`, { data: { dropDatabase: dropDb } });
      setClientModal({ open: false });
      fetchClients();
      alert("Cliente eliminado con éxito");
    } catch (e) { alert("Error al eliminar: " + e.message); }
  };

  const saveClientData = async () => {
    setClientModal(p => ({ ...p, saving: true }));
    try {
      await axios.put(`${API}/pos-clients/${clientModal.client.id}`, clientModal.client, headers());
      setClientModal({ open: false, client: null, saving: false });
      fetchAll();
    } catch (e) { alert("Error guardando cliente: " + e.message); setClientModal(p => ({ ...p, saving: false })); }
  };

  // 2. Server Hub (PM2 + FS)
  const openServerHub = async (serverId, serverName) => {
    setPm2Modal({ open: true, serverId, serverName, data: [], loading: true });
    try {
      const res = await axios.get(`${API}/pm2/${serverId}`, headers());
      setPm2Modal(p => ({ ...p, data: res.data.data, loading: false }));
    } catch (e) { setPm2Modal(p => ({ ...p, loading: false })); }
  };

  const pm2Action = async (action, processName) => {
    try {
      await axios.post(`${API}/pm2/${pm2Modal.serverId}/${action}`, { processName }, headers());
      openServerHub(pm2Modal.serverId, pm2Modal.serverName);
    } catch (e) { alert("Error PM2: " + e.message); }
  };

  // 3. Mongo Hub (Explorer)
  const openMongoHub = async (clusterId, clusterName, dbName = null) => {
    setMongoModal(p => ({ ...p, open: true, clusterId, clusterName, dbName, colName: null, loading: true, databases: [], collections: [], documents: [] }));
    try {
      const res = await axios.get(`${API}/mongo/${clusterId}/dbs`, headers());
      setMongoModal(p => ({ ...p, databases: res.data.data, loading: false }));
      if (dbName) selectDb(clusterId, dbName);
    } catch (e) { setMongoModal(p => ({ ...p, loading: false })); }
  };

  const selectDb = async (clusterId, dbName) => {
    setMongoModal(p => ({ ...p, dbName, colName: null, loading: true, collections: [], documents: [] }));
    try {
      const res = await axios.get(`${API}/mongo/${clusterId}/${dbName}/collections`, headers());
      setMongoModal(p => ({ ...p, collections: res.data.data, loading: false }));
    } catch (e) { setMongoModal(p => ({ ...p, loading: false })); }
  };

  const selectCol = async (clusterId, dbName, colName, page = 1) => {
    setMongoModal(p => ({ ...p, colName, page, loading: true, documents: [] }));
    try {
      const res = await axios.get(`${API}/mongo/${clusterId}/${dbName}/${colName}/documents?page=${page}`, headers());
      setMongoModal(p => ({ ...p, documents: res.data.data, total: res.data.total, loading: false }));
    } catch (e) { setMongoModal(p => ({ ...p, loading: false })); }
  };

  const editDoc = (doc) => {
    setMongoModal(p => ({ ...p, editingDoc: doc, docJson: JSON.stringify(doc, null, 2) }));
  };

  const saveDoc = async () => {
    try {
      const updateData = JSON.parse(mongoModal.docJson);
      await axios.put(`${API}/mongo/${mongoModal.clusterId}/${mongoModal.dbName}/${mongoModal.colName}/${mongoModal.editingDoc._id}`, { updateData }, headers());
      setMongoModal(p => ({ ...p, editingDoc: null }));
      selectCol(mongoModal.clusterId, mongoModal.dbName, mongoModal.colName, mongoModal.page);
    } catch (e) { alert("Error guardando JSON: " + e.message); }
  };

  const deleteDoc = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este documento?")) return;
    try {
      await axios.delete(`${API}/mongo/${mongoModal.clusterId}/${mongoModal.dbName}/${mongoModal.colName}/${id}`, headers());
      selectCol(mongoModal.clusterId, mongoModal.dbName, mongoModal.colName, mongoModal.page);
    } catch (e) { alert("Error eliminando: " + e.message); }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.domain && c.domain.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="flex items-center justify-center h-screen bg-gray-50 text-blue-600 font-bold">Cargando Infraestructura SIMIDS...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <FiCloud className="text-blue-600" /> AdminCloud <span className="text-gray-400 font-light">| HUB</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gestión Centralizada de Clientes, Servidores y Bases de Datos</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setActiveTab('infra')} className={`px-6 py-2 rounded-lg font-bold transition-all text-sm ${activeTab === 'infra' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Infraestructura</button>
            <button onClick={() => setActiveTab('crossCheck')} className={`px-6 py-2 rounded-lg font-bold transition-all text-sm flex items-center gap-2 ${activeTab === 'crossCheck' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><FiActivity /> Cruce y Uso</button>
          </div>
          <button onClick={activeTab === 'infra' ? fetchAll : fetchCrossCheck} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all shadow-sm active:scale-95 text-sm">
            <FiRefreshCw /> Sincronizar
          </button>
        </div>
      </div>

      {activeTab === 'infra' && (
        <>
      {/* Stats Quick View */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard icon={FiUsers} label="Clientes" value={stats.totalClients} color="text-blue-600" bg="bg-blue-50" />
          <StatCard icon={FiServer} label="Servidores" value={stats.totalServers} color="text-indigo-600" bg="bg-indigo-50" />
          <StatCard icon={FiDatabase} label="Clusters" value={stats.totalClusters} color="text-cyan-600" bg="bg-cyan-50" />
          <StatCard icon={FiCheckCircle} label="Sanos" value={stats.healthyClients} color="text-green-600" bg="bg-green-50" />
          <StatCard icon={FiAlertTriangle} label="Críticos" value={stats.orphanClients} color="text-red-600" bg="bg-red-50" />
          <StatCard icon={FiHardDrive} label="Storage" value={`${(stats.totalDbSizeMB / 1024).toFixed(1)}G`} color="text-orange-600" bg="bg-orange-50" />
        </div>
      )}

      {/* Main Content: Client-Centric Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-4 top-3.5 text-gray-400" />
            <input 
              type="text" placeholder="Buscar por cliente, dominio o negocio..." 
              value={search} onChange={e => setSearch(e.target.value)} 
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium"
            />
          </div>
          <div className="text-sm font-bold text-gray-400 px-4 uppercase tracking-widest">{filteredClients.length} Clientes Filtrados</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Cliente / ID</th>
                <th className="px-6 py-4">Infraestructura (Click para Hub)</th>
                <th className="px-6 py-4 text-center">Plan</th>
                <th className="px-6 py-4 text-center">Triple Check</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClients.map(c => {
                const srv = servers.find(s => s.name === c.server_name);
                const clu = clusters.find(cl => cl.name === c.cluster_name);
                return (
                  <tr key={c.id} className="hover:bg-blue-50/20 transition-all group">
                    <td className="px-6 py-5">
                      <div className="font-bold text-gray-900 text-lg cursor-pointer hover:text-blue-600 flex items-center gap-2" onClick={() => openClientHub(c)}>
                        {c.name} <FiMoreHorizontal className="opacity-0 group-hover:opacity-100 text-gray-300" size={14} />
                      </div>
                      <a href={"https://" + (c.domain || "no-domain.com")} target="_blank" className="text-xs text-indigo-500 font-mono mt-0.5 hover:underline flex items-center gap-2">{c.domain || "no-domain.com"} <FiExternalLink size={10} /></a>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <div 
                          className="flex items-center gap-2 text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-lg w-fit cursor-pointer hover:bg-indigo-600 hover:text-white transition-all font-bold"
                          onClick={() => srv && openServerHub(srv.id, srv.name)}
                        >
                          <FiServer size={14} /> {c.server_name}
                        </div>
                        <div 
                          className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 px-3 py-1 rounded-lg w-fit cursor-pointer hover:bg-cyan-600 hover:text-white transition-all font-medium"
                          onClick={() => clu && openMongoHub(clu.id, clu.name, c.db_name)}
                        >
                          <FiDatabase size={12} /> {c.cluster_name} <span className="opacity-50">|</span> {c.db_name} <span className="font-bold">({parseFloat(c.db_size_mb).toFixed(1)} MB)</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center"><PlanBadge plan={c.plan_type} /></td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center gap-3">
                        <div className={`p-1.5 rounded-full ${c.has_link ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`} title="Nginx Link"><FiGlobe size={16} /></div>
                        <div className={`p-1.5 rounded-full ${c.has_system ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`} title="PM2 Process"><FiTerminal size={16} /></div>
                        <div className={`p-1.5 rounded-full ${c.has_db ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`} title="Mongo DB"><FiDatabase size={16} /></div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center"><StatusBadge status={c.status} /></td>
                    <td className="px-6 py-5 text-right">
                      <button onClick={() => openClientHub(c)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><FiEdit size={18} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {activeTab === 'crossCheck' && (
        <div className="space-y-6">
          {loadingCrossCheck ? (
            <div className="flex justify-center p-12 text-indigo-600 font-bold"><FiRefreshCw className="animate-spin text-2xl mr-3" /> Analizando cruce de datos...</div>
          ) : crossCheckData ? (
            <>
              {/* Resumen de Cruce */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard icon={FiCheckCircle} label="Al Día" value={crossCheckData.stats.al_dia} color="text-green-600" bg="bg-green-50" />
                <StatCard icon={FiAlertTriangle} label="En Mora" value={crossCheckData.stats.en_mora} color="text-orange-600" bg="bg-orange-50" />
                <StatCard icon={FiFileText} label="Sin Facturar" value={crossCheckData.stats.sin_facturar} color="text-red-600" bg="bg-red-50" />
                <StatCard icon={FiDatabase} label="Nubes Huérfanas" value={crossCheckData.stats.nubes_huerfanas} color="text-purple-600" bg="bg-purple-50" />
                <StatCard icon={FiAlertTriangle} label="Datos Incompletos" value={crossCheckData.stats.datos_incompletos} color="text-gray-600" bg="bg-gray-100" />
              </div>

              {/* Huérfanos */}
              {crossCheckData.orphan_clouds?.length > 0 && (
                <div className="bg-white rounded-3xl border border-red-200 shadow-sm overflow-hidden mt-6">
                  <div className="p-4 bg-red-50 border-b border-red-100 text-red-800 font-bold flex items-center gap-2">
                    <FiAlertTriangle /> Nubes Huérfanas Detectadas (Infraestructura activa pero sin registro en CRM)
                  </div>
                  <div className="p-4 divide-y divide-gray-100">
                    {crossCheckData.orphan_clouds.map(oc => (
                      <div key={oc.id} className="py-3 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-gray-800">{oc.name || oc.domain}</div>
                          <div className="text-xs text-gray-500 font-mono mt-1">Dueño: {oc.owner_name} - {oc.owner_phone}</div>
                        </div>
                        <StatusBadge status="orphan" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clientes con Problemas */}
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden mt-6">
                <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-gray-700 flex justify-between items-center">
                  <span>Reporte General de Clientes</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 text-[11px] text-gray-500 font-bold uppercase tracking-widest border-b border-gray-100">
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4">Estado</th>
                        <th className="px-6 py-4">Meses CRM</th>
                        <th className="px-6 py-4">Factura DIAN</th>
                        <th className="px-6 py-4">Problemas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {crossCheckData.report.map(r => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{r.business_name}</div>
                            <div className="text-[11px] text-gray-500 font-mono">{r.nit}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                              r.status_check === 'Al día' ? 'bg-green-100 text-green-700' :
                              r.status_check === 'En mora' ? 'bg-orange-100 text-orange-700' :
                              r.status_check === 'Sin facturar' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                            }`}>{r.status_check}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2 text-xs">
                              <span className="text-green-600 font-bold" title="Pagados">{r.stats.paid} ✓</span>
                              <span className="text-orange-600 font-bold" title="Pendientes">{r.stats.pending} ⏳</span>
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1">Último: {r.latest_billing_month}</div>
                          </td>
                          <td className="px-6 py-4">
                            {r.latest_invoice ? (
                              <div>
                                <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{r.latest_invoice.prefijo}-{r.latest_invoice.numero_dian || r.latest_invoice.numero}</span>
                              </div>
                            ) : <span className="text-gray-400 italic text-xs">Sin factura</span>}
                          </td>
                          <td className="px-6 py-4 text-xs text-red-500 font-medium">
                            {!r.data_completeness.complete && <div>Falta: {r.data_completeness.missing.join(', ')}</div>}
                            {!r.usage && <div className="text-orange-500">Sin nube enlazada</div>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* --- MODAL CLIENT HUB --- */}
      {clientModal.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-white">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-900 to-gray-800 text-white">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3"><FiUsers className="text-blue-400" /> Perfil de Cliente</h2>
                <p className="text-gray-400 text-sm mt-1">{clientModal.client.name}</p>
              </div>
              <button onClick={() => setClientModal({ open: false })} className="text-gray-400 hover:text-white"><FiX size={28} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nombre Dueño</label>
                  <input type="text" value={clientModal.client.owner_name || ''} onChange={e => setClientModal(p => ({ ...p, client: { ...p.client, owner_name: e.target.value }}))} className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">WhatsApp / Celular</label>
                  <input type="text" value={clientModal.client.owner_phone || ''} onChange={e => setClientModal(p => ({ ...p, client: { ...p.client, owner_phone: e.target.value }}))} className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Notas Administrativas</label>
                  <textarea value={clientModal.client.notes || ''} onChange={e => setClientModal(p => ({ ...p, client: { ...p.client, notes: e.target.value }}))} className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium h-24 resize-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Estado Sistema</label>
                  <select value={clientModal.client.status} onChange={e => setClientModal(p => ({ ...p, client: { ...p.client, status: e.target.value }}))} className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-bold">
                    <option value="active">Activo</option>
                    <option value="suspended">Suspendido</option>
                    <option value="orphan">Huérfano</option>
                    <option value="empty_db">Base Vacía</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setClientModal({ open: false })} className="px-6 py-3 rounded-xl text-gray-500 font-bold hover:bg-gray-200 transition-all">Cancelar</button>
              <button onClick={saveClientData} disabled={clientModal.saving} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50">
                {clientModal.saving ? <FiRefreshCw className="animate-spin" /> : <FiSave />} Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL SERVER HUB (PM2) --- */}
      {pm2Modal.open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-white">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-900 text-white">
              <h2 className="text-xl font-bold flex items-center gap-3"><FiTerminal className="text-blue-400" /> PM2 Manager - {pm2Modal.serverName}</h2>
              <button onClick={() => setPm2Modal({ open: false })} className="text-gray-400 hover:text-white"><FiX size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {pm2Modal.loading ? <div className="p-20 text-center font-bold text-blue-600">Conectando con el servidor...</div> : (
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] text-gray-500 font-bold uppercase tracking-widest sticky top-0">
                    <tr>
                      <th className="px-6 py-4">Proceso</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4 text-center">CPU</th>
                      <th className="px-6 py-4 text-center">RAM</th>
                      <th className="px-6 py-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono text-sm">
                    {pm2Modal.data.map(p => (
                      <tr key={p.name} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-bold text-gray-800">{p.name}</td>
                        <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                        <td className="px-6 py-4 text-center">{p.cpu}%</td>
                        <td className="px-6 py-4 text-center">{(p.memory / 1024 / 1024).toFixed(1)} MB</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            {p.status !== 'online' ? 
                              <button onClick={() => pm2Action('start', p.name)} className="p-2 text-green-600 hover:bg-green-100 rounded-lg"><FiPlay /></button> :
                              <button onClick={() => pm2Action('stop', p.name)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg"><FiSquare /></button>
                            }
                            <button onClick={() => pm2Action('restart', p.name)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><FiRotateCcw /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL MONGO HUB (EXPLORER) --- */}
      {mongoModal.open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-7xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-950 text-white">
              <div className="flex items-center gap-4">
                <FiDatabase size={24} className="text-cyan-400" />
                <div>
                  <h2 className="text-xl font-bold">MongoHub - {mongoModal.clusterName}</h2>
                  {mongoModal.lastActivity && (
                    <div className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full inline-block mt-1 font-bold">
                      Última actividad: {mongoModal.lastActivity === "No data" ? "Sin datos" : new Date(mongoModal.lastActivity).toLocaleDateString()}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-indigo-300 font-mono">
                    {mongoModal.dbName && <span>{mongoModal.dbName}</span>}
                    {mongoModal.colName && <><FiChevronRight /> <span>{mongoModal.colName}</span></>}
                  </div>
                </div>
              </div>
              <button onClick={() => setMongoModal(p => ({ ...p, open: false }))} className="text-indigo-400 hover:text-white"><FiX size={28} /></button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar: DBs & Collections */}
              <div className="w-72 bg-gray-50 border-r border-gray-100 overflow-y-auto flex flex-col">
                <div className="p-4 border-b border-gray-100 bg-white">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Bases de Datos</h3>
                  <div className="space-y-1">
                    {mongoModal.databases.map(db => (
                      <div 
                        key={db.name} onClick={() => selectDb(mongoModal.clusterId, db.name)}
                        className={`px-4 py-2.5 rounded-xl cursor-pointer text-sm font-bold flex items-center gap-3 transition-all ${mongoModal.dbName === db.name ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-indigo-50 text-gray-600'}`}
                      >
                        <FiHardDrive size={14} /> {db.name}
                      </div>
                    ))}
                  </div>
                </div>
                {mongoModal.dbName && (
                  <div className="p-4">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Colecciones</h3>
                    <div className="space-y-1">
                      {mongoModal.collections.map(col => (
                        <div 
                          key={col.name} onClick={() => selectCol(mongoModal.clusterId, mongoModal.dbName, col.name)}
                          className={`px-4 py-2.5 rounded-xl cursor-pointer text-sm font-bold flex items-center justify-between transition-all ${mongoModal.colName === col.name ? 'bg-cyan-600 text-white shadow-lg' : 'hover:bg-cyan-50 text-gray-600'}`}
                        >
                          <span className="flex items-center gap-3"><FiFileText size={14} /> {col.name}</span>
                          <span className="text-[10px] opacity-60">{col.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Main: Documents */}
              <div className="flex-1 bg-white overflow-hidden flex flex-col">
                {mongoModal.editingDoc ? (
                  <div className="flex-1 flex flex-col">
                    <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
                      <span className="font-mono text-sm">Editando: {mongoModal.editingDoc._id}</span>
                      <div className="flex gap-2">
                        <button onClick={() => setMongoModal(p => ({ ...p, editingDoc: null }))} className="px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-800">Cancelar</button>
                        <button onClick={saveDoc} className="px-6 py-1.5 bg-green-600 rounded-lg text-sm font-bold hover:bg-green-700 flex items-center gap-2"><FiSave /> Guardar Documento</button>
                      </div>
                    </div>
                    <textarea 
                      value={mongoModal.docJson} 
                      onChange={e => setMongoModal(p => ({ ...p, docJson: e.target.value }))}
                      className="flex-1 w-full bg-black text-green-400 font-mono text-sm p-6 outline-none resize-none"
                    />
                  </div>
                ) : !mongoModal.colName ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
                    <FiDatabase size={64} className="opacity-10" />
                    <p className="font-bold">Selecciona una base de datos y colección para explorar</p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-lg font-black text-gray-800">{mongoModal.colName}</div>
                        <div className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-500">{mongoModal.total} documentos</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => selectCol(mongoModal.clusterId, mongoModal.dbName, mongoModal.colName, mongoModal.page - 1)} disabled={mongoModal.page === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"><FiChevronLeft /></button>
                        <span className="text-sm font-bold px-3">Página {mongoModal.page}</span>
                        <button onClick={() => selectCol(mongoModal.clusterId, mongoModal.dbName, mongoModal.colName, mongoModal.page + 1)} className="p-2 rounded-lg hover:bg-gray-100"><FiChevronRight /></button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
                      {mongoModal.documents.map(doc => (
                        <div key={doc._id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-all group relative overflow-hidden">
                          <div className="absolute right-3 top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => editDoc(doc)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"><FiEdit size={14} /></button>
                            <button onClick={() => deleteDoc(doc._id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><FiTrash2 size={14} /></button>
                          </div>
                          <pre className="text-[11px] font-mono text-gray-700 whitespace-pre-wrap overflow-hidden">
                            {JSON.stringify(doc, (key, val) => key === '_id' ? val : val, 2).slice(0, 500)}
                            {JSON.stringify(doc).length > 500 && '...'}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
