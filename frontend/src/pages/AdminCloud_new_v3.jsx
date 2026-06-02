import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiServer, FiDatabase, FiAlertTriangle, FiCheckCircle, FiSearch, 
  FiRefreshCw, FiX, FiSave, FiHardDrive, FiUsers, FiTerminal, 
  FiFolder, FiFileText, FiPlay, FiSquare, FiRotateCcw, FiArrowLeft, 
  FiPhone, FiCloud, FiFile, FiMoreHorizontal, FiFilter, FiLink, FiActivity, FiGlobe
} from 'react-icons/fi';

const API = '/api/infrastructure';
const getToken = () => localStorage.getItem('token');
const headers = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

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
  const [stats, setStats] = useState(null);
  const [clients, setClients] = useState([]);
  const [servers, setServers] = useState([]);
  const [auditMatrix, setAuditMatrix] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterServer, setFilterServer] = useState('all');

  // Modals state
  const [pm2Modal, setPm2Modal] = useState({ open: false, serverId: null, data: [], disk: null, loading: false, logs: null, serverName: '' });
  const [fsModal, setFsModal] = useState({ open: false, serverId: null, path: '/var/www/', items: [], loading: false, fileContent: null, fileName: '', serverName: '' });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, c, sv] = await Promise.all([
        axios.get(`${API}/stats`, headers()),
        axios.get(`${API}/pos-clients`, headers()),
        axios.get(`${API}/servers`, headers()),
      ]);
      setStats(s.data.data);
      setClients(c.data.data);
      setServers(sv.data.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const runAudit = async () => {
    setAuditLoading(true);
    setTab('audit');
    try {
      const res = await axios.get(`${API}/audit-integrity`, headers());
      setAuditMatrix(res.data.data);
    } catch (e) { console.error(e); }
    setAuditLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // --- PM2 Actions ---
  const openPm2 = async (server) => {
    setPm2Modal({ open: true, serverId: server.id, serverName: server.name, data: [], disk: null, loading: true, logs: null });
    try {
      const res = await axios.get(`${API}/pm2/${server.id}`, headers());
      setPm2Modal(p => ({ ...p, data: res.data.data, disk: res.data.disk, loading: false }));
    } catch (e) {
      setPm2Modal(p => ({ ...p, loading: false, logs: "Error conectando: " + e.message }));
    }
  };

  const pm2Action = async (action, processName) => {
    try {
      await axios.post(`${API}/pm2/action`, { server_id: pm2Modal.serverId, action, processName }, headers());
      openPm2({ id: pm2Modal.serverId, name: pm2Modal.serverName });
    } catch (e) { alert("Error: " + e.message); }
  };

  const viewPm2Logs = async (processName) => {
    setPm2Modal(p => ({ ...p, loading: true }));
    try {
      const res = await axios.get(`${API}/pm2/${pm2Modal.serverId}/logs/${processName}`, headers());
      setPm2Modal(p => ({ ...p, loading: false, logs: res.data.data }));
    } catch (e) { setPm2Modal(p => ({ ...p, loading: false, logs: "Error fetching logs" })); }
  };

  // --- File System Actions ---
  const openFs = async (server, path = '/var/www/') => {
    setFsModal({ open: true, serverId: server.id, serverName: server.name, path, items: [], loading: true, fileContent: null, fileName: '' });
    try {
      const res = await axios.post(`${API}/fs/${server.id}/list`, { path }, headers());
      setFsModal(p => ({ ...p, items: res.data.data, loading: false }));
    } catch (e) {
      setFsModal(p => ({ ...p, loading: false, fileContent: "Error conectando: " + e.message }));
    }
  };

  const readFile = async (fileName) => {
    const fullPath = fsModal.path.endsWith('/') ? fsModal.path + fileName : fsModal.path + '/' + fileName;
    setFsModal(p => ({ ...p, loading: true, fileContent: null, fileName: fullPath }));
    try {
      const res = await axios.post(`${API}/fs/${fsModal.serverId}/read`, { file_path: fullPath }, headers());
      setFsModal(p => ({ ...p, loading: false, fileContent: res.data.data }));
    } catch (e) { setFsModal(p => ({ ...p, loading: false, fileContent: "Error reading file" })); }
  };

  const saveFile = async () => {
    setFsModal(p => ({ ...p, loading: true }));
    try {
      await axios.post(`${API}/fs/${fsModal.serverId}/write`, { file_path: fsModal.fileName, content: fsModal.fileContent }, headers());
      alert("Archivo guardado correctamente");
      setFsModal(p => ({ ...p, loading: false }));
    } catch (e) { alert("Error guardando: " + e.message); setFsModal(p => ({ ...p, loading: false })); }
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c.domain && c.domain.toLowerCase().includes(search.toLowerCase()));
    const matchesPlan = filterPlan === 'all' || (filterPlan === 'fe' ? c.plan_type?.includes('fe') : !c.plan_type?.includes('fe'));
    const matchesServer = filterServer === 'all' || c.server_name === filterServer;
    return matchesSearch && matchesPlan && matchesServer;
  });

  const totalCpu = pm2Modal.data.reduce((acc, p) => acc + (p.cpu || 0), 0).toFixed(1);
  const totalMemMB = (pm2Modal.data.reduce((acc, p) => acc + (p.memory || 0), 0) / 1024 / 1024).toFixed(1);

  if (loading) return <div className="flex items-center justify-center h-screen bg-gray-50 text-blue-600 font-bold">Cargando Infraestructura Premium...</div>;

  return (
    <div className="min-h-screen bg-gray-50 space-y-6 pb-20 p-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 flex items-center gap-3">
            <FiServer className="text-blue-600" /> Fleet Control Center
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gestión remota de servidores y despliegues POS</p>
        </div>
        <div className="flex gap-3">
          <button onClick={runAudit} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
            <FiActivity /> Correr Auditoría
          </button>
          <button onClick={fetchAll} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95">
            <FiRefreshCw /> Sincronizar
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard icon={FiUsers} label="Clientes" value={stats.totalClients} color="text-blue-600" bg="bg-blue-50" />
          <StatCard icon={FiServer} label="Servidores" value={stats.totalServers} color="text-indigo-600" bg="bg-indigo-50" />
          <StatCard icon={FiDatabase} label="Clusters" value={stats.totalClusters} color="text-cyan-600" bg="bg-cyan-50" />
          <StatCard icon={FiCheckCircle} label="Sanos" value={stats.healthyClients} color="text-green-600" bg="bg-green-50" />
          <StatCard icon={FiAlertTriangle} label="Críticos" value={stats.orphanClients} color="text-red-600" bg="bg-red-50" />
          <StatCard icon={FiHardDrive} label="Total DB" value={`${(stats.totalDbSizeMB / 1024).toFixed(1)}G`} color="text-orange-600" bg="bg-orange-50" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white rounded-xl border border-gray-200 w-fit">
        {[
          {id: 'overview', label: '🖥️ Servidores'},
          {id: 'clients', label: '👥 Clientes POS'},
          {id: 'audit', label: '🛡️ Matriz de Integridad'}
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-6 py-2 rounded-lg font-bold transition-all ${tab === t.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {servers.map(s => (
            <div key={s.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2"><FiServer className="text-blue-600" /> {s.name}</h3>
                  <div className="text-gray-500 text-sm font-mono mt-1 flex items-center gap-2">
                    <span className="bg-gray-100 px-2 py-0.5 rounded">{s.ip}</span>
                    <span>•</span>
                    <span className="font-sans font-medium text-blue-600">{s.total_clients} clientes</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openFs(s)} className="bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-colors"><FiFolder className="text-yellow-600" /> Files</button>
                  <button onClick={() => openPm2(s)} className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-colors shadow-lg shadow-gray-400/30"><FiTerminal /> PM2</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'clients' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px] relative">
              <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
              <input type="text" placeholder="Buscar cliente o dominio..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm" />
            </div>
            <div className="flex items-center gap-3">
              <FiFilter className="text-gray-400" />
              <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blue-500">
                <option value="all">Todos los Planes</option>
                <option value="cloud">Solo Nube</option>
                <option value="fe">Nube + FE</option>
              </select>
              <select value={filterServer} onChange={e => setFilterServer(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-blue-500">
                <option value="all">Todos los Servidores</option>
                {servers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-[11px] font-bold tracking-widest">
                  <tr>
                    <th className="p-5">Cliente</th>
                    <th className="p-5 text-center">Servicio</th>
                    <th className="p-5">Servidor / DB</th>
                    <th className="p-5 text-center">Contacto</th>
                    <th className="p-5 text-center">Estado</th>
                    <th className="p-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredClients.map(c => (
                    <tr key={c.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="p-5">
                        <div className="font-extrabold text-gray-800 text-base">{c.name}</div>
                        <div className="text-xs text-blue-500 font-mono mt-0.5">{c.domain || 'no-domain.com'}</div>
                      </td>
                      <td className="p-5"><div className="flex justify-center"><PlanBadge plan={c.plan_type} /></div></td>
                      <td className="p-5">
                        <div className="flex items-center gap-2 text-gray-700 font-medium">
                          <FiServer className="text-gray-400" size={14} /> {c.server_name}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <FiDatabase className="text-gray-400" size={12} /> {c.cluster_name} ({parseFloat(c.db_size_mb).toFixed(1)} MB)
                        </div>
                      </td>
                      <td className="p-5 text-center">
                        {c.contact_phone !== 'N/A' ? (
                          <a href={`tel:${c.contact_phone}`} className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline">
                            <FiPhone size={14} /> {c.contact_phone}
                          </a>
                        ) : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="p-5 text-center"><StatusBadge status={c.status} /></td>
                      <td className="p-5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openFs({id: c.server_id, name: c.server_name}, `/var/www/${c.name}/`)} className="p-2 text-gray-400 hover:text-blue-600" title="Ver Archivos"><FiFolder /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {auditLoading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <FiActivity className="text-blue-600 animate-spin" size={40} />
              <div className="text-gray-800 font-bold text-xl">Escaneando infraestructura...</div>
              <p className="text-gray-500">Esto puede tomar hasta 30 segundos mientras consultamos PM2 y Nginx en todos los servidores.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-900 text-white uppercase text-[10px] font-bold tracking-widest">
                  <tr>
                    <th className="p-5">Cliente</th>
                    <th className="p-5 text-center">🔗 Link (Nginx)</th>
                    <th className="p-5 text-center">⚙️ Sistema (PM2)</th>
                    <th className="p-5 text-center">🗄️ Base de Datos</th>
                    <th className="p-5 text-center">Salud Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditMatrix.map(item => {
                    const totalHealth = item.status.link && item.status.system && item.status.db;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-5">
                          <div className="font-bold text-gray-800">{item.name}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{item.server_ip}</div>
                        </td>
                        <td className="p-5 text-center">
                          {item.status.link ? <FiCheckCircle className="text-green-500 mx-auto" size={20} /> : <FiAlertTriangle className="text-red-500 mx-auto" size={20} />}
                        </td>
                        <td className="p-5 text-center">
                          {item.status.system ? <FiCheckCircle className="text-green-500 mx-auto" size={20} /> : <FiAlertTriangle className="text-red-500 mx-auto" size={20} />}
                        </td>
                        <td className="p-5 text-center">
                          {item.status.db ? <FiCheckCircle className="text-green-500 mx-auto" size={20} /> : <FiAlertTriangle className="text-red-500 mx-auto" size={20} />}
                        </td>
                        <td className="p-5 text-center">
                          {totalHealth ? 
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">100% OK</span> :
                            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">INCOMPLETO</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL PM2 */}
      {pm2Modal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-white">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-900 text-white">
              <h2 className="text-xl font-bold flex items-center gap-3"><FiTerminal className="text-blue-400" /> PM2 Manager - {pm2Modal.serverName}</h2>
              <button onClick={() => setPm2Modal({ open: false })} className="text-gray-400 hover:text-white transition-colors"><FiX size={24} /></button>
            </div>
            
            {!pm2Modal.loading && !pm2Modal.logs && pm2Modal.data && (
              <div className="bg-gray-50 p-6 border-b border-gray-200 flex flex-wrap gap-4">
                {(() => {
                   const tCpu = pm2Modal.data.reduce((a, p) => a + (p.cpu || 0), 0);
                   const tMem = pm2Modal.data.reduce((a, p) => a + (p.memory || 0), 0) / 1024 / 1024;
                   const maxCpu = tCpu > 800 ? 1600 : 800;
                   const maxMem = tMem > 16384 ? 32768 : 16384;
                   const pctCpu = Math.min((tCpu / maxCpu) * 100, 100);
                   const colorCpu = pctCpu > 80 ? 'bg-red-500' : pctCpu > 50 ? 'bg-yellow-500' : 'bg-green-500';
                   const pctMem = Math.min((tMem / maxMem) * 100, 100);
                   const colorMem = pctMem > 85 ? 'bg-red-500' : pctMem > 65 ? 'bg-yellow-500' : 'bg-green-500';
                   
                   return (
                     <>
                       <div className="flex-1 min-w-[200px] bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                         <div className="flex justify-between text-[11px] mb-2 uppercase font-bold tracking-wider text-gray-500">
                           <span>Uso CPU</span>
                           <span className={pctCpu > 80 ? 'text-red-600' : 'text-gray-800'}>{tCpu.toFixed(1)}%</span>
                         </div>
                         <div className="w-full bg-gray-100 rounded-full h-3">
                           <div className={`h-3 rounded-full ${colorCpu} transition-all duration-700`} style={{ width: `${pctCpu}%` }}></div>
                         </div>
                       </div>
                       <div className="flex-1 min-w-[200px] bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                         <div className="flex justify-between text-[11px] mb-2 uppercase font-bold tracking-wider text-gray-500">
                           <span>Uso RAM</span>
                           <span className={pctMem > 85 ? 'text-red-600' : 'text-gray-800'}>{tMem.toFixed(0)} MB</span>
                         </div>
                         <div className="w-full bg-gray-100 rounded-full h-3">
                           <div className={`h-3 rounded-full ${colorMem} transition-all duration-700`} style={{ width: `${pctMem}%` }}></div>
                         </div>
                       </div>
                       {pm2Modal.disk && (
                         <div className="flex-1 min-w-[200px] bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                           <div className="flex justify-between text-[11px] mb-2 uppercase font-bold tracking-wider text-gray-500">
                             <span>Disco</span>
                             <span className={pm2Modal.disk.percent > 85 ? 'text-red-600' : 'text-gray-800'}>{pm2Modal.disk.percent}%</span>
                           </div>
                           <div className="w-full bg-gray-100 rounded-full h-3">
                             <div className={`h-3 rounded-full ${pm2Modal.disk.percent > 85 ? 'bg-red-500' : 'bg-blue-500'} transition-all duration-700`} style={{ width: `${pm2Modal.disk.percent}%` }}></div>
                           </div>
                         </div>
                       )}
                     </>
                   );
                })()}
              </div>
            )}

            <div className="p-0 flex-1 overflow-y-auto">
              {pm2Modal.loading ? <div className="flex items-center justify-center p-20 text-blue-600 font-bold">Procesando...</div> : 
               pm2Modal.logs ? (
                 <div className="p-6 bg-gray-900 h-full">
                   <button onClick={() => setPm2Modal(p => ({ ...p, logs: null }))} className="mb-4 text-blue-400 flex items-center gap-2 hover:text-blue-300 font-bold"><FiArrowLeft /> Volver a procesos</button>
                   <pre className="bg-black/50 p-6 rounded-2xl text-green-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap h-[50vh] border border-gray-800">{pm2Modal.logs}</pre>
                 </div>
               ) : (
                 <table className="w-full text-sm text-left">
                   <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[10px] uppercase font-bold sticky top-0">
                     <tr><th className="p-4">Proceso</th><th className="p-4">Estado</th><th className="p-4">CPU</th><th className="p-4">Memoria</th><th className="p-4 text-center">Acciones</th></tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {pm2Modal.data.map(p => (
                       <tr key={p.name} className="hover:bg-gray-50">
                         <td className="p-4 font-bold text-gray-800">{p.name}</td>
                         <td className="p-4"><StatusBadge status={p.status} /></td>
                         <td className="p-4 font-mono">{p.cpu}%</td>
                         <td className="p-4 font-mono">{(p.memory / 1024 / 1024).toFixed(1)} MB</td>
                         <td className="p-4">
                           <div className="flex justify-center gap-2">
                             {p.status !== 'online' ? 
                               <button onClick={() => pm2Action('start', p.name)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all"><FiPlay /></button> :
                               <button onClick={() => pm2Action('stop', p.name)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"><FiSquare /></button>
                             }
                             <button onClick={() => pm2Action('restart', p.name)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><FiRotateCcw /></button>
                             <button onClick={() => viewPm2Logs(p.name)} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg font-bold text-xs hover:bg-gray-200 transition-all">LOGS</button>
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

      {/* MODAL FILE EXPLORER */}
      {fsModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-white">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-900 text-white">
              <h2 className="text-xl font-bold flex items-center gap-3"><FiFolder className="text-yellow-400" /> Explorador - {fsModal.serverName}</h2>
              <div className="flex items-center gap-4">
                {fsModal.fileContent !== null && (
                  <button onClick={saveFile} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-green-500/30 active:scale-95"><FiSave /> Guardar Cambios</button>
                )}
                <button onClick={() => setFsModal({ open: false })} className="text-gray-400 hover:text-white"><FiX size={24} /></button>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 flex items-center gap-3 text-sm text-gray-500 border-b border-gray-200">
              {fsModal.fileContent !== null ? (
                <button onClick={() => openFs({ id: fsModal.serverId, name: fsModal.serverName }, fsModal.path)} className="text-blue-600 hover:text-blue-700 flex items-center gap-2 font-bold transition-all"><FiArrowLeft /> Regresar al listado</button>
              ) : (
                <>
                  <FiFilter className="text-gray-400" />
                  <input type="text" value={fsModal.path} onChange={e => setFsModal(p => ({...p, path: e.target.value}))} onKeyDown={e => e.key === 'Enter' && openFs({id: fsModal.serverId, name: fsModal.serverName}, fsModal.path)} className="bg-white border border-gray-200 flex-1 outline-none text-gray-800 font-mono px-3 py-1.5 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                  <button onClick={() => openFs({id: fsModal.serverId, name: fsModal.serverName}, fsModal.path)} className="bg-blue-600 text-white p-2 rounded-lg"><FiSearch /></button>
                </>
              )}
            </div>

            <div className="flex-1 overflow-hidden flex flex-col bg-white">
              {fsModal.loading ? <div className="flex items-center justify-center p-20 text-blue-600 font-bold italic animate-pulse">Navegando...</div> : 
               fsModal.fileContent !== null ? (
                 <textarea value={fsModal.fileContent} onChange={e => setFsModal(p => ({...p, fileContent: e.target.value}))} className="flex-1 w-full bg-gray-900 text-green-400 font-mono text-sm p-8 outline-none resize-none leading-relaxed" spellCheck="false" />
               ) : (
                 <div className="overflow-y-auto flex-1 p-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                     {fsModal.path !== '/' && (
                       <div onClick={() => openFs({id: fsModal.serverId, name: fsModal.serverName}, fsModal.path.split('/').slice(0,-2).join('/') + '/')} className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 cursor-pointer text-gray-600 border border-gray-200 transition-all font-bold group">
                         <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> <span>Carpeta Superior</span>
                       </div>
                     )}
                     {fsModal.items.map(f => (
                       <div key={f.name} onClick={() => f.isDir ? openFs({id: fsModal.serverId, name: fsModal.serverName}, fsModal.path + f.name + '/') : readFile(f.name)} className="flex flex-col p-4 rounded-2xl bg-white border border-gray-200 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all group">
                         <div className="flex items-center gap-3 mb-2">
                           {f.isDir ? <FiFolder size={24} className="text-yellow-500" /> : <FiFileText size={24} className="text-blue-500" />}
                           <span className="text-[10px] text-gray-400 font-bold uppercase ml-auto">{(f.size / 1024).toFixed(1)} KB</span>
                         </div>
                         <span className="truncate text-sm font-bold text-gray-700 group-hover:text-blue-600">{f.name}</span>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
