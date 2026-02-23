
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaWhatsapp, FaPlug, FaPowerOff, FaQrcode, FaPaperPlane, FaHistory, FaSpinner, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaRedo, FaCog } from 'react-icons/fa';

const API_URL = '/api';

const AdminWhatsApp = () => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [qrImage, setQrImage] = useState(null);
    const [loadingQr, setLoadingQr] = useState(false);
    const [logs, setLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [sendForm, setSendForm] = useState({ phone: '', message: '' });
    const [sending, setSending] = useState(false);
    const [activeTab, setActiveTab] = useState('status'); // status | send | logs | setup
    const qrInterval = useRef(null);

    // Fetch status
    const fetchStatus = async () => {
        try {
            const res = await axios.get(`${API_URL}/whatsapp/status`);
            setStatus(res.data);
        } catch (e) {
            setStatus({ connected: false, status: 'ERROR', error: e.message });
        } finally {
            setLoading(false);
        }
    };

    // Fetch logs
    const fetchLogs = async () => {
        setLoadingLogs(true);
        try {
            const res = await axios.get(`${API_URL}/whatsapp/logs?limit=30`);
            if (res.data.success) setLogs(res.data.logs || []);
        } catch (e) { console.error(e); } finally { setLoadingLogs(false); }
    };

    useEffect(() => {
        fetchStatus();
        return () => { if (qrInterval.current) clearInterval(qrInterval.current); };
    }, []);

    useEffect(() => {
        if (activeTab === 'logs') fetchLogs();
    }, [activeTab]);

    // Start session
    const handleStart = async () => {
        try {
            setLoadingQr(true);
            await axios.post(`${API_URL}/whatsapp/start`);
            // Start polling QR
            fetchQr();
            qrInterval.current = setInterval(fetchQr, 5000);
        } catch (e) {
            alert('Error al iniciar sesión: ' + e.message);
        } finally { setLoadingQr(false); }
    };

    // Fetch QR
    const fetchQr = async () => {
        try {
            const res = await axios.get(`${API_URL}/whatsapp/qr`);
            if (res.data.success) {
                setQrImage(res.data.qr);
            } else {
                // Might already be authenticated
                clearInterval(qrInterval.current);
                fetchStatus();
            }
        } catch (e) {
            clearInterval(qrInterval.current);
            fetchStatus();
        }
    };

    // Stop session
    const handleStop = async () => {
        if (!window.confirm('¿Desconectar la sesión de WhatsApp?')) return;
        try {
            await axios.post(`${API_URL}/whatsapp/stop`);
            setStatus({ connected: false, status: 'STOPPED' });
            setQrImage(null);
        } catch (e) { alert('Error: ' + e.message); }
    };

    // Send message
    const handleSend = async (e) => {
        e.preventDefault();
        if (!sendForm.phone || !sendForm.message) return;
        setSending(true);
        try {
            const res = await axios.post(`${API_URL}/whatsapp/send`, sendForm);
            if (res.data.success) {
                alert('✅ Mensaje enviado');
                setSendForm({ phone: '', message: '' });
                if (activeTab === 'logs') fetchLogs();
            } else {
                alert('❌ Error: ' + (res.data.error || 'No se pudo enviar'));
            }
        } catch (e) {
            alert('❌ Error: ' + (e.response?.data?.error || e.message));
        } finally { setSending(false); }
    };

    const statusColor = status?.connected ? 'text-green-500' : status?.status === 'ERROR' ? 'text-red-500' : 'text-yellow-500';
    const statusIcon = status?.connected ? <FaCheckCircle /> : status?.status === 'ERROR' ? <FaTimesCircle /> : <FaExclamationTriangle />;
    const statusText = status?.connected ? 'Conectado' : status?.status === 'STOPPED' ? 'Desconectado' : status?.status || 'Verificando...';

    const tabs = [
        { id: 'status', label: 'Estado', icon: <FaPlug /> },
        { id: 'send', label: 'Enviar', icon: <FaPaperPlane /> },
        { id: 'logs', label: 'Historial', icon: <FaHistory /> },
        { id: 'setup', label: 'Configuración', icon: <FaCog /> }
    ];

    return (
        <div className="p-4 md:p-8 max-w-[1000px] mx-auto animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-200">
                    <FaWhatsapp className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">WhatsApp Automático</h1>
                    <p className="text-sm text-gray-500">Conexión WAHA — Envío automatizado de mensajes</p>
                </div>
                <div className={`ml-auto flex items-center gap-2 text-sm font-bold ${statusColor}`}>
                    {loading ? <FaSpinner className="animate-spin" /> : statusIcon}
                    {statusText}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                            ? 'bg-white text-green-700 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* ===================== TAB: Estado ===================== */}
            {activeTab === 'status' && (
                <div className="space-y-4">
                    {/* Connection Status Card */}
                    <div className={`p-6 rounded-2xl border-2 ${status?.connected ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${status?.connected ? 'bg-green-500' : 'bg-gray-400'}`}>
                                <FaWhatsapp className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">
                                    {status?.connected ? '✅ WhatsApp Conectado' : '⏸️ WhatsApp Desconectado'}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {status?.connected
                                        ? 'Listo para enviar mensajes automáticamente'
                                        : 'Conecta tu WhatsApp escaneando el código QR'
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {!status?.connected ? (
                                <button
                                    onClick={handleStart}
                                    disabled={loadingQr}
                                    className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    {loadingQr ? <FaSpinner className="animate-spin" /> : <FaQrcode />}
                                    {loadingQr ? 'Generando QR...' : 'Conectar WhatsApp'}
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={fetchStatus}
                                        className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                                    >
                                        <FaRedo /> Verificar Estado
                                    </button>
                                    <button
                                        onClick={handleStop}
                                        className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                                    >
                                        <FaPowerOff /> Desconectar
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* QR Code */}
                    {qrImage && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 text-center">
                            <h3 className="font-bold text-gray-800 mb-3">📱 Escanea con WhatsApp</h3>
                            <p className="text-sm text-gray-500 mb-4">Abre WhatsApp → Dispositivos Vinculados → Vincular un dispositivo</p>
                            <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-2xl">
                                <img src={qrImage} alt="QR WhatsApp" className="w-64 h-64" />
                            </div>
                            <p className="text-xs text-gray-400 mt-3">El QR se actualiza automáticamente cada 5 segundos</p>
                        </div>
                    )}

                    {/* What can WAHA do */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-3">🤖 ¿Qué hace WAHA?</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                                { icon: '📨', title: 'Envío de Cotizaciones', desc: 'Envía la cotización + PDF automáticamente al WhatsApp del cliente' },
                                { icon: '🔔', title: 'Seguimientos Auto', desc: 'Día 1 y Día 3 después de la cotización, envía recordatorio con urgencia' },
                                { icon: '💰', title: 'Recordatorio de Pagos', desc: 'Avisa a clientes con mensualidades pendientes antes del corte' },
                                { icon: '📩', title: 'Mensajes Recibidos', desc: 'Registra los mensajes que te escriben (historial en el CRM)' },
                            ].map((feat, i) => (
                                <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                                    <span className="text-2xl">{feat.icon}</span>
                                    <div>
                                        <p className="font-medium text-gray-800 text-sm">{feat.title}</p>
                                        <p className="text-xs text-gray-500">{feat.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ===================== TAB: Enviar ===================== */}
            {activeTab === 'send' && (
                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FaPaperPlane className="text-green-500" /> Enviar Mensaje Manual
                        </h3>

                        <form onSubmit={handleSend} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Número de WhatsApp</label>
                                <input
                                    type="tel"
                                    value={sendForm.phone}
                                    onChange={(e) => setSendForm(p => ({ ...p, phone: e.target.value }))}
                                    placeholder="Ej: 3001234567 o 573001234567"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none text-sm"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Mensaje</label>
                                <textarea
                                    rows={4}
                                    value={sendForm.message}
                                    onChange={(e) => setSendForm(p => ({ ...p, message: e.target.value }))}
                                    placeholder="Escribe tu mensaje aquí..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none text-sm resize-none"
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-1">Soporta *negrita*, _cursiva_ y ~tachado~ como en WhatsApp</p>
                            </div>

                            {/* Quick templates */}
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-2">Plantillas rápidas:</p>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { label: '👋 Saludo', msg: '¡Hola! Soy del equipo de Discovery Systems. ¿En este momento estoy hablando con el encargado del negocio? Me gustaría ayudarle con una solución de sistema POS para su establecimiento 🚀' },
                                        { label: '📋 Follow-up', msg: '¡Hola! Soy del equipo de Discovery Systems 👋\n\n¿Tuviste oportunidad de revisar la cotización que te enviamos?\n\nMe encantaría resolver cualquier duda. ¿Cuándo podríamos agendar una demo rápida? 🚀' },
                                        { label: '💰 Cobro', msg: '¡Hola! 👋 Le recordamos que su pago mensual del servicio de nube POS está pendiente.\n\n¿Ya realizó la transferencia? Si necesita soporte para el pago, responda a este mensaje. ¡Gracias! 🙏' },
                                    ].map((tpl, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setSendForm(p => ({ ...p, message: tpl.msg }))}
                                            className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 transition"
                                        >
                                            {tpl.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={sending || !status?.connected}
                                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {sending ? <FaSpinner className="animate-spin" /> : <FaWhatsapp />}
                                {sending ? 'Enviando...' : status?.connected ? 'Enviar por WhatsApp' : 'Conecta WhatsApp primero'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ===================== TAB: Historial ===================== */}
            {activeTab === 'logs' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <FaHistory className="text-gray-400" /> Últimos 30 mensajes
                        </h3>
                        <button onClick={fetchLogs} className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1">
                            <FaRedo className="w-3 h-3" /> Actualizar
                        </button>
                    </div>

                    {loadingLogs ? (
                        <div className="text-center p-8 text-gray-400"><FaSpinner className="animate-spin inline text-2xl" /></div>
                    ) : logs.length === 0 ? (
                        <div className="text-center p-8 bg-white rounded-2xl border border-gray-100 text-gray-400">
                            <FaHistory className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p>No hay mensajes registrados aún</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="divide-y divide-gray-50">
                                {logs.map(log => (
                                    <div key={log.id} className="px-4 py-3 hover:bg-gray-50 transition">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-lg ${log.direction === 'inbound' ? '' : ''}`}>
                                                {log.direction === 'inbound' ? '📩' : '📨'}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-800 text-sm">
                                                        {log.direction === 'inbound' ? 'Recibido' : 'Enviado'}
                                                    </span>
                                                    <span className="text-xs text-gray-400">→ {log.phone}</span>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${log.status === 'sent' || log.status === 'received' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {log.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 truncate">{log.message}</p>
                                            </div>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                                {log.created_at ? new Date(log.created_at).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ===================== TAB: Configuración ===================== */}
            {activeTab === 'setup' && (
                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4">⚙️ Configuración WAHA</h3>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <span className="text-sm font-medium text-gray-700">WAHA URL</span>
                                <code className="text-xs bg-gray-200 px-2 py-1 rounded">{status?.wahaUrl || 'No configurado'}</code>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <span className="text-sm font-medium text-gray-700">API Key</span>
                                <span className={`text-xs font-bold ${status?.config?.hasApiKey ? 'text-green-600' : 'text-red-600'}`}>
                                    {status?.config?.hasApiKey ? '✅ Configurada' : '❌ No configurada'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <span className="text-sm font-medium text-gray-700">Sesión</span>
                                <code className="text-xs bg-gray-200 px-2 py-1 rounded">{status?.config?.session || 'default'}</code>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                            <h4 className="font-bold text-blue-800 text-sm mb-2">📋 Instrucciones de instalación:</h4>
                            <ol className="text-xs text-blue-700 space-y-2 list-decimal list-inside">
                                <li>
                                    <strong>Instalar WAHA con Docker:</strong>
                                    <pre className="bg-white p-2 rounded mt-1 text-[11px] overflow-x-auto">docker run -d --name waha -p 3000:3000 -e WHATSAPP_DEFAULT_ENGINE=WEBJS devlikeapro/waha</pre>
                                </li>
                                <li>
                                    <strong>Configurar variables de entorno en Vercel:</strong>
                                    <pre className="bg-white p-2 rounded mt-1 text-[11px] overflow-x-auto">{`WAHA_URL=http://tu-servidor:3000
WAHA_API_KEY=tu-api-key
WAHA_SESSION=default`}</pre>
                                </li>
                                <li>
                                    <strong>Opciones de hosting para WAHA:</strong>
                                    <ul className="ml-4 mt-1 space-y-1 list-disc">
                                        <li><strong>Railway.app</strong> — $5/mes, fácil de configurar</li>
                                        <li><strong>Render.com</strong> — Plan gratis limitado, $7/mes para siempre activo</li>
                                        <li><strong>VPS (DigitalOcean/Hetzner)</strong> — $4-6/mes, más control</li>
                                        <li><strong>Tu propio PC</strong> — Gratis, pero debe estar encendido 24/7</li>
                                    </ul>
                                </li>
                                <li>Una vez WAHA esté corriendo, ve a la pestaña <strong>"Estado"</strong> y haz clic en <strong>"Conectar WhatsApp"</strong></li>
                            </ol>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminWhatsApp;
