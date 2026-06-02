import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCreditCard, FaLock, FaSave, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const API_URL = '';

const AdminGateways = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [formData, setFormData] = useState({
        wompi_env: 'sandbox',
        wompi_pub_sandbox: '',
        wompi_prv_sandbox: '',
        wompi_events_sandbox: '',
        wompi_integrity_sandbox: '',
        wompi_pub_prod: '',
        wompi_prv_prod: '',
        wompi_events_prod: '',
        wompi_integrity_prod: '',
        bold_api_key: '',
        payment_warning_msg: 'Su pago está próximo a vencer. Por favor, póngase al día para evitar la suspensión del servicio.',
        payment_lock_msg: 'El sistema ha sido bloqueado por falta de pago. Por favor, realice su pago inmediatamente para restaurar el servicio.'
    });

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await axios.get(`${API_URL}/config/gateways/status`);
            if (res.data.success) {
                setStatus(res.data.status);
                setFormData(prev => ({ ...prev, ...res.data.config }));
            }
        } catch (error) {
            console.error('Error fetching gateway status:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.put(`${API_URL}/config/gateways`, formData);
            if (res.data.success) {
                alert('Configuración guardada correctamente. El servidor se está reiniciando para aplicar los cambios.');
                setTimeout(() => {
                    fetchStatus();
                }, 3000);
            }
        } catch (error) {
            alert('Error al guardar configuración: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto animate-fade-in-up">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FaCreditCard className="text-blue-600" />
                    Pasarelas de Pago
                </h1>
                <p className="text-gray-500 text-sm mt-1">Configura las credenciales de Wompi y Bold para procesar pagos.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Wompi Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                                Configuración de Wompi
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">Credenciales obtenidas desde el dashboard de desarrolladores de Wompi.</p>
                        </div>
                        {status?.wompi ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                                <FaCheckCircle /> Configurado ({status.wompi_env})
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full flex items-center gap-1">
                                <FaExclamationTriangle /> Sin Configurar
                            </span>
                        )}
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Entorno Activo</label>
                            <select 
                                name="wompi_env" 
                                value={formData.wompi_env} 
                                onChange={handleChange}
                                className="w-full md:w-1/3 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="sandbox">Sandbox (Pruebas)</option>
                                <option value="production">Producción (Pagos Reales)</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <h3 className="font-bold text-blue-800 mb-4 text-sm uppercase tracking-wider">Entorno Sandbox</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Llave Pública (pub_test_...)</label>
                                        <input type="text" name="wompi_pub_sandbox" value={formData.wompi_pub_sandbox} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><FaLock className="text-gray-400" /> Llave Privada (prv_test_...)</label>
                                        <input type="password" name="wompi_prv_sandbox" value={formData.wompi_prv_sandbox} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><FaLock className="text-gray-400" /> Secreto Eventos (test_events_...)</label>
                                        <input type="password" name="wompi_events_sandbox" value={formData.wompi_events_sandbox} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><FaLock className="text-gray-400" /> Secreto Integridad (test_integrity_...)</label>
                                        <input type="password" name="wompi_integrity_sandbox" value={formData.wompi_integrity_sandbox} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md text-sm" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                                <h3 className="font-bold text-red-800 mb-4 text-sm uppercase tracking-wider">Entorno Producción</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Llave Pública (pub_prod_...)</label>
                                        <input type="text" name="wompi_pub_prod" value={formData.wompi_pub_prod} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><FaLock className="text-gray-400" /> Llave Privada (prv_prod_...)</label>
                                        <input type="password" name="wompi_prv_prod" value={formData.wompi_prv_prod} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><FaLock className="text-gray-400" /> Secreto Eventos (prod_events_...)</label>
                                        <input type="password" name="wompi_events_prod" value={formData.wompi_events_prod} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1"><FaLock className="text-gray-400" /> Secreto Integridad (prod_integrity_...)</label>
                                        <input type="password" name="wompi_integrity_prod" value={formData.wompi_integrity_prod} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md text-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bold Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-600"></span>
                                Configuración de Bold
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">Llaves API para la integración secundaria (opcional).</p>
                        </div>
                        {status?.bold ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                                <FaCheckCircle /> Configurado
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full flex items-center gap-1">
                                Opcional
                            </span>
                        )}
                    </div>
                    <div className="p-6">
                        <div className="max-w-md">
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                <FaLock className="text-gray-400" /> API Key Bold (Privada)
                            </label>
                            <input 
                                type="password" 
                                name="bold_api_key" 
                                value={formData.bold_api_key} 
                                onChange={handleChange} 
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" 
                                placeholder="sk_prod_..."
                            />
                        </div>
                    </div>
                </div>

                {/* Mensajes Personalizados */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                            Mensajes del POS Multitenant
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Configura los mensajes que verán los clientes en sus cajas cuando haya un pago pendiente o un bloqueo.</p>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje Preventivo (Banner Amarillo)</label>
                            <textarea 
                                name="payment_warning_msg" 
                                value={formData.payment_warning_msg} 
                                onChange={handleChange} 
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                                rows="2"
                                placeholder="Ej: Su pago vence en 3 días..."
                            ></textarea>
                            <p className="text-xs text-gray-500 mt-1">Este mensaje se mostrará unos días antes de la fecha de corte para incentivar el pago temprano.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje de Bloqueo (Pantalla Roja)</label>
                            <textarea 
                                name="payment_lock_msg" 
                                value={formData.payment_lock_msg} 
                                onChange={handleChange} 
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" 
                                rows="3"
                                placeholder="Ej: Sistema bloqueado por falta de pago..."
                            ></textarea>
                            <p className="text-xs text-gray-500 mt-1">Este mensaje aparecerá a pantalla completa y no permitirá usar la caja hasta que se confirme el pago por Wompi.</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-70"
                    >
                        <FaSave />
                        {loading ? 'Guardando y Reiniciando...' : 'Guardar Configuración'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminGateways;
