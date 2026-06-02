import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaServer, FaDatabase, FaCheckCircle, FaExclamationTriangle, FaSearch, FaSync, FaGlobe, FaTerminal, FaEdit, FaUserPlus, FaSpinner, FaHdd, FaUsers, FaCloud, FaFileInvoice, FaDownload, FaTrash, FaUpload, FaExternalLinkAlt, FaTimesCircle } from 'react-icons/fa';

const API = '/infrastructure';

const StatCard = ({ icon: Icon, label, value, color, bg, onClick, active }) => (
  <div 
    onClick={onClick}
    className={`${bg} rounded-2xl p-4 border transition-all duration-300 ${active ? 'border-blue-500 ring-4 ring-blue-100 shadow-md scale-[1.02]' : 'border-gray-100'} ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-98' : ''}`}
  >
    <div className="flex items-center gap-3 mb-2">
      <Icon className={`${color}`} />
      <span className="text-gray-500 text-xs font-bold uppercase">{label}</span>
    </div>
    <div className="text-2xl font-black text-gray-800">{value}</div>
  </div>
);

const PlanBadge = ({ plan }) => {
  const p = plan ? plan.toLowerCase() : '';
  if (p === 'nube') return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-[10px] font-bold uppercase">☁️ Nube</span>;
  if (p === 'nube_hibrida') return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-[10px] font-bold uppercase">☁️ Nube Híbrida</span>;
  if (p === 'monocaja') return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-[10px] font-bold uppercase">📦 Monocaja</span>;
  if (p === 'multicaja') return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-[10px] font-bold uppercase">📦 Multicaja</span>;
  if (p === 'facturacion_electronica') return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold uppercase">🧾 Fact. Electrónica</span>;
  return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-[10px] font-bold uppercase">{plan || 'Desconocido'}</span>;
};

const StatusBadge = ({ status }) => {
  const map = {
    active: 'bg-green-100 text-green-700',
    empty_db: 'bg-red-100 text-red-700',
    orphan: 'bg-orange-100 text-orange-700',
  };
  return <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-600'}`}>{status || 'N/A'}</span>;
};

export default function CloudTab({ crmClients, onEditClick }) {
  const [stats, setStats] = useState(null);
  const [clients, setClients] = useState([]);
  const [servers, setServers] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [syncingId, setSyncingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('todos'); // 'todos', 'sanos', 'criticos'
  const [syncingIntegrity, setSyncingIntegrity] = useState(false);
  const [showServersModal, setShowServersModal] = useState(false);
  const [showClustersModal, setShowClustersModal] = useState(false);
  const [selectedServerId, setSelectedServerId] = useState(null);
  const [selectedServerName, setSelectedServerName] = useState(null);
  const [selectedClusterId, setSelectedClusterId] = useState(null);
  const [selectedClusterName, setSelectedClusterName] = useState(null);
  const [revealedClusters, setRevealedClusters] = useState({});

  // Inspector Panel States
  const [inspectClient, setInspectClient] = useState(null);
  const [inspectTab, setInspectTab] = useState('nginx'); // 'nginx', 'pm2', 'db'
  const [inspectLoading, setInspectLoading] = useState(false);
  const [pm2Status, setPm2Status] = useState(null);
  const [pm2Logs, setPm2Logs] = useState('');
  const [dbCollections, setDbCollections] = useState([]);
  const [dbActivity, setDbActivity] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, c, sv, cl] = await Promise.all([
        axios.get(`${API}/stats`),
        axios.get(`${API}/pos-clients`),
        axios.get(`${API}/servers`),
        axios.get(`${API}/clusters`),
      ]);
      setStats(s.data.data);
      setClients(c.data.data);
      setServers(sv.data.data);
      setClusters(cl.data.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSync = async (infraClient) => {
    setSyncingId(infraClient.id);
    try {
      const res = await axios.post('/clients/sync-from-infra', { infra_client_id: infraClient.id });
      if (res.data.success) {
        alert(`✅ ${infraClient.name} sincronizado al CRM exitosamente`);
        fetchAll();
      }
    } catch (e) {
      alert('Error sincronizando: ' + e.message);
    }
    setSyncingId(null);
  };

  const handleFullSync = async () => {
    setSyncingIntegrity(true);
    try {
      await axios.post('/infrastructure/audit-integrity');
      await fetchAll();
      alert('✅ Auditoría y auto-descubrimiento en tiempo real de todos los servidores y bases de datos completado.');
    } catch (error) {
      console.error(error);
      alert('Error ejecutando auditoría: ' + (error.response?.data?.error || error.message));
    } finally {
      setSyncingIntegrity(false);
    }
  };

  const handleInspect = async (client, tab) => {
    setInspectClient(client);
    setInspectTab(tab);
    setInspectLoading(true);
    setPm2Status(null);
    setPm2Logs('');
    setDbCollections([]);
    setDbActivity(null);
    
    try {
      if (tab === 'pm2') {
        const res = await axios.get(`/infrastructure/pm2/${client.server_id}`);
        if (res.data.success) {
          // Find matching process by name
          const proc = res.data.data.find(p => p.name.includes(client.name));
          setPm2Status(proc || { name: client.name, status: 'stopped', cpu: 0, memory: 0 });
        }
      } else if (tab === 'db') {
        // Fetch database activity (last invoice/use)
        try {
          const actRes = await axios.get(`/infrastructure/mongo/activity/${client.cluster_id}/${client.db_name}`);
          if (actRes.data.success) {
            setDbActivity(actRes.data.lastActivity);
          }
        } catch (err) { console.error('Error fetching db activity:', err); }
        
        // Fetch collection stats
        try {
          const colRes = await axios.get(`/infrastructure/mongo/${client.cluster_id}/${client.db_name}/collections`);
          if (colRes.data.success) {
            setDbCollections(colRes.data.data);
          }
        } catch (err) { console.error('Error fetching db collections:', err); }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInspectLoading(false);
    }
  };

  const loadPm2Logs = async () => {
    if (!inspectClient) return;
    setInspectLoading(true);
    try {
      const res = await axios.get(`/infrastructure/pm2/${inspectClient.server_id}/logs/${inspectClient.name}`);
      if (res.data.success) {
        setPm2Logs(res.data.data);
      }
    } catch (err) {
      setPm2Logs('Error al cargar logs del VPS: ' + err.message);
    } finally {
      setInspectLoading(false);
    }
  };

  const [backingUpId, setBackingUpId] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteModalClient, setDeleteModalClient] = useState(null);
  const [dropDatabase, setDropDatabase] = useState(false);

  const handleRestoreClick = (client) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const backupData = JSON.parse(e.target.result);
          
          if (!backupData || !backupData.collections) {
            alert('❌ El archivo no tiene un formato de respaldo válido de SIMIDS.');
            return;
          }
          
          const confirmText = `⚠️ ADVERTENCIA: Estás a punto de RESTAURAR la base de datos de ${client.name}.\n\nEsto sobrescribirá y reemplazará TODAS las colecciones existentes con el contenido de este archivo.\n\n¿Estás seguro de que deseas continuar?`;
          if (!window.confirm(confirmText)) return;
          
          setRestoringId(client.id);
          const token = localStorage.getItem('token');
          const res = await axios.post(`${API}/clients/${client.id}/restore`, 
            { backupData }, 
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          
          if (res.data.success) {
            alert(`✅ Base de datos de ${client.name} restaurada exitosamente.`);
            fetchAll();
          }
        } catch (err) {
          alert('Error leyendo o restaurando el archivo: ' + err.message);
        } finally {
          setRestoringId(null);
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  };

  const handleBackup = async (client) => {
    setBackingUpId(client.id);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/clients/${client.id}/backup`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = `backup_${client.name}_${Date.now()}.json`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      alert('✅ Respaldo descargado exitosamente en tu equipo');
    } catch (e) {
      alert('Error generando respaldo: ' + e.message);
    }
    setBackingUpId(null);
  };

  const handleDeleteClick = (client) => {
    setDeleteModalClient(client);
    setDropDatabase(false);
  };

  const confirmDelete = async () => {
    if (!deleteModalClient) return;
    const client = deleteModalClient;
    setDeleteModalClient(null);
    setDeletingId(client.id);
    
    try {
      // 1. OBLIGATORIO: Descargar respaldo antes de borrar para máxima seguridad
      if (client.has_db) {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`${API}/clients/${client.id}/backup`, {
            responseType: 'blob',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const url = window.URL.createObjectURL(new Blob([res.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `backup_antes_de_eliminar_${client.name}_${Date.now()}.json`);
          document.body.appendChild(link);
          link.click();
          link.remove();
        } catch (backupError) {
          console.warn('Backup pre-delete failed, but proceeding:', backupError);
        }
      }
      
      // 2. Ejecutar la llamada de borrado
      const token = localStorage.getItem('token');
      const res = await axios.delete(`${API}/clients/${client.id}`, {
        data: { dropDatabase },
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.data.success) {
        alert(`🗑️ ${client.name} y su infraestructura fueron eliminados con éxito.`);
        fetchAll();
      }
    } catch (e) {
      alert('Error eliminando cliente: ' + e.message);
    }
    setDeletingId(null);
  };

  const filtered = clients.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(search.toLowerCase()) ||
                          c.domain?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    
    if (filterStatus === 'sanos') return c.status === 'active';
    if (filterStatus === 'criticos') return c.status === 'empty_db' || c.status === 'orphan';
    return true;
  });

  if (loading) return <div className="py-20 text-center text-blue-600 font-bold">Cargando infraestructura...</div>;

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard 
            icon={FaUsers} 
            label="Clientes" 
            value={stats.totalClients} 
            color="text-blue-600" 
            bg="bg-blue-50" 
            onClick={() => setFilterStatus('todos')}
            active={filterStatus === 'todos'}
          />
          <StatCard 
            icon={FaServer} 
            label="Servidores" 
            value={stats.totalServers} 
            color="text-indigo-600" 
            bg="bg-indigo-50" 
            onClick={() => {
              setSelectedServerId(null);
              setSelectedServerName(null);
              setShowServersModal(true);
            }}
          />
          <StatCard 
            icon={FaDatabase} 
            label="Clusters" 
            value={stats.totalClusters} 
            color="text-cyan-600" 
            bg="bg-cyan-50" 
            onClick={() => {
              setSelectedClusterId(null);
              setSelectedClusterName(null);
              setShowClustersModal(true);
            }}
          />
          <StatCard 
            icon={FaCheckCircle} 
            label="Sanos" 
            value={stats.healthyClients} 
            color="text-green-600" 
            bg="bg-green-50" 
            onClick={() => setFilterStatus('sanos')}
            active={filterStatus === 'sanos'}
          />
          <StatCard 
            icon={FaExclamationTriangle} 
            label="Críticos" 
            value={stats.orphanClients} 
            color="text-red-600" 
            bg="bg-red-50" 
            onClick={() => setFilterStatus('criticos')}
            active={filterStatus === 'criticos'}
          />
          <StatCard icon={FaHdd} label="Storage" value={`${(stats.totalDbSizeMB / 1024).toFixed(1)}G`} color="text-orange-600" bg="bg-orange-50" />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center gap-4 bg-gray-50/30">
          <div className="relative flex-1 w-full">
            <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
            <input type="text" placeholder="Buscar cliente o dominio..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium" />
          </div>
          
          {filterStatus !== 'todos' && (
            <button 
              onClick={() => setFilterStatus('todos')} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all active:scale-95 ${filterStatus === 'sanos' ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'}`}
            >
              Filtro: {filterStatus === 'sanos' ? '🟢 Sanos' : '🔴 Críticos'} ✕
            </button>
          )}

          <button 
            onClick={handleFullSync} 
            disabled={syncingIntegrity || loading}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition active:scale-95 disabled:opacity-50"
          >
            {syncingIntegrity ? <FaSpinner className="animate-spin text-blue-600" /> : <FaSync className={loading ? "animate-spin text-blue-600" : ""} />}
            {syncingIntegrity ? "Auditando VPS..." : "Sincronizar"}
          </button>
          <span className="text-xs font-black text-gray-500 uppercase">{filtered.length} / {clients.length} clientes</span>
        </div>

        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase tracking-wider font-bold sticky top-0">
              <tr>
                <th className="px-4 py-3">Cliente / ID</th>
                <th className="px-4 py-3">Infraestructura</th>
                <th className="px-4 py-3 text-center">Plan</th>
                <th className="px-4 py-3 text-center">Triple Check</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-blue-50/30 transition-all group">
                  <td className="px-4 py-3">
                    {(() => {
                        const crmClient = crmClients?.find(cc => cc.subdomain === c.name);
                        return crmClient ? (
                            <button 
                                onClick={() => onEditClick(crmClient)} 
                                className="font-bold text-blue-600 hover:underline hover:text-blue-800 text-left transition-colors"
                                title="Editar Ficha Comercial del Cliente"
                            >
                                {c.name}
                            </button>
                        ) : (
                            <div className="font-bold text-gray-900" title="Cliente no enlazado comercialmente">{c.name}</div>
                        );
                    })()}
                    {c.domain ? (
                      <a 
                        href={c.domain.startsWith('http') ? c.domain : `https://${c.domain}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs text-blue-600 hover:text-blue-800 font-mono hover:underline flex items-center gap-1 w-fit group"
                        title={`Abrir POS de ${c.name}: ${c.domain}`}
                      >
                        {c.domain}
                        <FaExternalLinkAlt size={8} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ) : (
                      <div className="text-xs text-gray-400 font-mono mt-1">sin-dominio</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => {
                          setSelectedServerId(c.server_id);
                          setSelectedServerName(c.server_name);
                          setShowServersModal(true);
                        }}
                        className="text-xs bg-gray-100 px-2 py-1 rounded-lg w-fit flex items-center gap-1 font-bold hover:bg-indigo-50 hover:text-indigo-700 transition cursor-pointer"
                        title="Ver detalles del Servidor"
                      >
                        <FaServer className="text-indigo-500" size={10} /> {c.server_name}
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedClusterId(c.cluster_id);
                          setSelectedClusterName(c.cluster_name);
                          setShowClustersModal(true);
                        }}
                        className="text-[10px] text-gray-500 bg-gray-50 hover:bg-cyan-50 hover:text-cyan-700 px-2 py-1 rounded-lg flex items-center gap-1 w-fit transition cursor-pointer"
                        title="Ver lista de Clusters"
                      >
                        <FaDatabase className="text-cyan-600" size={9} /> {c.cluster_name} | {c.db_name} ({parseFloat(c.db_size_mb || 0).toFixed(1)} MB)
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center"><PlanBadge plan={c.plan_type} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => handleInspect(c, 'nginx')}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition active:scale-90 hover:brightness-95 shadow-sm ${c.has_link ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-100'}`} 
                        title={c.has_link ? "Nginx OK - Clic para Inspeccionar" : "Falta Nginx - Clic para Inspeccionar"}
                      >
                        <FaGlobe />
                      </button>
                      <button 
                        onClick={() => handleInspect(c, 'pm2')}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition active:scale-90 hover:brightness-95 shadow-sm ${c.has_system ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-100'}`} 
                        title={c.has_system ? "PM2 OK - Clic para Inspeccionar" : "Falta PM2 - Clic para Inspeccionar"}
                      >
                        <FaTerminal />
                      </button>
                      <button 
                        onClick={() => handleInspect(c, 'db')}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition active:scale-90 hover:brightness-95 shadow-sm ${c.has_db ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-100'}`} 
                        title={c.has_db ? "DB OK - Clic para Inspeccionar" : "Falta DB - Clic para Inspeccionar"}
                      >
                        <FaDatabase />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Botón de Respaldo Seguro */}
                      <button 
                        onClick={() => handleBackup(c)} 
                        disabled={backingUpId !== null}
                        className={`w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition active:scale-95 disabled:opacity-50`}
                        title="Hacer respaldo de Base de Datos y descargar (.json)"
                      >
                        {backingUpId === c.id ? <FaSpinner className="animate-spin text-blue-600" /> : <FaDownload />}
                      </button>

                      {/* Botón de Restaurar Respaldo */}
                      <button 
                        onClick={() => handleRestoreClick(c)} 
                        disabled={restoringId !== null}
                        className={`w-8 h-8 rounded-lg bg-violet-50 border border-violet-200 text-violet-600 flex items-center justify-center hover:bg-violet-100 transition active:scale-95 disabled:opacity-50`}
                        title="Restaurar Base de Datos desde archivo (.json)"
                      >
                        {restoringId === c.id ? <FaSpinner className="animate-spin text-violet-600" /> : <FaUpload />}
                      </button>

                      {/* Botón de Eliminación Seguro */}
                      <button 
                        onClick={() => handleDeleteClick(c)} 
                        disabled={deletingId !== null}
                        className={`w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-red-600 flex items-center justify-center hover:bg-red-100 transition active:scale-95 disabled:opacity-50`}
                        title="Eliminar Cliente con respaldo previo obligatorio"
                      >
                        {deletingId === c.id ? <FaSpinner className="animate-spin text-red-600" /> : <FaTrash />}
                      </button>

                      {/* Botón de Edición Comercial Reutilizable */}
                      {(() => {
                        const crmClient = crmClients?.find(cc => cc.subdomain === c.name);
                        return crmClient ? (
                          <button 
                            onClick={() => onEditClick(crmClient)} 
                            className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition active:scale-95"
                            title="Editar Ficha Comercial del Cliente"
                          >
                            <FaEdit />
                          </button>
                        ) : (
                          <button 
                            disabled 
                            className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 text-gray-400 flex items-center justify-center cursor-not-allowed opacity-50"
                            title="Primero debes Aprobar este cliente para poder editar su ficha comercial"
                          >
                            <FaEdit />
                          </button>
                        );
                      })()}

                      {/* Botón de Aprobación/Sync comercial */}
                      <button 
                        onClick={() => handleSync(c)} 
                        disabled={syncingId !== null}
                        className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition disabled:opacity-50 flex items-center gap-1"
                        title="Aprobar y mover al CRM principal"
                      >
                        {syncingId === c.id ? <FaSpinner className="animate-spin" /> : <FaUserPlus />}
                        <span className="hidden lg:inline">Aprobar</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalClient && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 p-6 animate-scale-up text-left">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <FaExclamationTriangle className="w-8 h-8" />
              <h3 className="text-lg font-black uppercase tracking-wider">Eliminación Segura</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Estás a punto de eliminar al cliente <strong className="text-gray-900 font-bold">{deleteModalClient.name}</strong> de la infraestructura cloud y del CRM.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <h4 className="text-xs font-bold text-amber-800 uppercase mb-1">⚠️ Medidas de Seguridad Activas:</h4>
              <ul className="text-xs text-amber-700 list-disc list-inside space-y-1">
                <li>Se descargará automáticamente una copia de seguridad en tu equipo local.</li>
                <li>Se guardará un respaldo permanente en DigitalOcean.</li>
                <li>Se detendrá y purgará el servicio PM2 y Nginx en el VPS.</li>
              </ul>
            </div>

            {deleteModalClient.has_db && (
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-red-100 bg-red-50/30 cursor-pointer mb-6 hover:bg-red-50/50 transition">
                <input 
                  type="checkbox" 
                  checked={dropDatabase} 
                  onChange={(e) => setDropDatabase(e.target.checked)} 
                  className="w-4.5 h-4.5 text-red-600 rounded border-gray-300 focus:ring-red-500 mt-0.5" 
                />
                <div>
                  <strong className="text-xs font-bold text-red-800 block">Eliminar Base de Datos en MongoDB Atlas</strong>
                  <span className="text-[10px] text-red-600">¡Precaución! Esto borrará permanentemente todas las colecciones y datos de ventas en la nube.</span>
                </div>
              </label>
            )}

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteModalClient(null)} 
                className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl text-xs font-bold transition active:scale-95"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete} 
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95"
              >
                Respaldar y Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Technical Inspector Panel */}
      {inspectClient && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-end backdrop-blur-sm animate-fade-in">
          <div className="bg-white h-full w-full max-w-2xl shadow-2xl flex flex-col animate-slide-in-right border-l border-gray-100">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full uppercase mb-1 inline-block">
                  Inspector de Infraestructura
                </span>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <FaServer className="text-blue-600" /> {inspectClient.name}
                </h3>
              </div>
              <button 
                onClick={() => setInspectClient(null)} 
                className="text-gray-400 hover:text-red-500 transition active:scale-95"
              >
                <FaTimesCircle className="w-7 h-7" />
              </button>
            </div>

            {/* Inspector Tabs */}
            <div className="flex border-b border-gray-100 bg-white p-2 gap-1 sticky top-0 z-10">
              <button 
                onClick={() => handleInspect(inspectClient, 'nginx')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${inspectTab === 'nginx' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <FaGlobe /> Nginx & Web Link
              </button>
              <button 
                onClick={() => handleInspect(inspectClient, 'pm2')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${inspectTab === 'pm2' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <FaTerminal /> PM2 VPS Process
              </button>
              <button 
                onClick={() => handleInspect(inspectClient, 'db')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${inspectTab === 'db' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <FaDatabase /> MongoDB Database
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
              {inspectLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <FaSpinner className="animate-spin text-blue-600 w-10 h-10" />
                  <p className="text-sm font-black text-gray-500 uppercase tracking-widest animate-pulse">Consultando servidor...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* NGINX TAB */}
                  {inspectTab === 'nginx' && (
                    <div className="space-y-4">
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                        <h4 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-2">Estado del Enlace Web</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] text-gray-400 block font-bold uppercase">Dominio del Cliente</span>
                            <a 
                              href={`https://${inspectClient.domain}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-xs text-blue-600 font-mono font-bold hover:underline flex items-center gap-1 mt-0.5"
                            >
                              {inspectClient.domain || 'sin-dominio'} <FaExternalLinkAlt size={8} />
                            </a>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 block font-bold uppercase">Servidor Destino</span>
                            <span className="text-xs text-gray-800 font-bold flex items-center gap-1 mt-0.5">
                              <FaServer className="text-indigo-500" size={10} /> {inspectClient.server_name}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                        <h4 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-2">Nginx Redirection Status</h4>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${inspectClient.has_link ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {inspectClient.has_link ? '🟢 CONFIGURADO CORRECTAMENTE' : '🔴 CONFIGURACIÓN NO DETECTADA'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          La configuración de Nginx mapea automáticamente las solicitudes HTTPS del dominio del cliente al puerto interno <code className="font-mono text-gray-900 font-bold bg-gray-100 px-1 py-0.5 rounded">{inspectClient.port}</code> del VPS.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* PM2 TAB */}
                  {inspectTab === 'pm2' && (
                    <div className="space-y-4">
                      {pm2Status ? (
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                          <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                            <h4 className="text-sm font-bold text-gray-800">Proceso PM2 en Droplet</h4>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${pm2Status.status === 'online' ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-red-100 text-red-700'}`}>
                              {pm2Status.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                              <span className="text-[10px] text-gray-400 block font-bold uppercase">Uso de CPU</span>
                              <span className="text-sm font-mono font-bold text-gray-800 mt-1 block">
                                {pm2Status.cpu || 0}%
                              </span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                              <span className="text-[10px] text-gray-400 block font-bold uppercase">Memoria RAM</span>
                              <span className="text-sm font-mono font-bold text-gray-800 mt-1 block">
                                {((pm2Status.memory || 0) / 1024 / 1024).toFixed(1)} MB
                              </span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                              <span className="text-[10px] text-gray-400 block font-bold uppercase">Puerto Interno</span>
                              <span className="text-sm font-mono font-bold text-gray-800 mt-1 block">
                                {inspectClient.port || 'N/A'}
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-center pt-2">
                            <button 
                              onClick={loadPm2Logs}
                              className="px-4 py-2.5 bg-gray-955 hover:bg-gray-900 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-2 shadow-md transition active:scale-95"
                            >
                              <FaTerminal /> Ver logs del proceso
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center text-gray-500 py-10">
                          🔴 El proceso PM2 <code className="font-mono bg-gray-50 px-1 py-0.5 rounded text-red-600 font-bold">{inspectClient.name}</code> no está registrado en PM2 o el servidor no responde.
                        </div>
                      )}

                      {pm2Logs && (
                        <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 shadow-lg space-y-2">
                          <div className="flex justify-between items-center border-b border-gray-800 pb-1.5">
                            <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1.5"><FaTerminal /> pm2 logs {inspectClient.name} --lines 50</span>
                            <button onClick={() => setPm2Logs('')} className="text-gray-500 hover:text-red-400 text-xs">Limpiar</button>
                          </div>
                          <pre className="text-[10px] font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap max-h-60 overflow-y-auto text-left leading-relaxed">
                            {pm2Logs}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* DATABASE TAB */}
                  {inspectTab === 'db' && (
                    <div className="space-y-4">
                      {/* Database Info & Last Activity */}
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <h4 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-2">Base de Datos MongoDB Atlas</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] text-gray-400 block font-bold uppercase">Base de Datos</span>
                            <span className="text-xs text-gray-800 font-bold font-mono block mt-0.5">{inspectClient.db_name}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 block font-bold uppercase">Cluster</span>
                            <span className="text-xs text-gray-800 font-bold block mt-0.5">{inspectClient.cluster_name}</span>
                          </div>
                        </div>

                        {/* Last Activity Section */}
                        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl space-y-1">
                          <span className="text-[10px] text-blue-600 block font-bold uppercase tracking-wider">Última Fecha de Actividad / Uso</span>
                          {dbActivity ? (
                            <span className="text-sm font-black text-blue-800 font-mono block">
                              📅 {new Date(dbActivity).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-blue-700 block">
                              🕒 No se registra actividad de facturas reciente (base de datos vacía o inactiva).
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Collections Stats Table */}
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-50 bg-gray-50/30">
                          <h4 className="text-sm font-bold text-gray-800">Colecciones de la Base de Datos</h4>
                        </div>
                        {dbCollections.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                                <tr>
                                  <th className="px-4 py-2.5">Colección</th>
                                  <th className="px-4 py-2.5 text-right">Documentos</th>
                                  <th className="px-4 py-2.5 text-right">Tamaño</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50 font-medium">
                                {dbCollections.map((col, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50/30">
                                    <td className="px-4 py-2.5 font-mono text-gray-900">{col.name}</td>
                                    <td className="px-4 py-2.5 text-right text-gray-700 font-bold">{col.count}</td>
                                    <td className="px-4 py-2.5 text-right text-gray-500">{(col.size / 1024).toFixed(1)} KB</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-8 text-center text-xs text-gray-400 font-bold uppercase tracking-wider">
                            Sin colecciones provistas o base de datos vacía.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Servers Modal */}
      {showServersModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 p-6 animate-scale-up text-left">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black uppercase tracking-wider flex items-center gap-2 text-indigo-700">
                <FaServer /> {selectedServerId || selectedServerName ? 'Detalles del Servidor VPS' : 'Lista de Servidores (Droplets)'}
              </h3>
              <button onClick={() => setShowServersModal(false)} className="text-gray-400 hover:text-red-500"><FaTimesCircle size={24} /></button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
               <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase font-bold sticky top-0">
                  <tr><th className="px-4 py-2">ID</th><th className="px-4 py-2">Nombre</th><th className="px-4 py-2">IP / Host</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {servers.length > 0 ? (
                    servers
                      .filter(s => {
                        if (!selectedServerId && !selectedServerName) return true;
                        const matchId = selectedServerId && String(s.id) === String(selectedServerId);
                        const matchName = selectedServerName && String(s.name).toLowerCase().trim() === String(selectedServerName).toLowerCase().trim();
                        return matchId || matchName;
                      })
                      .map(s => (
                        <tr key={s.id} className="hover:bg-indigo-50/30">
                          <td className="px-4 py-2 font-mono text-xs">{s.id}</td>
                          <td className="px-4 py-2 font-bold text-gray-800">{s.name}</td>
                          <td className="px-4 py-2 font-mono text-indigo-600">{s.ip}</td>
                        </tr>
                      ))
                  ) : <tr><td colSpan="3" className="px-4 py-8 text-center text-gray-500">No hay servidores registrados.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Clusters Modal */}
      {showClustersModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 p-6 animate-scale-up text-left">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black uppercase tracking-wider flex items-center gap-2 text-cyan-700">
                <FaDatabase /> {selectedClusterId || selectedClusterName ? 'Detalles del Cluster de BD' : 'Lista de Clusters (Bases de Datos)'}
              </h3>
              <button onClick={() => setShowClustersModal(false)} className="text-gray-400 hover:text-red-500"><FaTimesCircle size={24} /></button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase font-bold sticky top-0">
                  <tr>
                    <th className="px-4 py-2">ID</th>
                    <th className="px-4 py-2">Nombre</th>
                    <th className="px-4 py-2">Host</th>
                    <th className="px-4 py-2">URI de Conexión</th>
                    <th className="px-4 py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {clusters.length > 0 ? (
                    clusters
                      .filter(cl => {
                        if (!selectedClusterId && !selectedClusterName) return true;
                        const matchId = selectedClusterId && String(cl.id) === String(selectedClusterId);
                        const matchName = selectedClusterName && String(cl.name).toLowerCase().trim() === String(selectedClusterName).toLowerCase().trim();
                        return matchId || matchName;
                      })
                      .map(c => (
                        <tr key={c.id} className="hover:bg-cyan-50/30">
                          <td className="px-4 py-2 font-mono text-xs">{c.id}</td>
                          <td className="px-4 py-2 font-bold text-gray-800">{c.name}</td>
                          <td className="px-4 py-2 font-mono text-xs text-gray-500 truncate max-w-[150px]" title={c.host}>{c.host}</td>
                          <td className="px-4 py-2 font-mono text-xs text-cyan-600 truncate max-w-[200px]" title={c.uri}>
                            {revealedClusters[c.id] ? c.uri : 'mongodb+srv://••••••••••••'}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex justify-end gap-1">
                              <button 
                                onClick={() => setRevealedClusters(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition"
                                title={revealedClusters[c.id] ? "Ocultar URI" : "Revelar URI"}
                              >
                                {revealedClusters[c.id] ? 'Ocultar' : 'Revelar'}
                              </button>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(c.uri);
                                  alert('URI de conexión copiado al portapapeles!');
                                }}
                                className="px-2 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded text-xs font-bold transition"
                                title="Copiar URI"
                              >
                                Copiar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  ) : <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500">No hay clusters registrados.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
