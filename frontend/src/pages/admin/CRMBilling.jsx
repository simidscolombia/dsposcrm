import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaCreditCard as CreditCard, FaArrowUp as ArrowUpRight,
    FaDollarSign as DollarSign, FaCalendarAlt as Calendar,
    FaExclamationCircle as AlertCircle, FaCheckCircle as CheckCircle,
    FaClock as Clock, FaSearch as Search, FaFilter as Filter,
    FaSync as RefreshCw, FaCommentAlt as MessageSquare,
    FaFileInvoice as FileInvoice, FaImage as ImageIcon, FaTimes as X,
    FaBan as BanIcon
} from 'react-icons/fa';

const API_URL = '/api';

const CRMBilling = () => {
    const [payments, setPayments] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // Filters
    const [filterStatus, setFilterStatus] = useState('');
    const [search, setSearch] = useState('');

    // Payment Modal
    const [payModal, setPayModal] = useState({ open: false, payment: null, receiptStr: '', notes: '', loading: false });

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, [filterStatus]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Load Summary
            const sumRes = await axios.get(`${API_URL}/clients/billing/summary`);
            if (sumRes.data.success) {
                setSummary(sumRes.data);
            }

            // Load Payments
            const params = new URLSearchParams();
            if (filterStatus) params.append('status', filterStatus);
            if (search) params.append('search', search);

            const payRes = await axios.get(`${API_URL}/payments?${params.toString()}`);
            if (payRes.data.success) {
                setPayments(payRes.data.payments);
            }
        } catch (error) {
            console.error('Error fetching billing data:', error);
            alert('Error al cargar datos de facturación');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchData();
    };

    const generatePayments = async () => {
        if (!window.confirm('¿Seguro que deseas generar los cobros automáticos del mes actual? (Solo se generarán para los clientes que aún no tengan uno)')) return;

        setGenerating(true);
        try {
            const res = await axios.post(`${API_URL}/payments/generate`);
            alert(res.data.message);
            fetchData();
        } catch (error) {
            console.error('Error generando cobros:', error);
            alert('Error al generar cobros');
        } finally {
            setGenerating(false);
        }
    };

    const handleEnforceOverdue = async () => {
        if (!window.confirm('⚠️ ATENCIÓN: Esta acción revisará todos los cobros pendientes de meses ANTERIORES. Los marcará como EN MORA y Suspenderá automáticamente el servicio de esos clientes. ¿Proceder?')) return;

        try {
            const res = await axios.post(`${API_URL}/payments/enforce-overdue`);
            if (res.data.success) {
                alert(res.data.message);
                fetchData();
            }
        } catch (error) {
            console.error('Error enforcing overdue:', error);
            alert('Error procesando suspensiones');
        }
    };

    const updateStatus = async (id, newStatus, receiptStr = '', notes = '') => {
        try {
            const res = await axios.put(`${API_URL}/payments/${id}/status`, {
                status: newStatus,
                receipt_url: receiptStr,
                notes: notes
            });
            if (res.data.success) {
                alert('Estado actualizado');
                setPayModal({ ...payModal, open: false, loading: false });
                fetchData();
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error actualizando estado');
            setPayModal({ ...payModal, loading: false });
        }
    };

    const handleReceiptUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Base64 conversion (compress logic could be added here if needed)
        const reader = new FileReader();
        reader.onloadend = () => {
            setPayModal(prev => ({ ...prev, receiptStr: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const submitPayment = (e) => {
        e.preventDefault();
        setPayModal(prev => ({ ...prev, loading: true }));
        updateStatus(payModal.payment.id, 'paid', payModal.receiptStr, payModal.notes);
    };

    const sendReminder = async (id) => {
        try {
            const res = await axios.post(`${API_URL}/payments/${id}/remind`);
            if (res.data.success) {
                alert(res.data.message);
                fetchData();
            }
        } catch (error) {
            console.error('Error enviando recordatorio:', error);
            alert('Error al enviar recordatorio');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'paid': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Pagado</span>;
            case 'pending': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Pendiente</span>;
            case 'overdue': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Vencido</span>;
            case 'waived': return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium flex items-center gap-1">Exonerado</span>;
            default: return null;
        }
    };

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <CreditCard className="w-6 h-6 text-blue-600" />
                        Facturación Mensual (SaaS)
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Control de pagos, facturas y suscripciones en la nube
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                    <button
                        onClick={handleEnforceOverdue}
                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition flex items-center gap-2 font-medium"
                    >
                        <BanIcon className="w-4 h-4" />
                        Suspender Morosos
                    </button>
                    <button
                        onClick={generatePayments}
                        disabled={generating}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium disabled:opacity-70"
                    >
                        <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                        {generating ? 'Generando...' : 'Generar Cobros del Mes'}
                    </button>
                </div>
            </div>

            {/* Dashboard Stats */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Ingreso Esperado</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatMoney(summary.summary.expected_amount)}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <DollarSign className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-3 flex items-center gap-1">
                            <span className="text-blue-600 font-medium">{summary.summary.total_billable_clients}</span> clientes nube
                        </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Recaudado</p>
                                <h3 className="text-2xl font-bold text-green-600 mt-1">{formatMoney(summary.summary.collected_amount)}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                <ArrowUpRight className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-3 flex items-center gap-1">
                            <span className="text-green-600 font-medium">{summary.summary.paid_count}</span> pagos recibidos
                        </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Por Recaudar</p>
                                <h3 className="text-2xl font-bold text-yellow-600 mt-1">{formatMoney(summary.summary.pending_amount)}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-3 flex items-center gap-1">
                            <span className="text-yellow-600 font-medium">{summary.summary.pending_count}</span> pagos pendientes
                        </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">En Mora</p>
                                <h3 className="text-2xl font-bold text-red-600 mt-1">{summary.summary.overdue_count}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-3">
                            Clientes con riesgo de corte
                        </p>
                    </div>
                </div>
            )}

            {/* List & Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 md:p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50">

                    <form onSubmit={handleSearch} className="relative w-full md:w-96">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar negocio o WhatsApp..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                    </form>

                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-48">
                            <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
                            >
                                <option value="">Todos los Estados</option>
                                <option value="pending">Pendientes</option>
                                <option value="paid">Pagados</option>
                                <option value="overdue">En Mora</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-medium">Cliente</th>
                                <th className="px-6 py-4 font-medium">Periodo</th>
                                <th className="px-6 py-4 font-medium">Monto</th>
                                <th className="px-6 py-4 font-medium">Estado</th>
                                <th className="px-6 py-4 font-medium">Recordatorios</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && payments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        Cargando cobros...
                                    </td>
                                </tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        No se encontraron cobros.
                                    </td>
                                </tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{payment.business_name}</div>
                                            <div className="text-gray-500 text-xs mt-0.5">{payment.whatsapp} • {payment.plan_type}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-700">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span>{payment.period_month}/{payment.period_year}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {formatMoney(payment.amount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(payment.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-gray-600">
                                                <MessageSquare className="w-4 h-4 text-gray-400" />
                                                {payment.reminder_count > 0 ? (
                                                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-md">{payment.reminder_count} enviados</span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">0</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {/* Reminder Action */}
                                                {(payment.status === 'pending' || payment.status === 'overdue') && (
                                                    <button
                                                        onClick={() => sendReminder(payment.id)}
                                                        className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition"
                                                        title="Enviar WhatsApp"
                                                    >
                                                        Notificar
                                                    </button>
                                                )}

                                                {/* Mark Paid Action */}
                                                {(payment.status === 'pending' || payment.status === 'overdue') && (
                                                    <button
                                                        onClick={() => setPayModal({ open: true, payment, receiptStr: '', notes: '', loading: false })}
                                                        className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition"
                                                    >
                                                        Registrar Pago
                                                    </button>
                                                )}

                                                {/* Undo Action */}
                                                {payment.status === 'paid' && (
                                                    <>
                                                        {payment.receipt_url && (
                                                            <button
                                                                onClick={() => window.open(payment.receipt_url.startsWith('data:') ? payment.receipt_url : `/${payment.receipt_url}`, '_blank')}
                                                                className="px-2 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-medium hover:bg-emerald-100 transition flex items-center"
                                                                title="Ver Comprobante"
                                                            >
                                                                <ImageIcon className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => updateStatus(payment.id, 'pending')}
                                                            className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                                                        >
                                                            Revertir
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Modal */}
            {payModal.open && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <form onSubmit={submitPayment} className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-in-up overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <FileInvoice className="text-blue-600" />
                                Registrar Pago
                            </h2>
                            <button type="button" onClick={() => setPayModal({ open: false })} className="text-gray-400 hover:text-red-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="bg-blue-50 text-blue-800 p-3 rounded-xl text-sm mb-2">
                                <p><strong>Cliente:</strong> {payModal.payment?.business_name}</p>
                                <p><strong>Periodo:</strong> {payModal.payment?.period_month}/{payModal.payment?.period_year}</p>
                                <p className="text-lg font-bold mt-1 text-blue-900 border-t border-blue-200 pt-1">
                                    Monto: {formatMoney(payModal.payment?.amount)}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Comprobante (Foto/Captura)</label>
                                <div className="border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center bg-gray-50">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleReceiptUpload}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    {payModal.receiptStr && (
                                        <div className="mt-2 flex flex-col items-center">
                                            <span className="text-xs text-green-600 font-bold mb-1">✓ Imagen adjunta</span>
                                            <img src={payModal.receiptStr} alt="Preview" className="h-20 w-auto rounded border border-gray-200 shadow-sm" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notas Adicionales (Opcional)</label>
                                <input
                                    type="text"
                                    value={payModal.notes}
                                    onChange={(e) => setPayModal(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                    placeholder="Ej. Transferencia Nequi, etc."
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                            <button type="button" onClick={() => setPayModal({ open: false })} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg text-sm">Cancelar</button>
                            <button type="submit" disabled={payModal.loading} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 text-sm shadow disabled:opacity-50">
                                {payModal.loading ? 'Guardando...' : 'Confirmar Pago'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default CRMBilling;
