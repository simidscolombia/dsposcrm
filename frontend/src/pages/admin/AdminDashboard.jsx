import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaDatabase, FaCheckCircle, FaExclamationTriangle, FaChartLine,
    FaMoneyBillWave, FaFilter, FaTruck, FaUniversity, FaSync, FaBrain
} from 'react-icons/fa';

const API_URL = '';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
    }).format(amount || 0);
};

const AdminDashboard = () => {
    const [loadingDb, setLoadingDb] = useState(false);
    const [messageDb, setMessageDb] = useState(null);

    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const res = await axios.get(`${API_URL}/admin/crm/dashboard-stats`);
            if (res.data.success) {
                setStats(res.data.stats);
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
        setLoadingStats(false);
    };

    const initDb = async () => {
        setLoadingDb(true);
        setMessageDb(null);
        try {
            const res = await axios.post(`${API_URL}/admin/init-tables`);
            setMessageDb({ type: 'success', text: res.data.message });
        } catch (error) {
            console.error(error);
            setMessageDb({ type: 'error', text: 'Error al inicializar DB: ' + (error.response?.data?.error || error.message) });
        } finally {
            setLoadingDb(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <FaChartLine className="text-blue-600" />
                    Panel de Control y Estadísticas
                </h1>
                <button
                    onClick={fetchStats}
                    className="p-2 bg-white rounded-full shadow-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition"
                    title="Actualizar Datos"
                >
                    <FaSync className={loadingStats ? 'animate-spin' : ''} />
                </button>
            </div>

            {loadingStats ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
            ) : (
                <>
                    {/* Top Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                            <FaMoneyBillWave className="absolute -right-6 -top-6 text-9xl text-white opacity-10 group-hover:scale-110 transition-transform duration-500" />
                            <h3 className="text-blue-100 font-semibold mb-1 uppercase tracking-wider text-xs">Ventas (Contra Entrega / Trf)</h3>
                            <div className="text-4xl font-black text-white mb-2">{formatCurrency(stats?.totalRevenue)}</div>
                            <p className="text-blue-200 text-sm">Proyección de ingresos cerrados</p>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                            <FaChartLine className="absolute -right-6 -top-6 text-9xl text-white opacity-10 group-hover:scale-110 transition-transform duration-500" />
                            <h3 className="text-emerald-100 font-semibold mb-1 uppercase tracking-wider text-xs">Dinero Flotante en Pipeline</h3>
                            <div className="text-4xl font-black text-white mb-2">{formatCurrency(stats?.pendingRevenue)}</div>
                            <p className="text-emerald-200 text-sm">Valor total en cotizaciones activas</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-600 to-fuchsia-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group col-span-1 md:col-span-2 lg:col-span-1">
                            <FaBrain className="absolute -right-6 -top-6 text-9xl text-white opacity-10 animate-pulse" />
                            <h3 className="text-purple-100 font-semibold mb-1 uppercase tracking-wider text-xs">Cerebro Discovery (IA)</h3>
                            <div className="text-4xl font-black text-white mb-2">ACTIVO</div>
                            <p className="text-purple-200 text-sm">Asistente experto guiando en el Wizard</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Payment Methods */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 col-span-2">
                            <h3 className="text-gray-800 font-bold mb-6 flex items-center gap-2">
                                <FaUniversity className="text-blue-500" /> Preferencias de Pago
                            </h3>
                            <div className="space-y-4">
                                {(stats?.paymentMethods || []).map((pm, idx) => {
                                    const totalCount = stats.paymentMethods.reduce((acc, curr) => acc + parseInt(curr.count), 0);
                                    const percentage = totalCount > 0 ? ((parseInt(pm.count) / totalCount) * 100).toFixed(1) : 0;
                                    const isTransfer = pm.payment_method === 'transferencia';

                                    return (
                                        <div key={idx}>
                                            <div className="flex justify-between text-sm mb-1 font-semibold text-gray-700">
                                                <span className="flex items-center gap-2">
                                                    {isTransfer ? <FaUniversity className="text-blue-500" /> : <FaTruck className="text-orange-500" />}
                                                    {isTransfer ? 'Transferencia Bancaria' : 'Pago Contra Entrega'}
                                                </span>
                                                <span>{pm.count} leads ({percentage}%)</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                                <div
                                                    className={`h-3 rounded-full transition-all duration-1000 ${isTransfer ? 'bg-blue-500' : 'bg-orange-500'}`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )
                                })}
                                {(!stats?.paymentMethods || stats.paymentMethods.length === 0) && (
                                    <p className="text-gray-400 text-sm italic py-4 text-center">No hay datos de pago aún.</p>
                                )}
                            </div>
                        </div>

                        {/* Database Controls */}
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                            <h3 className="text-gray-600 text-xs font-bold uppercase mb-4 tracking-wider flex items-center gap-2">
                                <FaDatabase className="text-gray-400" /> Sistema Interno
                            </h3>
                            <p className="text-xs text-gray-500 mb-4 bg-white p-3 rounded-lg border border-gray-100">
                                Usa este botón únicamente si acabas de desplegar y necesitas recrear las tablas base.
                            </p>
                            <button
                                onClick={initDb}
                                disabled={loadingDb}
                                className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-md ${loadingDb ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-900 hover:shadow-lg'}`}
                            >
                                {loadingDb ? 'Procesando...' : <><FaSync /> Inicializar Tablas DB</>}
                            </button>

                            {messageDb && (
                                <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 text-xs font-bold shadow-sm ${messageDb.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    {messageDb.type === 'success' ? <FaCheckCircle className="mt-0.5 flex-shrink-0 text-sm" /> : <FaExclamationTriangle className="mt-0.5 flex-shrink-0 text-sm" />}
                                    <span>{messageDb.text}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Funnel Sources */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
                            <FaFilter className="text-purple-500" /> Origen de Contactos (Leads)
                        </h3>
                        <div className="flex flex-wrap gap-4">
                            {(stats?.leadsBySource || []).map((src, idx) => (
                                <div key={idx} className="bg-purple-50 border border-purple-100 px-4 py-3 rounded-xl flex-1 min-w-[150px] flex justify-between items-center text-purple-800">
                                    <span className="font-semibold">{src.source || 'Orgánico (Web)'}</span>
                                    <span className="bg-purple-200 text-purple-900 px-2 py-1 rounded-full text-xs font-black">{src.count}</span>
                                </div>
                            ))}
                            {(!stats?.leadsBySource || stats.leadsBySource.length === 0) && (
                                <p className="text-gray-400 italic text-sm w-full text-center">Esperando por los primeros prospectos...</p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminDashboard;
