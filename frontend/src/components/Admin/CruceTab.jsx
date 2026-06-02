import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaSync, FaSearch, FaFilter, FaFileInvoice, FaDownload, 
  FaExclamationTriangle, FaCheckCircle, FaSpinner, FaWhatsapp, 
  FaExternalLinkAlt, FaBuilding, FaInfoCircle, FaInbox
} from 'react-icons/fa';

const StatCard = ({ icon: Icon, label, value, color, bg, onClick, active }) => (
  <div 
    onClick={onClick}
    className={`${bg} rounded-2xl p-4 border transition-all duration-300 ${active ? 'border-blue-500 ring-4 ring-blue-100 shadow-md scale-[1.02]' : 'border-gray-100'} ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-98' : ''}`}
  >
    <div className="flex items-center gap-3 mb-2">
      <Icon className={`${color}`} />
      <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </div>
    <div className="text-2xl font-black text-gray-800">{value}</div>
  </div>
);

export default function CruceTab({ onEditClick }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [report, setReport] = useState([]);
  const [unlinked, setUnlinked] = useState([]);
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos'); // 'todos', 'al_dia', 'en_mora', 'sin_facturar', 'huerfanas'
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchCruceData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/billing/cross-check');
      if (res.data.success) {
        setStats(res.data.stats);
        setReport(res.data.report || []);
        setUnlinked(res.data.unlinkedInvoices || []);
      }
    } catch (e) {
      console.error('Error fetching cross-check data:', e);
      alert('Error consultando el reporte de cruce de facturas: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCruceData();
  }, []);

  const handleDownloadPDF = async (invoiceId) => {
    setDownloadingId(invoiceId);
    try {
      const res = await axios.get(`/billing/admin-invoices/${invoiceId}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
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

  // Genera los últimos 6 meses para las columnas
  const last6Months = (() => {
    const months = [];
    const d = new Date();
    // Generamos orden cronológico ascendente (de hace 5 meses a hoy)
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

  // Filtrado de clientes
  const filteredReport = report.filter(client => {
    const matchesSearch = 
      client.business_name?.toLowerCase().includes(search.toLowerCase()) ||
      client.nit?.toLowerCase().includes(search.toLowerCase()) ||
      client.cloud_url?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'al_dia') return client.status_check === 'Al día';
    if (filterStatus === 'en_mora') return client.status_check === 'En mora';
    if (filterStatus === 'sin_facturar') return client.status_check === 'Sin facturar';
    if (filterStatus === 'sin_meses') return client.status_check === 'Sin registrar meses';
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <FaSpinner className="animate-spin text-blue-600 w-10 h-10" />
        <p className="text-sm font-black text-gray-500 uppercase tracking-widest animate-pulse">Sincronizando Facturación Real...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de Estadísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard 
            icon={FaBuilding} 
            label="Total Clientes Cloud" 
            value={stats.total_clients} 
            color="text-blue-600" 
            bg="bg-blue-50" 
            onClick={() => setFilterStatus('todos')}
            active={filterStatus === 'todos'}
          />
          <StatCard 
            icon={FaCheckCircle} 
            label="Al Día Nube" 
            value={stats.al_dia} 
            color="text-green-600" 
            bg="bg-green-50/50 border-green-100" 
            onClick={() => setFilterStatus('al_dia')}
            active={filterStatus === 'al_dia'}
          />
          <StatCard 
            icon={FaExclamationTriangle} 
            label="En Mora (Por Cobrar)" 
            value={stats.en_mora} 
            color="text-red-600" 
            bg="bg-red-50/50 border-red-100" 
            onClick={() => setFilterStatus('en_mora')}
            active={filterStatus === 'en_mora'}
          />
          <StatCard 
            icon={FaFileInvoice} 
            label="Falta Facturar" 
            value={stats.sin_facturar} 
            color="text-amber-600" 
            bg="bg-amber-50/50 border-amber-100" 
            onClick={() => setFilterStatus('sin_facturar')}
            active={filterStatus === 'sin_facturar'}
          />
          <StatCard 
            icon={FaInbox} 
            label="Facturas Libres" 
            value={unlinked.length} 
            color="text-purple-600" 
            bg="bg-purple-50/50 border-purple-100" 
            onClick={() => setFilterStatus('huerfanas')}
            active={filterStatus === 'huerfanas'}
          />
        </div>
      )}

      {filterStatus === 'huerfanas' ? (
        /* VISTA: FACTURAS HUÉRFANAS */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in-up">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FaInbox className="text-purple-600" /> Facturas Libres en Admin (Sin Vincular)
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Facturas emitidas en admin.poslatino.com que contienen enlaces en su descripción pero no corresponden a ningún cliente activo en el CRM.
              </p>
            </div>
            <button onClick={fetchCruceData} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition flex items-center gap-1">
              <FaSync /> Actualizar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase tracking-wider font-bold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Factura</th>
                  <th className="px-6 py-3">Fecha</th>
                  <th className="px-6 py-3">Cliente en Factura</th>
                  <th className="px-6 py-3">Monto</th>
                  <th className="px-6 py-3">Observaciones / Link</th>
                  <th className="px-6 py-3 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {unlinked.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400 font-semibold">
                      No hay facturas libres detectadas. ¡Todo cruzado correctamente! ✨
                    </td>
                  </tr>
                ) : (
                  unlinked.map((inv) => (
                    <tr key={inv.id} className="hover:bg-purple-50/20 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {inv.es_electronica ? "⚡ " : ""}#{inv.numero}
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-mono">
                        {new Date(inv.fecha).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800">{inv.cliente?.nombre || 'Cliente Genérico'}</div>
                        <div className="text-xs text-gray-500">NIT: {inv.cliente?.nit}</div>
                      </td>
                      <td className="px-6 py-4 font-extrabold text-gray-800">
                        ${parseFloat(inv.monto).toLocaleString('es-CO')}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-purple-700 bg-purple-50/30 font-semibold whitespace-pre-wrap max-w-sm truncate" title={inv.nota}>
                        {inv.nota}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDownloadPDF(inv.id)}
                          disabled={downloadingId === inv.id}
                          className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-600 rounded hover:bg-blue-100 font-bold transition inline-flex items-center gap-1 text-[10px]"
                        >
                          {downloadingId === inv.id ? <FaSpinner className="animate-spin" /> : "⬇️ PDF"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VISTA: GRILLA DE RECONCILIACIÓN MASIVA */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in-up">
          <div className="p-4 md:p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/30">
            <div className="relative flex-1 w-full md:max-w-md">
              <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar negocio, NIT o dominio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            <div className="flex gap-2 w-full md:w-auto items-center">
              <button 
                onClick={fetchCruceData} 
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition active:scale-95 shadow-sm"
              >
                <FaSync /> Cruzar Nube
              </button>
              {filterStatus !== 'todos' && (
                <button 
                  onClick={() => setFilterStatus('todos')} 
                  className="px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition flex items-center gap-1"
                >
                  Filtro: {filterStatus} ✕
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase tracking-wider font-bold border-b border-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3">Cliente / Nube</th>
                  <th className="px-5 py-3">Cruce</th>
                  {last6Months.map((m, idx) => (
                    <th key={idx} className="px-4 py-3 text-center border-l border-gray-100" title={m.fullName}>
                      {m.name}
                    </th>
                  ))}
                  <th className="px-5 py-3 text-right">Contacto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredReport.length === 0 ? (
                  <tr>
                    <td colSpan={8 + last6Months.length} className="px-5 py-8 text-center text-gray-400">
                      No hay clientes que coincidan con los criterios de búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredReport.map((c) => (
                    <tr key={c.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="px-5 py-3">
                        <button 
                          onClick={() => onEditClick(c)}
                          className="font-bold text-gray-900 hover:text-blue-600 text-left block hover:underline"
                        >
                          {c.business_name}
                        </button>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5 font-mono">
                          <span>{c.nit || 'Sin NIT'}</span>
                          <span>•</span>
                          <a 
                            href={c.cloud_url.startsWith('http') ? c.cloud_url : `https://${c.cloud_url}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-blue-500 hover:text-blue-700 flex items-center gap-0.5 hover:underline"
                          >
                            {c.cloud_url} <FaExternalLinkAlt size={8} />
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
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 rounded text-[10px] font-extrabold uppercase">Sin Períodos</span>
                        )}
                      </td>
                      
                      {last6Months.map((m, idx) => {
                        const inv = getInvoiceForPeriod(c.invoices, m.year, m.month);
                        
                        return (
                          <td key={idx} className="px-3 py-3 border-l border-gray-100 text-center text-xs">
                            {inv ? (
                              <button
                                onClick={() => handleDownloadPDF(inv.id)}
                                disabled={downloadingId === inv.id}
                                className="px-2 py-1 rounded bg-green-50 border border-green-200 text-green-700 font-extrabold text-[10px] hover:bg-green-100 transition shadow-sm inline-flex items-center gap-0.5"
                                title={`Factura #${inv.numero} - Generada el ${new Date(inv.fecha).toLocaleDateString('es-CO')}\nMonto: $${parseFloat(inv.monto).toLocaleString('es-CO')}`}
                              >
                                {downloadingId === inv.id ? <FaSpinner className="animate-spin text-green-700" /> : `📄 #${inv.numero}`}
                              </button>
                            ) : (
                              <span 
                                className="text-amber-500 font-extrabold text-[10px] px-1.5 py-0.5 bg-amber-50/50 border border-amber-200/50 rounded inline-block" 
                                title="No se detecta factura emitida en admin.poslatino.com para este período"
                              >
                                ⚠️ Faltante
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
                          <button 
                            onClick={() => onEditClick(c)}
                            className="px-2 py-1 bg-gray-50 border border-gray-200 text-gray-600 rounded hover:bg-blue-50 hover:text-blue-600 transition text-[10px] font-bold"
                          >
                            Facturar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between text-xs text-gray-500 gap-2">
            <span className="flex items-center gap-1"><FaInfoCircle /> El algoritmo cruza por subdominios de la URL de la nube y usa el NIT como fallback.</span>
            <span>Total cruzados: <b>{filteredReport.length}</b> de <b>{report.length}</b></span>
          </div>
        </div>
      )}
    </div>
  );
}
