import React, { useState } from 'react';
import axios from 'axios';
import { FaDatabase, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const AdminDashboard = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const initDb = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4050';
            const res = await axios.post(`${API_URL}/api/admin/init-tables`);
            setMessage({ type: 'success', text: res.data.message });
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Error al inicializar DB: ' + (error.response?.data?.error || error.message) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Panel de Control</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tarjeta de Estado del Sistema */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-semibold uppercase mb-4">Estado del Sistema</h3>

                    <button
                        onClick={initDb}
                        disabled={loading}
                        className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'}`}
                    >
                        {loading ? 'Procesando...' : <><FaDatabase /> Inicializar Tablas DB</>}
                    </button>

                    {message && (
                        <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {message.type === 'success' ? <FaCheckCircle className="mt-0.5" /> : <FaExclamationTriangle className="mt-0.5" />}
                            <span>{message.text}</span>
                        </div>
                    )}
                </div>

                {/* Placeholder de Estadísticas */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 col-span-2 flex items-center justify-center text-gray-400 italic">
                    Próximamente: Gráficas de Ventas y Leads
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
