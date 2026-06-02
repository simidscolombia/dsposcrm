import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaUsers, FaSearch, FaFilter, FaEdit, FaServer,
    FaDesktop, FaVideo, FaCheckCircle, FaTimesCircle, FaWhatsapp, FaCopy, FaExternalLinkAlt, FaBuilding, FaWrench,
    FaArrowDown, FaBell, FaFileCsv, FaSpinner, FaPlus, FaCloudUploadAlt, FaMagic, FaDownload, FaCloud, FaHome, FaRocket, FaCalendarAlt, FaExclamationTriangle
} from 'react-icons/fa';
import CloudTab from '../../components/Admin/CloudTab';
import ClientWizard from '../../components/Admin/ClientWizard';

const API_URL = '';

const CRMClients = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [search, setSearch] = useState('');
    const [filterPlan, setFilterPlan] = useState('');
    const [options, setOptions] = useState({ distributors: [], advisors: [] });

    // Manage edit modal state
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({});
    const [isExtractingRut, setIsExtractingRut] = useState(false);
    const [downloadingId, setDownloadingId] = useState(null);
    const [activeTab, setActiveTab] = useState('todos');
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    
    // Modal sub-tab state & history
    const [modalTab, setModalTab] = useState('general');
    const [paymentsHistory, setPaymentsHistory] = useState([]);
    const [newPayment, setNewPayment] = useState({
        payment_date: new Date().toISOString().split('T')[0],
        amount: '',
        months_covered: 1,
        method: 'transfer',
        notes: ''
    });

    // States para el nuevo Calendario de Pagos Mensual
    const [billingMonths, setBillingMonths] = useState([]);
    const [loadingBillingMonths, setLoadingBillingMonths] = useState(false);
    const [adminInvoices, setAdminInvoices] = useState([]);
    const [loadingAdminInvoices, setLoadingAdminInvoices] = useState(false);
    const [billingYear, setBillingYear] = useState(new Date().getFullYear());
    const [editingMonth, setEditingMonth] = useState(null);
    const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
    const [updatingMonthStatus, setUpdatingMonthStatus] = useState(false);
    const [isGeneratingBoldLink, setIsGeneratingBoldLink] = useState(false);
    const [isMarkingPaid, setIsMarkingPaid] = useState(false);
    const [isEmittingDian, setIsEmittingDian] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [loadingAlerts, setLoadingAlerts] = useState(false);



    // Descarga controlada del instalador local con autenticación heredada
    const handleDownloadInstaller = async (clientId, businessName) => {
        setDownloadingId(clientId);
        try {
            const cleanName = businessName.replace(/[^a-zA-Z0-9]/g, '');
            const res = await axios.get(`${API_URL}/clients/${clientId}/provision/local`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Instalador_SIMIDS_${cleanName}.zip`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error('Error downloading installer:', error);
            alert('Error al generar o descargar el instalador local. Valida tu conexión.');
        } finally {
            setDownloadingId(null);
        }
    };

    // Creates new client UI
    const handleNewClientClick = () => {
        setIsWizardOpen(true);
    };

    const handleWizardSave = async (wizardData) => {
        try {
            const res = await axios.post(`${API_URL}/clients`, wizardData);
            if (res.data.success) {
                alert('🚀 Cliente creado y aprovisionado con éxito.');
                fetchClients();
            } else {
                alert('No se pudo guardar el cliente: ' + (res.data.error || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error in wizard save:', error);
            alert('Error al guardar: ' + (error.response?.data?.error || error.message));
        }
    };

    useEffect(() => {
        fetchOptions();
        fetchClients();
        fetchAlerts();
        // eslint-disable-next-line
    }, [filterPlan]);

    const fetchOptions = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/crm/options`);
            if (res.data.success) {
                setOptions({
                    distributors: res.data.distributors || [],
                    advisors: res.data.advisors || []
                });
            }
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    };

    const fetchClients = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (filterPlan) params.append('plan_type', filterPlan);

            const res = await axios.get(`${API_URL}/clients?${params.toString()}`);
            if (res.data.success) {
                setClients(res.data.clients);
                setStats(res.data.stats);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchClients();
    };

    const handleCopy = (text, type) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        alert(`${type} copiado al portapapeles: ${text}`);
    };

    const getPlanBadge = (plan) => {
        if (plan === 'cloud') return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">☁️ Nube</span>;
        if (plan === 'cloud_fe') return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-medium">☁️ Nube + FE</span>;
        if (plan === 'nube') return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">☁️ Nube</span>;
        if (plan === 'nube_hibrida') return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">Nube Híbrida</span>;
        if (plan === 'monocaja') return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">Monocaja</span>;
        if (plan === 'multicaja') return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-medium">Multicaja</span>;
        if (plan === 'local') return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">🏠 Local</span>;
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">{plan}</span>;
    };

    const handleApproveClient = async (clientId) => {
        if (!window.confirm('¿Aprobar este cliente? Se marcará como revisado y aprobado.')) return;
        try {
            const res = await axios.put(`${API_URL}/clients/${clientId}`, { payment_status: 'active' });
            if (res.data.success) {
                alert('✅ Cliente aprobado correctamente');
                fetchClients();
            }
        } catch (error) {
            console.error('Error approving client:', error);
            alert('Error al aprobar el cliente');
        }
    };

    // Calcula la próxima fecha de cobro basado en billing_start_date y billing_cycle
    const getNextDueDate = (client) => {
        if (!client.billing_start_date) return null;
        const start = new Date(client.billing_start_date);
        const now = new Date();
        const cycle = client.billing_cycle || 'monthly';
        const monthsPerCycle = cycle === 'annual' ? 12 : cycle === 'semiannual' ? 6 : 1;

        let nextDue = new Date(start);
        while (nextDue <= now) {
            nextDue.setMonth(nextDue.getMonth() + monthsPerCycle);
        }
        return nextDue;
    };

    const getDueStatus = (client) => {
        const nextDue = getNextDueDate(client);
        if (!nextDue) return { status: 'unknown', label: 'Sin fecha', color: 'gray', daysLeft: null };
        const now = new Date();
        const diffMs = nextDue - now;
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysLeft < 0) return { status: 'overdue', label: `Vencido hace ${Math.abs(daysLeft)} días`, color: 'red', daysLeft };
        if (daysLeft <= 5) return { status: 'upcoming', label: `Vence en ${daysLeft} días`, color: 'amber', daysLeft };
        return { status: 'ok', label: `Faltan ${daysLeft} días`, color: 'green', daysLeft };
    };

    const getVencimientosClients = () => {
        return clients
            .filter(c => c.is_active && c.billing_start_date && c.plan_type !== 'monocaja')
            .map(c => ({ ...c, _due: getDueStatus(c), _nextDue: getNextDueDate(c) }))
            .sort((a, b) => (a._due.daysLeft ?? 9999) - (b._due.daysLeft ?? 9999));
    };

    const getStatusIndicator = (isActive) => {
        return isActive
            ? <FaCheckCircle className="text-green-500 w-4 h-4" title="Activo" />
            : <FaTimesCircle className="text-red-500 w-4 h-4" title="Inactivo" />;
    };

    const handleEditClick = async (client) => {
        setFormData({ ...client });
        setEditingClient(client);
        setModalTab('general');
        setPaymentsHistory([]);
        if (client.id) {
            try {
                const res = await axios.get(`${API_URL}/clients/${client.id}/payments-history`);
                if (res.data.success) {
                    setPaymentsHistory(res.data.history || []);
                }
            } catch (error) {
                console.error("Error fetching payments history:", error);
            }
        }
    };

    // Métodos para el nuevo Calendario de Pagos Mensual
    const fetchBillingMonths = async (clientId) => {
        setLoadingBillingMonths(true);
        try {
            const res = await axios.get(`/billing/months`, {
                params: { client_id: clientId }
            });
            if (res.data.success) {
                setBillingMonths(res.data.months || []);
            }
        } catch (error) {
            console.error("Error fetching billing months:", error);
        } finally {
            setLoadingBillingMonths(false);
        }
    };

    const fetchAdminInvoices = async (nit) => {
        if (!nit) return;
        setLoadingAdminInvoices(true);
        try {
            const res = await axios.get(`/billing/admin-invoices`, {
                params: { nit }
            });
            if (res.data.success) {
                setAdminInvoices(res.data.facturas || []);
            }
        } catch (error) {
            console.error("Error fetching admin invoices:", error);
        } finally {
            setLoadingAdminInvoices(false);
        }
    };

    const handleUpdateMonthStatus = async (monthId, statusData) => {
        setUpdatingMonthStatus(true);
        try {
            const res = await axios.put(`/billing/months/${monthId}`, statusData);
            if (res.data.success) {
                alert("Estado del mes actualizado con éxito");
                fetchBillingMonths(formData.id);
                setEditingMonth(null);
            }
        } catch (error) {
            console.error("Error updating billing month:", error);
            alert("Error al actualizar estado: " + (error.response?.data?.error || error.message));
        } finally {
            setUpdatingMonthStatus(false);
        }
    };

    const handleCreateAdminInvoice = async (monthId) => {
        if (!window.confirm("¿Estás seguro de generar la factura mensual en admin.poslatino.com para este mes?")) return;
        setIsGeneratingInvoice(true);
        try {
            const res = await axios.post(`/billing/months/${monthId}/create-admin-invoice`, {
                generar_electronica: formData.has_electronic_billing === true
            });
            if (res.data.success) {
                alert("Factura creada y vinculada correctamente!");
                fetchBillingMonths(formData.id);
                fetchAdminInvoices(formData.nit);
                setEditingMonth(null);
            }
        } catch (error) {
            console.error("Error generating admin invoice:", error);
            alert("Error al generar factura: " + (error.response?.data?.error || error.message));
        } finally {
            setIsGeneratingInvoice(false);
        }
    };

    const handleMarkAsPaidAndDian = async (monthId, paymentMethod = 'transferencia') => {
        if (!window.confirm("¿Confirmas que recibiste el pago y deseas marcar la factura como PAGADA y enviarla a la DIAN?")) return;
        setIsMarkingPaid(true);
        try {
            const res = await axios.post(`/billing/months/${monthId}/mark-paid`, {
                metodo_pago: paymentMethod
            });
            if (res.data.success) {
                if (res.data.warning) {
                    alert(`⚠️ ${res.data.warning}. Detalle DIAN: ${res.data.error_dian}`);
                } else {
                    alert("✅ Factura marcada como pagada y emitida a la DIAN exitosamente!");
                }
                fetchBillingMonths(formData.id);
                fetchAdminInvoices(formData.nit);
                setEditingMonth(null);
            }
        } catch (error) {
            console.error("Error marking paid and sending to DIAN:", error);
            alert("Error al procesar pago: " + (error.response?.data?.error || error.message));
        } finally {
            setIsMarkingPaid(false);
        }
    };

    const handleEmitDian = async (monthId) => {
        if (!window.confirm("¿Estás seguro de enviar esta factura a la DIAN ahora?")) return;
        setIsEmittingDian(true);
        try {
            const res = await axios.post(`/billing/months/${monthId}/emit-dian`);
            if (res.data.success) {
                alert("⚡ Factura emitida a la DIAN exitosamente!");
                fetchBillingMonths(formData.id);
                fetchAdminInvoices(formData.nit);
                setEditingMonth(null);
            }
        } catch (error) {
            console.error("Error emitting to DIAN:", error);
            alert("Error al emitir a la DIAN: " + (error.response?.data?.error || error.message));
        } finally {
            setIsEmittingDian(false);
        }
    };

    const handleDownloadAdminInvoicePDF = async (invoiceId) => {
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
            console.error("Error downloading admin invoice PDF:", error);
            alert("Error al descargar PDF");
        }
    };


    const handleUpdateChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const saveClient = async () => {
        try {
            if (!formData.business_name || !formData.whatsapp) {
                alert('El nombre del negocio y el WhatsApp son obligatorios');
                return;
            }

            const updateProps = {
                business_name: formData.business_name,
                nit: formData.nit,
                legal_representative: formData.legal_representative,
                email: formData.email,
                city: formData.city,
                address: formData.address,
                whatsapp: formData.whatsapp,
                plan_type: formData.plan_type,
                monthly_amount: parseFloat(formData.monthly_amount) || 0,
                pos_version: formData.pos_version,
                server_name: formData.server_name,
                cloud_url: formData.cloud_url,
                anydesk_id: formData.anydesk_id,
                distributor_id: formData.distributor_id || null,
                technician_id: formData.technician_id || null,
                is_active: formData.is_active === 'true' || formData.is_active === true,
                billing_start_date: formData.billing_start_date || null,
                billing_cycle: formData.billing_cycle || 'monthly',
                has_electronic_billing: formData.has_electronic_billing === 'true' || formData.has_electronic_billing === true
            };

            let res;
            if (editingClient.id) {
                res = await axios.put(`${API_URL}/clients/${editingClient.id}`, updateProps);
            } else {
                res = await axios.post(`${API_URL}/clients`, updateProps);
            }

            if (res.data.success) {
                alert(editingClient.id ? 'Cliente actualizado correctamente' : 'Nuevo cliente creado correctamente');
                setEditingClient(null);
                fetchClients(); // recargar
            }
        } catch (error) {
            console.error('Error saving client:', error);
            alert('Error al guardar el cliente');
        }
    };

    const handleAddPayment = async () => {
        if (!newPayment.payment_date || !newPayment.amount) {
            alert('Fecha y monto son obligatorios');
            return;
        }
        try {
            const res = await axios.post(`${API_URL}/clients/${editingClient.id}/payments-history`, newPayment);
            if (res.data.success) {
                alert('Pago registrado correctamente');
                const histRes = await axios.get(`${API_URL}/clients/${editingClient.id}/payments-history`);
                if (histRes.data.success) setPaymentsHistory(histRes.data.history || []);
                
                // Recargar clientes para ver progreso actualizado
                fetchClients();
                
                setNewPayment({
                    payment_date: new Date().toISOString().split('T')[0],
                    amount: '',
                    months_covered: 1,
                    method: 'transfer',
                    notes: ''
                });
            }
        } catch (error) {
            console.error("Error adding payment:", error);
            alert("Error al registrar pago");
        }
    };

    const handleStatusNotify = async (id, type) => {
        let confirmMsg = type === 'downgrade_to_local'
            ? '¿Estás seguro de dar de baja la NUBE de este cliente y enviarle el mensaje de WhatsApp de que ahora es LOCAL (Gratis)?'
            : '¿Enviar mensaje de WhatsApp notificando que lleva TIEMPO DESCONECTADO de la nube?';

        if (!window.confirm(confirmMsg)) return;

        try {
            const res = await axios.post(`${API_URL}/clients/${id}/status-notify`, { type });
            if (res.data.success) {
                alert(res.data.message);
                fetchClients(); // recarga para ver si cambió a local
            }
        } catch (error) {
            console.error('Error sending notification:', error);
            alert('Error al enviar notificación de estado');
        }
    };
    
    const fetchAlerts = async () => {
        setLoadingAlerts(true);
        try {
            const res = await axios.get(`/billing/alerts`);
            if (res.data.success) {
                setAlerts(res.data.alerts || []);
            }
        } catch (error) {
            console.error("Error fetching billing alerts:", error);
        } finally {
            setLoadingAlerts(false);
        }
    };

    const handleResolveAlert = async (alertId, action) => {
        const actionStr = action === 'approve' ? 'aprobar la cortesía' : 'rechazar la solicitud';
        if (!window.confirm(`¿Estás seguro de que deseas ${actionStr} para este cliente?`)) return;
        
        try {
            const res = await axios.post(`/billing/alerts/${alertId}/resolve`, { action });
            if (res.data.success) {
                alert(`✅ Alerta resuelta con éxito`);
                fetchAlerts();
                fetchClients(); // actualizar lista si cambió estado
            }
        } catch (error) {
            console.error("Error resolving alert:", error);
            alert("Error al resolver alerta: " + (error.response?.data?.error || error.message));
        }
    };

    const handleMigrateV2 = async (clientId, businessName) => {
        if (!window.confirm(`⚠️ ADVERTENCIA DE MIGRACIÓN ⚠️\n\n¿Estás absolutamente seguro de que deseas iniciar la migración de la base de datos de ${businessName} hacia el nuevo sistema Multitenant V2?\n\nEsta acción copiará productos, ventas y usuarios a la nueva arquitectura compartida.`)) {
            return;
        }
        
        try {
            alert(`Iniciando migración para ${businessName}... (Esta función estará conectada al motor de migración pronto)`);
            // const res = await axios.post(`${API_URL}/clients/${clientId}/migrate-to-v2`);
            // if (res.data.success) {
            //     alert('✅ Cliente migrado a V2 con éxito.');
            //     fetchClients();
            // }
        } catch (error) {
            console.error('Error migrating to V2:', error);
            alert('❌ Error al intentar migrar el cliente.');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            alert('Por favor selecciona un archivo con extensión .CSV (Puedes exportarlo desde Google Sheets / Excel)');
            e.target.value = null;
            return;
        }

        setLoading(true);
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        try {
            const res = await axios.post(`${API_URL}/clients/import`, formDataUpload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                alert(res.data.message);
                fetchClients();
            }
        } catch (error) {
            console.error('Error uploading:', error);
            alert(error.response?.data?.error || 'Error subiendo el archivo. Asegúrate de que las columnas coincidan.');
        } finally {
            e.target.value = null;
            setLoading(false);
        }
    };

    const handleRutUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert('Por favor selecciona un archivo PDF original del RUT.');
            e.target.value = null;
            return;
        }

        setIsExtractingRut(true);
        const rutData = new FormData();
        rutData.append('rutFile', file);

        try {
            const res = await axios.post(`${API_URL}/ai/extract-rut`, rutData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success && res.data.data) {
                const aiData = res.data.data;
                // Patch the currently edited values
                setFormData(prev => ({
                    ...prev,
                    business_name: aiData.businessName || prev.business_name || '',
                    nit: aiData.nit || prev.nit || '',
                    legal_representative: aiData.legalRepresentative || prev.legal_representative || '',
                    whatsapp: aiData.phone || prev.whatsapp || '',
                    email: aiData.email || prev.email || '',
                    city: aiData.city || prev.city || '',
                    address: aiData.address || prev.address || '',
                }));
                alert('RUT procesado. Se han autocompletado los datos encontrados.');
            }
        } catch (error) {
            console.error('Error procesando RUT:', error);
            alert(error.response?.data?.error || 'No se pudo procesar el archivo. ¿Estás seguro de que es un PDF válido del RUT?');
        } finally {
            e.target.value = null;
            setIsExtractingRut(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FaUsers className="w-6 h-6 text-blue-600" />
                        Control de Clientes
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Gestión técnica, soporte y asignación de distribuidores
                    </p>
                </div>

                <div className="flex gap-2 flex-wrap">
                    <button onClick={handleNewClientClick} className="px-3 py-2 bg-blue-600 border border-blue-700 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm shadow-sm transition">
                        <FaPlus /> Nuevo Cliente
                    </button>

                    <button onClick={fetchClients} className="px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm shadow-sm transition">
                        Actualizar
                    </button>

                    {/* Botón Importar CSV */}
                    <div className="relative">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            id="csv_upload"
                            disabled={loading}
                        />
                        <label
                            htmlFor="csv_upload"
                            className={`px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 flex items-center gap-2 text-sm shadow-sm transition cursor-pointer ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            {loading ? <FaSpinner className="animate-spin" /> : <FaFileCsv size={16} />}
                            Importar CSV Sheets
                        </label>
                    </div>
                </div>
            </div>

            {/* Metrics */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex justify-center items-center">
                            <FaUsers />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-semibold uppercase">Total Clientes</p>
                            <h3 className="text-xl font-bold text-gray-800">{stats.total_clients}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex justify-center items-center">
                            <FaServer />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-semibold uppercase">SaaS Activo</p>
                            <h3 className="text-xl font-bold text-gray-800">{parseInt(stats.cloud_clients || 0) + parseInt(stats.cloud_fe_clients || 0)}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex justify-center items-center">
                            <FaCheckCircle />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-semibold uppercase">Cartera Sana</p>
                            <h3 className="text-xl font-bold text-gray-800">{stats.active_clients}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex justify-center items-center">
                            <FaTimesCircle />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-semibold uppercase">Suspendidos</p>
                            <h3 className="text-xl font-bold text-gray-800">{stats.suspended_clients}</h3>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab Bar */}
            <div className="flex gap-1 mb-4 bg-white rounded-xl p-1 border border-gray-200 shadow-sm w-fit">
                <button onClick={() => setActiveTab('todos')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'todos' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>
                    <FaUsers size={14} /> Todos
                </button>
                <button onClick={() => setActiveTab('nube')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'nube' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>
                    <FaCloud size={14} /> Nube ☁️
                </button>
                <button onClick={() => setActiveTab('locales')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'locales' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>
                    <FaHome size={14} /> Locales 🏠
                </button>
                <button onClick={() => setActiveTab('vencimientos')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'vencimientos' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>
                    <FaCalendarAlt size={14} /> Vencimientos 📅
                </button>
                <button onClick={() => setActiveTab('alertas')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all relative ${activeTab === 'alertas' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>
                    <FaBell size={14} /> Alertas de Cobro 🔔
                    {alerts.filter(a => a.status === 'pending').length > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border border-white animate-bounce">
                            {alerts.filter(a => a.status === 'pending').length}
                        </span>
                    )}
                </button>
            </div>

            {/* Tab: Nube */}
            {activeTab === 'nube' && <CloudTab crmClients={clients} onEditClick={handleEditClick} />}

            {/* Tab: Vencimientos */}
            {activeTab === 'vencimientos' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><FaCalendarAlt className="text-blue-600" /> Calendario de Vencimientos</h2>
                    <p className="text-xs text-gray-500 mt-1">Clientes activos con suscripción configurada, ordenados por urgencia de cobro.</p>
                    <div className="flex gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-xs"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Vencido</div>
                        <div className="flex items-center gap-1.5 text-xs"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span> Próximo (≤5 días)</div>
                        <div className="flex items-center gap-1.5 text-xs"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> Al día</div>
                        <div className="flex items-center gap-1.5 text-xs"><span className="w-3 h-3 rounded-full bg-gray-300 inline-block"></span> Sin fecha</div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="px-5 py-3 font-medium w-10">Estado</th>
                                <th className="px-5 py-3 font-medium">Negocio</th>
                                <th className="px-5 py-3 font-medium">Plan</th>
                                <th className="px-5 py-3 font-medium">Ciclo</th>
                                <th className="px-5 py-3 font-medium">Monto</th>
                                <th className="px-5 py-3 font-medium">F.E.</th>
                                <th className="px-5 py-3 font-medium">Próximo Cobro</th>
                                <th className="px-5 py-3 font-medium">Tiempo</th>
                                <th className="px-5 py-3 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {getVencimientosClients().length === 0 ? (
                                <tr><td colSpan="9" className="px-5 py-8 text-center text-gray-400">No hay clientes con suscripción configurada. Edita un cliente y configura su "Fecha de Inicio" en la pestaña financiera.</td></tr>
                            ) : (
                                getVencimientosClients().map((c) => (
                                    <tr key={c.id} className={`hover:bg-gray-50/50 transition-colors ${
                                        c._due.status === 'overdue' ? 'bg-red-50/40' : c._due.status === 'upcoming' ? 'bg-amber-50/40' : ''
                                    }`}>
                                        <td className="px-5 py-3">
                                            <span className={`w-3.5 h-3.5 rounded-full inline-block ${
                                                c._due.color === 'red' ? 'bg-red-500 animate-pulse' :
                                                c._due.color === 'amber' ? 'bg-amber-400' :
                                                c._due.color === 'green' ? 'bg-green-500' : 'bg-gray-300'
                                            }`}></span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="font-bold text-gray-900">{c.business_name}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                                <span>{c.city || 'Sin Ciudad'}</span>
                                                <a href={`https://wa.me/57${c.whatsapp?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-green-600">
                                                    <FaWhatsapp className="text-green-500" /> {c.whatsapp}
                                                </a>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">{getPlanBadge(c.plan_type)}</td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                                c.billing_cycle === 'annual' ? 'bg-purple-100 text-purple-700' :
                                                c.billing_cycle === 'semiannual' ? 'bg-indigo-100 text-indigo-700' :
                                                'bg-sky-100 text-sky-700'
                                            }`}>
                                                {c.billing_cycle === 'annual' ? 'Anual' : c.billing_cycle === 'semiannual' ? 'Semestral' : 'Mensual'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 font-bold text-gray-800">${parseFloat(c.monthly_amount || 0).toLocaleString('es-CO')}</td>
                                        <td className="px-5 py-3">
                                            {c.has_electronic_billing
                                                ? <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[9px] font-extrabold uppercase">FE ✓</span>
                                                : <span className="text-gray-300 text-xs">—</span>
                                            }
                                        </td>
                                        <td className="px-5 py-3 font-mono text-xs">
                                            {c._nextDue ? c._nextDue.toISOString().split('T')[0] : '—'}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`text-xs font-bold ${
                                                c._due.color === 'red' ? 'text-red-600' :
                                                c._due.color === 'amber' ? 'text-amber-600' :
                                                c._due.color === 'green' ? 'text-green-600' : 'text-gray-400'
                                            }`}>
                                                {c._due.status === 'overdue' && <FaExclamationTriangle className="inline mr-1" />}
                                                {c._due.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <a href={`https://wa.me/57${c.whatsapp?.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(c.business_name)}%2C%20le%20recordamos%20que%20su%20pago%20del%20servicio%20POS%20est%C3%A1%20pr%C3%B3ximo%20a%20vencer.`}
                                                    target="_blank" rel="noreferrer"
                                                    className="w-8 h-8 rounded-lg bg-green-50 border border-green-200 text-green-600 flex items-center justify-center hover:bg-green-100 transition"
                                                    title="Enviar recordatorio por WhatsApp">
                                                    <FaWhatsapp />
                                                </a>
                                                <button onClick={() => handleEditClick(c)}
                                                    className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition"
                                                    title="Editar / Registrar Pago">
                                                    <FaEdit />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Resumen rápido al pie */}
                {getVencimientosClients().length > 0 && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex gap-6 text-xs font-bold">
                        <span className="text-red-600">🔴 Vencidos: {getVencimientosClients().filter(c => c._due.status === 'overdue').length}</span>
                        <span className="text-amber-600">🟡 Próximos: {getVencimientosClients().filter(c => c._due.status === 'upcoming').length}</span>
                        <span className="text-green-600">🟢 Al día: {getVencimientosClients().filter(c => c._due.status === 'ok').length}</span>
                        <span className="text-gray-500 ml-auto">Total suscripciones activas: {getVencimientosClients().length}</span>
                    </div>
                )}
            </div>
            )}

            {/* Tab: Alertas de Cobro */}
            {activeTab === 'alertas' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
                    <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <FaBell className="text-red-500 animate-pulse" /> Solicitudes y Alertas de Suscripciones
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">Gestión de cortesías solicitadas por WhatsApp y alertas de moras críticas generadas automáticamente.</p>
                        </div>
                        <button 
                            onClick={fetchAlerts}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition flex items-center gap-1"
                        >
                            🔄 Refrescar
                        </button>
                    </div>

                    <div className="p-6">
                        {loadingAlerts ? (
                            <div className="py-8 text-center text-gray-400 flex items-center justify-center gap-2">
                                <FaSpinner className="animate-spin text-blue-500" /> Cargando alertas...
                            </div>
                        ) : alerts.length === 0 ? (
                            <div className="py-12 text-center text-gray-400">
                                <FaBell size={32} className="mx-auto mb-3 text-gray-300" />
                                No tienes alertas de cobro pendientes en este momento. ✨
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {alerts.map((alert) => {
                                    const isPending = alert.status === 'pending';
                                    
                                    return (
                                        <div 
                                            key={alert.id} 
                                            className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${
                                                alert.status === 'approved' ? 'bg-green-50/30 border-green-100 opacity-75' :
                                                alert.status === 'rejected' ? 'bg-red-50/30 border-red-100 opacity-75' :
                                                alert.alert_type === 'courtesy_request' ? 'bg-blue-50/30 border-blue-200' : 'bg-amber-50/30 border-amber-200'
                                            }`}
                                        >
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                                        alert.alert_type === 'courtesy_request' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {alert.alert_type === 'courtesy_request' ? '🔵 Solicitud de Cortesía' : '⚠️ Mora Crítica (Día 5)'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-mono">
                                                        {new Date(alert.created_at).toLocaleString('es-CO')}
                                                    </span>
                                                </div>
                                                
                                                <h4 className="font-bold text-gray-800 text-sm">
                                                    {alert.business_name} <span className="font-normal text-gray-500 text-xs">({alert.nit})</span>
                                                </h4>
                                                
                                                <p className="text-xs text-gray-600 bg-white/70 p-2.5 rounded-lg border border-gray-100 inline-block font-mono max-w-2xl">
                                                    {alert.reason}
                                                </p>
                                                
                                                <div className="text-[11px] text-gray-500 flex items-center gap-3">
                                                    <span>Período afectado: <strong>{alert.month}/{alert.year}</strong></span>
                                                    <span>Monto: <strong>${parseFloat(alert.amount).toLocaleString('es-CO')}</strong></span>
                                                    {alert.whatsapp && (
                                                        <a href={`https://wa.me/57${alert.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-green-600 font-bold flex items-center gap-0.5 hover:underline font-bold">
                                                            <FaWhatsapp /> Contactar ({alert.whatsapp})
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex md:flex-col gap-2 w-full md:w-auto items-end shrink-0">
                                                {isPending ? (
                                                    <>
                                                        <button 
                                                            onClick={() => handleResolveAlert(alert.id, 'approve')}
                                                            className="flex-1 md:w-36 py-2 px-3 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition shadow-sm flex items-center justify-center gap-1"
                                                        >
                                                            Aprobar Cortesía
                                                        </button>
                                                        <button 
                                                            onClick={() => handleResolveAlert(alert.id, 'reject')}
                                                            className="flex-1 md:w-36 py-2 px-3 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition shadow-sm flex items-center justify-center gap-1"
                                                        >
                                                            Rechazar / Cobrar
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className={`px-4 py-1.5 rounded-lg text-xs font-bold border ${
                                                        alert.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                                                    }`}>
                                                        {alert.status === 'approved' ? 'Aprobada ✓' : 'Rechazada ✗'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tab: Todos / Locales */}
            {(activeTab === 'todos' || activeTab === 'locales') && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 md:p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50">

                    <form onSubmit={handleSearch} className="relative w-full md:w-96">
                        <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar negocio, url, o WhatsApp..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                    </form>

                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-48">
                            <FaFilter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <select
                                value={filterPlan}
                                onChange={(e) => setFilterPlan(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
                            >
                                <option value="">Todos los Planes</option>
                                <option value="cloud">☁️ Nube</option>
                                <option value="cloud_fe">☁️ Nube + FE</option>
                                <option value="local">🏠 Local</option>
                                <option value="monocaja">Monocaja</option>
                                <option value="multicaja">Multicaja</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-medium w-10">St</th>
                                <th className="px-6 py-4 font-medium">Negocio / Cliente</th>
                                <th className="px-6 py-4 font-medium">Plan</th>
                                <th className="px-6 py-4 font-medium">Técnica (Rápidas)</th>
                                <th className="px-6 py-4 font-medium">Distribuidor</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Cargando portafolio...</td></tr>
                            ) : clients.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No hay clientes con esos filtros.</td></tr>
                            ) : (
                                clients.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            {getStatusIndicator(c.is_active)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900 flex items-center gap-2">
                                                {c.business_name}
                                                {c.tenant_id ? (
                                                    <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-purple-200">V2</span>
                                                ) : (
                                                    <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold border border-gray-200">V1</span>
                                                )}
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${c.profile_completion >= 100 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                    📊 {c.profile_completion || 0}%
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                <span>{c.city || 'Sin Ciudad'}</span>
                                                <a href={`https://wa.me/57${c.whatsapp?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-green-600 transition">
                                                    <FaWhatsapp className="text-green-500" /> {c.whatsapp}
                                                </a>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1 flex-wrap">
                                                    {getPlanBadge(c.plan_type)}
                                                    {c.has_electronic_billing && (
                                                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[9px] font-extrabold uppercase">FE Activa</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500 font-medium">
                                                    Ciclo: <span className="font-bold text-gray-700 capitalize">{c.billing_cycle === 'annual' ? 'Anual' : c.billing_cycle === 'semiannual' ? 'Semestral' : 'Mensual'}</span>
                                                </div>
                                                <div className="text-xs text-gray-400">V: {c.pos_version || 'N/A'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {/* Botón rápido Anydesk */}
                                                <button
                                                    onClick={() => handleCopy(c.anydesk_id, 'AnyDesk ID')}
                                                    className={`px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition flex items-center gap-1 text-xs font-semibold ${!c.anydesk_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    title={c.anydesk_id ? `Intervenir AnyDesk: ${c.anydesk_id}` : 'No hay AnyDesk provisto'}
                                                >
                                                    <FaDesktop /> {c.anydesk_id || 'Sin AnyDesk'} <FaCopy className="opacity-50" />
                                                </button>

                                                {/* Botón rápido Nube */}
                                                <button
                                                    onClick={() => c.cloud_url ? window.open(c.cloud_url.startsWith('http') ? c.cloud_url : `https://${c.cloud_url}`, '_blank') : null}
                                                    className={`px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition flex items-center gap-1 text-xs font-semibold ${!c.cloud_url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    title={c.cloud_url ? `Abrir url: ${c.cloud_url}` : 'No opera en nube o url no configurada'}
                                                >
                                                    <FaServer /> WEB <FaExternalLinkAlt className="opacity-50" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <div className="text-sm font-medium text-gray-800 flex items-center gap-1"><FaBuilding className="text-gray-400 text-xs" /> {c.distributor_name || 'Discovery (Por defecto)'}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><FaWrench className="text-gray-400 text-xs" /> Téc: {options.advisors?.find(a => a.id === c.technician_id)?.name || 'Sin asignar'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditClick(c)}
                                                    className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition"
                                                    title="Editar datos del cliente"
                                                >
                                                    <FaEdit />
                                                </button>
                                                {c.payment_status !== 'active' && (
                                                    <button
                                                        onClick={() => handleApproveClient(c.id)}
                                                        className="px-3 py-1.5 rounded-lg bg-green-50 border border-green-300 text-green-700 flex items-center justify-center gap-1 hover:bg-green-100 transition text-xs font-bold"
                                                        title="Aprobar este cliente"
                                                    >
                                                        <FaCheckCircle /> Aprobar
                                                    </button>
                                                )}
                                                {c.payment_status === 'active' && (
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-[10px] font-bold border border-green-200">✅ Aprobado</span>
                                                )}
                                                <button
                                                    onClick={() => handleStatusNotify(c.id, 'long_disconnected')}
                                                    className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center hover:bg-orange-100 transition"
                                                    title="Aviso: Mucho tiempo Desconectado"
                                                >
                                                    <FaBell />
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadInstaller(c.id, c.business_name)}
                                                    disabled={downloadingId !== null}
                                                    className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Generar Instalador Local Automático (.zip)"
                                                >
                                                    {downloadingId === c.id ? (
                                                        <FaSpinner className="animate-spin text-emerald-600" />
                                                     ) : (
                                                        <FaDownload />
                                                     )}
                                                </button>
                                                <button
                                                    onClick={() => handleStatusNotify(c.id, 'downgrade_to_local')}
                                                    className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center hover:bg-purple-100 transition"
                                                    title="Dar de baja NUBE -> Pasar a LOCAL"
                                                >
                                                    <FaArrowDown />
                                                </button>
                                                {!c.tenant_id && (
                                                    <button
                                                        onClick={() => handleMigrateV2(c.id, c.business_name)}
                                                        className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition"
                                                        title="Migrar cliente a Arquitectura V2 (Multitenant)"
                                                    >
                                                        <FaRocket />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleEditClick(c)}
                                                    className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition"
                                                    title="Editar Ficha Técnica"
                                                >
                                                    <FaEdit />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            )}

            {/* Edit Modal Minimalist */}
            {editingClient && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className={`bg-white rounded-2xl w-full ${modalTab === 'billing' ? 'max-w-5xl' : 'max-w-2xl'} max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up transition-all duration-300`}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <FaEdit className="text-blue-600" />
                                {editingClient.id ? 'Ficha Técnica y Financiera' : 'Crear Nuevo Cliente'}
                            </h2>
                            <button onClick={() => setEditingClient(null)} className="text-gray-400 hover:text-red-500"><FaTimesCircle className="w-6 h-6" /></button>
                        </div>

                        {/* Barra de progreso de perfil completo */}
                        {editingClient.id && (
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-gray-600">Auditoría del Perfil del Cliente</span>
                                    <span className={`text-xs font-bold ${formData.profile_completion >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
                                        {formData.profile_completion || 0}% Completado
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div 
                                        className={`h-2.5 rounded-full transition-all duration-500 ${formData.profile_completion >= 100 ? 'bg-green-600' : 'bg-amber-500'}`} 
                                        style={{ width: `${formData.profile_completion || 0}%` }}
                                    ></div>
                                </div>
                                {formData.profile_completion < 100 && (
                                    <p className="text-[10px] text-gray-500 mt-1.5 flex items-center gap-1">
                                        ⚠️ <b>Falta completar:</b> {(!formData.nit || !formData.legal_representative) && "Datos Legales / "} 
                                        {(!formData.billing_start_date) && "Fecha de inicio facturación / "}
                                        {(!formData.anydesk_id && formData.plan_type === 'local') && "Anydesk / "}
                                        {(!formData.cloud_url && formData.plan_type !== 'local') && "URL Nube / "}
                                        {paymentsHistory.length === 0 && "Registrar primer pago / "}
                                        ¡Déjalo al 100% antes de migrar!
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Pestañas del Modal */}
                        {editingClient.id && (
                            <div className="flex border-b border-gray-200 px-6 bg-white">
                                <button 
                                    onClick={() => setModalTab('general')}
                                    className={`py-3 px-4 text-sm font-medium border-b-2 transition-all ${modalTab === 'general' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Ficha Técnica (Datos)
                                </button>
                                <button 
                                    onClick={() => setModalTab('finance')}
                                    className={`py-3 px-4 text-sm font-medium border-b-2 transition-all ${modalTab === 'finance' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Historial Financiero 💰
                                </button>
                                <button 
                                    onClick={() => {
                                        setModalTab('billing');
                                        fetchBillingMonths(formData.id);
                                        if (formData.nit) fetchAdminInvoices(formData.nit);
                                    }}
                                    className={`py-3 px-4 text-sm font-medium border-b-2 transition-all ${modalTab === 'billing' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Suscripción y Cobros 📅
                                </button>
                            </div>
                        )}

                        {/* RUT Magic Uploader */}
                        {modalTab === 'general' && (
                            <div className="px-6 py-4 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-purple-800 flex items-center gap-1"><FaMagic /> Auto-completar con IA</h3>
                                    <p className="text-xs text-purple-600">Sube el PDF del RUT de tu cliente y ahorra tiempo digitando.</p>
                                </div>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleRutUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        id="rut_upload"
                                        disabled={isExtractingRut}
                                    />
                                    <label
                                        htmlFor="rut_upload"
                                        className={`px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-xs font-bold shadow-sm transition cursor-pointer ${isExtractingRut ? 'opacity-50 pointer-events-none' : ''}`}
                                    >
                                        {isExtractingRut ? <><FaSpinner className="animate-spin" /> Leyendo RUT...</> : <><FaCloudUploadAlt size={16} /> Subir Archivo RUT</>}
                                    </label>
                                </div>
                            </div>
                        )}

                        {modalTab === 'general' ? (
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50">

                            {/* Basics */}
                            <div className="md:col-span-2"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Datos Básicos</h3></div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Negocio / Razón Social <span className="text-red-500">*</span></label>
                                <input name="business_name" value={formData.business_name || ''} onChange={handleUpdateChange} className="w-full p-2 border border-gray-200 rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">NIT</label>
                                <input name="nit" value={formData.nit || ''} onChange={handleUpdateChange} className="w-full p-2 border border-gray-200 rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Rep. Legal / Titular</label>
                                <input name="legal_representative" value={formData.legal_representative || ''} onChange={handleUpdateChange} className="w-full p-2 border border-gray-200 rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">WhatsApp <span className="text-red-500">*</span></label>
                                <input name="whatsapp" value={formData.whatsapp || ''} onChange={handleUpdateChange} className="w-full p-2 border border-gray-200 rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                <input name="email" value={formData.email || ''} onChange={handleUpdateChange} className="w-full p-2 border border-gray-200 rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Ciudad</label>
                                <input name="city" value={formData.city || ''} onChange={handleUpdateChange} className="w-full p-2 border border-gray-200 rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Dirección</label>
                                <input name="address" value={formData.address || ''} onChange={handleUpdateChange} className="w-full p-2 border border-gray-200 rounded text-sm" />
                            </div>

                            {/* Plans */}
                            <div className="md:col-span-2 mt-4"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Facturación / Suscripción</h3></div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Plan</label>
                                <select name="plan_type" value={formData.plan_type || 'cloud'} onChange={handleUpdateChange} className="w-full p-2 border border-gray-200 rounded text-sm bg-white">
                                    <option value="cloud">☁️ Nube ($35.000)</option>
                                    <option value="cloud_fe">☁️ Nube + F.E. ($55.000)</option>
                                    <option value="local">🏠 Local (Gratis)</option>
                                    <option value="monocaja">Monocaja</option>
                                    <option value="multicaja">Multicaja</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Mensualidad Pactada ($)</label>
                                <input type="number" name="monthly_amount" value={formData.monthly_amount || 0} onChange={handleUpdateChange} className="w-full p-2 border border-gray-200 rounded text-sm" />
                            </div>
                            <div className="flex items-center">
                                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer mt-4">
                                    <input type="checkbox" name="has_electronic_billing" checked={formData.has_electronic_billing === true || formData.has_electronic_billing === 'true'} onChange={(e) => setFormData(prev => ({ ...prev, has_electronic_billing: e.target.checked }))} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                                    Facturación Electrónica Activa
                                </label>
                            </div>

                            {/* Tech */}
                            <div className="md:col-span-2 mt-4"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Parámetros Técnicos</h3></div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">AnyDesk ID</label>
                                <input name="anydesk_id" value={formData.anydesk_id || ''} onChange={handleUpdateChange} placeholder="123 456 789" className="w-full p-2 border border-gray-200 rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">URL Acceso Nube</label>
                                <input name="cloud_url" value={formData.cloud_url || ''} onChange={handleUpdateChange} placeholder="empresa.poslatino.com" className="w-full p-2 border border-gray-200 rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Servidor (Droplet)</label>
                                <input name="server_name" value={formData.server_name || ''} onChange={handleUpdateChange} placeholder="App1, Nodo4..." className="w-full p-2 border border-gray-200 rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Versión POS Instalada</label>
                                <input name="pos_version" value={formData.pos_version || ''} onChange={handleUpdateChange} placeholder="v1.0.8" className="w-full p-2 border border-gray-200 rounded text-sm" />
                            </div>

                            {/* Ownership */}
                            <div className="md:col-span-2 mt-4"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Asignación Directa</h3></div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Distribuidor / Propietario</label>
                                <select name="distributor_id" value={formData.distributor_id || ''} onChange={handleUpdateChange} className="w-full p-2 border border-gray-200 rounded text-sm bg-white">
                                    <option value="">Directo (Discovery)</option>
                                    {options.distributors.map(d => (
                                        <option key={d.id} value={d.id}>{d.name} ({d.city})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Técnico A Cargo</label>
                                <select name="technician_id" value={formData.technician_id || ''} onChange={handleUpdateChange} className="w-full p-2 border border-gray-200 rounded text-sm bg-white">
                                    <option value="">Sin técnico asignado</option>
                                    {options.advisors.map(a => (
                                        <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2 mt-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer p-2 border border-gray-200 rounded bg-white mt-2">
                                    <input type="checkbox" name="is_active" checked={formData.is_active === true || formData.is_active === 'true'} onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))} className="w-4 h-4 text-blue-600" />
                                    Cliente Activo y Operando (Mostrar en verde)
                                </label>
                            </div>
                        </div>
                        ) : modalTab === 'finance' ? (
                        /* FINANCIAL TAB CONTENT */
                        <div className="p-6 space-y-6 bg-gray-50/50">
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                                <h3 className="font-bold text-gray-800 text-sm border-b pb-2 flex items-center gap-2">⚙️ Configuración de Suscripción</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha de Inicio del Servicio</label>
                                        <input 
                                            type="date" 
                                            name="billing_start_date" 
                                            value={formData.billing_start_date ? formData.billing_start_date.split('T')[0] : ''} 
                                            onChange={handleUpdateChange} 
                                            className="w-full p-2 border border-gray-200 rounded text-sm bg-white focus:ring-2 focus:ring-blue-500" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Ciclo de Facturación</label>
                                        <select 
                                            name="billing_cycle" 
                                            value={formData.billing_cycle || 'monthly'} 
                                            onChange={handleUpdateChange} 
                                            className="w-full p-2 border border-gray-200 rounded text-sm bg-white focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="monthly">Mensual</option>
                                            <option value="semiannual">Semestral</option>
                                            <option value="annual">Anual</option>
                                        </select>
                                    </div>
                                    {formData.next_billing_date && (
                                        <div className="md:col-span-2">
                                            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700 flex justify-between items-center font-bold">
                                                <span>📅 Próxima fecha de facturación calculada:</span>
                                                <span className="font-mono text-sm">{formData.next_billing_date.split('T')[0]}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end">
                                    <button onClick={saveClient} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition">
                                        Guardar Parámetros de Suscripción
                                    </button>
                                </div>
                            </div>

                            {/* Registrar un nuevo pago manual */}
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                                <h3 className="font-bold text-gray-800 text-sm border-b pb-2 flex items-center gap-2">💰 Registrar Pago Manual Histórico</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Fecha del Pago</label>
                                        <input 
                                            type="date" 
                                            value={newPayment.payment_date} 
                                            onChange={(e) => setNewPayment(prev => ({ ...prev, payment_date: e.target.value }))}
                                            className="w-full p-2 border border-gray-200 rounded text-sm" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Monto Pagado ($)</label>
                                        <input 
                                            type="number" 
                                            placeholder="Monto"
                                            value={newPayment.amount} 
                                            onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                                            className="w-full p-2 border border-gray-200 rounded text-sm" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Meses que Cubre</label>
                                        <input 
                                            type="number" 
                                            min="1"
                                            value={newPayment.months_covered} 
                                            onChange={(e) => setNewPayment(prev => ({ ...prev, months_covered: parseInt(e.target.value) || 1 }))}
                                            className="w-full p-2 border border-gray-200 rounded text-sm" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Método de Pago</label>
                                        <select 
                                            value={newPayment.method} 
                                            onChange={(e) => setNewPayment(prev => ({ ...prev, method: e.target.value }))}
                                            className="w-full p-2 border border-gray-200 rounded text-sm bg-white"
                                        >
                                            <option value="transfer">Transferencia Bancaria</option>
                                            <option value="cash">Efectivo</option>
                                            <option value="nequi">Nequi</option>
                                            <option value="daviplata">Daviplata</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs text-gray-500 mb-1">Notas / Observaciones</label>
                                        <input 
                                            type="text" 
                                            placeholder="Ej: Pago adelantado del primer mes o semestre..."
                                            value={newPayment.notes} 
                                            onChange={(e) => setNewPayment(prev => ({ ...prev, notes: e.target.value }))}
                                            className="w-full p-2 border border-gray-200 rounded text-sm" 
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button 
                                        onClick={handleAddPayment}
                                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition"
                                    >
                                        + Agregar Pago Histórico
                                    </button>
                                </div>
                            </div>

                            {/* Listado de pagos históricos */}
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                                <h3 className="font-bold text-gray-800 text-sm border-b pb-2">📋 Historial de Pagos Registrados</h3>
                                <div className="overflow-x-auto max-h-60">
                                    <table className="w-full text-left text-xs whitespace-nowrap">
                                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                                            <tr>
                                                <th className="px-4 py-2">Fecha</th>
                                                <th className="px-4 py-2">Monto</th>
                                                <th className="px-4 py-2">Meses Cubiertos</th>
                                                <th className="px-4 py-2">Método</th>
                                                <th className="px-4 py-2">Notas</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {paymentsHistory.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="px-4 py-4 text-center text-gray-400">No hay pagos registrados para este cliente.</td>
                                                </tr>
                                            ) : (
                                                paymentsHistory.map((p) => (
                                                    <tr key={p.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2 font-mono">{p.payment_date.split('T')[0]}</td>
                                                        <td className="px-4 py-2 font-bold text-gray-800">${parseFloat(p.amount).toLocaleString('es-CO')}</td>
                                                        <td className="px-4 py-2 text-center font-bold text-blue-600">{p.months_covered}</td>
                                                        <td className="px-4 py-2 capitalize">{p.method}</td>
                                                        <td className="px-4 py-2 text-gray-500 truncate max-w-[200px]" title={p.notes}>{p.notes || '-'}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        ) : (
                        /* BILLING TAB CONTENT (NEW) */
                        <div className="p-6 space-y-6 bg-gray-50/50">
                            {/* Suscripción General */}
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h3 className="font-bold text-gray-800 text-sm">Suscripción POS Cloud</h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Monto pactado: <strong className="text-gray-900">${parseFloat(formData.monthly_amount || 0).toLocaleString('es-CO')}</strong> / mes
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Inicio: <strong className="text-gray-900">{formData.billing_start_date ? formData.billing_start_date.split('T')[0] : 'No definida'}</strong>
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => {
                                            axios.post('/billing/generate')
                                                .then(res => {
                                                    alert(res.data.message);
                                                    fetchBillingMonths(formData.id);
                                                })
                                                .catch(err => alert("Error: " + err.message));
                                        }}
                                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition"
                                    >
                                        🔄 Recargar Periodos
                                    </button>
                                    <select 
                                        value={billingYear} 
                                        onChange={(e) => setBillingYear(parseInt(e.target.value))}
                                        className="p-1.5 border border-gray-200 rounded-lg text-xs font-bold bg-white"
                                    >
                                        <option value="2025">Año 2025</option>
                                        <option value="2026">Año 2026</option>
                                        <option value="2027">Año 2027</option>
                                    </select>
                                </div>
                            </div>

                            {/* Calendario de meses */}
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                                <div className="flex justify-between items-center border-b pb-2">
                                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">📅 Calendario de Mensualidades ({billingYear})</h3>
                                    <div className="flex items-center gap-3 text-[10px] font-bold">
                                        <span className="flex items-center gap-1">🟢 Pagado</span>
                                        <span className="flex items-center gap-1">🟡 Pendiente</span>
                                        <span className="flex items-center gap-1">🔵 Cortesía</span>
                                        <span className="flex items-center gap-1">⚪ Futuro</span>
                                    </div>
                                </div>

                                {loadingBillingMonths ? (
                                    <div className="py-8 text-center text-gray-400 flex items-center justify-center gap-2">
                                        <FaSpinner className="animate-spin text-blue-500" /> Cargando calendario...
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((monthName, idx) => {
                                            const monthNum = idx + 1;
                                            const monthData = billingMonths.find(m => m.year === billingYear && m.month === monthNum);
                                            
                                            // Si no existe, es 'future' por defecto
                                            const status = monthData ? monthData.status : 'future';
                                            const amount = monthData ? monthData.amount : formData.monthly_amount;

                                            let cardClass = "border rounded-xl p-3 flex flex-col justify-between h-28 cursor-pointer transition hover:shadow-md hover:scale-[1.02] ";
                                            if (status === 'paid') cardClass += "bg-emerald-50/50 text-emerald-800 border-emerald-200 hover:bg-emerald-50";
                                            else if (status === 'pending') cardClass += "bg-amber-50/50 text-amber-800 border-amber-200 hover:bg-amber-50";
                                            else if (status === 'gifted') cardClass += "bg-sky-50/50 text-sky-800 border-sky-200 hover:bg-sky-50";
                                            else cardClass += "bg-gray-50/40 text-gray-400 border-gray-200 hover:bg-gray-50";

                                            return (
                                                <div 
                                                    key={monthNum} 
                                                    className={cardClass}
                                                    onClick={() => monthData && setEditingMonth({ ...monthData })}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <span className="font-bold text-xs uppercase tracking-wide text-gray-600">{monthName}</span>
                                                        <span className={`w-3.5 h-3.5 rounded-full border ${
                                                            status === 'paid' ? 'bg-green-500 border-green-600' :
                                                            status === 'pending' ? 'bg-amber-400 border-amber-500 animate-pulse' :
                                                            status === 'gifted' ? 'bg-sky-400 border-sky-500' : 'bg-gray-200 border-gray-300'
                                                        }`}></span>
                                                    </div>
                                                    
                                                    <div className="mt-2">
                                                        <div className="text-sm font-extrabold text-gray-800">${parseFloat(amount || 0).toLocaleString('es-CO')}</div>
                                                        {monthData && monthData.admin_invoice_num && (
                                                            <div className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5 mt-0.5" onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDownloadAdminInvoicePDF(monthData.admin_invoice_id);
                                                            }}>
                                                                📄 Factura #{monthData.admin_invoice_num} ⬇️
                                                            </div>
                                                        )}
                                                        {monthData && monthData.bold_link_url && status === 'pending' && (
                                                            <div className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5 mt-0.5">
                                                                💳 Link Bold activo
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Modal de edición de mes */}
                            {editingMonth && (
                                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
                                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
                                        <div className="flex justify-between items-center border-b pb-2">
                                            <h4 className="font-bold text-gray-800 text-sm">
                                                Cobro de {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][editingMonth.month - 1]} {editingMonth.year}
                                            </h4>
                                            <button onClick={() => setEditingMonth(null)} className="text-gray-400 hover:text-gray-600 font-bold">×</button>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Estado de Pago</label>
                                                <select 
                                                    value={editingMonth.status}
                                                    onChange={(e) => setEditingMonth(prev => ({ ...prev, status: e.target.value }))}
                                                    className="w-full p-2 border border-gray-200 rounded text-xs bg-white"
                                                >
                                                    <option value="pending">🟡 Pendiente (Debe)</option>
                                                    <option value="paid">🟢 Pagado</option>
                                                    <option value="gifted">🔵 Cortesía (Gratis)</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Monto Cobrado ($)</label>
                                                <input 
                                                    type="number"
                                                    value={editingMonth.amount || 0}
                                                    onChange={(e) => setEditingMonth(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                                                    className="w-full p-2 border border-gray-200 rounded text-xs"
                                                />
                                            </div>

                                            {editingMonth.status === 'paid' && (
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Método de Pago</label>
                                                    <select 
                                                        value={editingMonth.payment_method || 'transferencia'}
                                                        onChange={(e) => setEditingMonth(prev => ({ ...prev, payment_method: e.target.value }))}
                                                        className="w-full p-2 border border-gray-200 rounded text-xs bg-white"
                                                    >
                                                        <option value="transferencia">Transferencia</option>
                                                        <option value="efectivo">Efectivo</option>
                                                        <option value="nequi">Nequi</option>
                                                        <option value="bold">Pasarela Bold</option>
                                                    </select>
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Notas / Comentarios</label>
                                                <textarea 
                                                    value={editingMonth.notes || ''}
                                                    onChange={(e) => setEditingMonth(prev => ({ ...prev, notes: e.target.value }))}
                                                    placeholder="Ej: Mes de prueba o descuento especial..."
                                                    className="w-full p-2 border border-gray-200 rounded text-xs h-16 resize-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 pt-2">
                                            {/* Generar Link de Pago Bold */}
                                            {editingMonth.status === 'pending' && (
                                                editingMonth.bold_link_url ? (
                                                    <div className="w-full p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-bold text-amber-800 flex items-center gap-1">💳 Link de Pago Bold Activo</span>
                                                            <span className="text-[10px] px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full font-bold">Esperando pago</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <input 
                                                                type="text" 
                                                                readOnly 
                                                                value={editingMonth.bold_link_url} 
                                                                className="flex-1 p-1.5 bg-white border border-amber-200 rounded text-[10px] font-mono text-gray-600 truncate"
                                                            />
                                                            <button 
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(editingMonth.bold_link_url);
                                                                    alert('Link copiado al portapapeles ✅');
                                                                }}
                                                                className="px-3 py-1.5 bg-amber-500 text-white rounded text-[10px] font-bold hover:bg-amber-600 transition flex items-center gap-1"
                                                            >
                                                                <FaCopy size={10} /> Copiar
                                                            </button>
                                                            <a 
                                                                href={editingMonth.bold_link_url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="px-3 py-1.5 bg-blue-500 text-white rounded text-[10px] font-bold hover:bg-blue-600 transition flex items-center gap-1"
                                                            >
                                                                <FaExternalLinkAlt size={10} /> Abrir
                                                            </a>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={async () => {
                                                            setIsGeneratingBoldLink(true);
                                                            try {
                                                                const res = await axios.post(`/billing/months/${editingMonth.id}/generate-bold-link`);
                                                                if (res.data.success) {
                                                                    setEditingMonth(prev => ({ ...prev, bold_link_url: res.data.bold_link_url, bold_link_id: res.data.bold_link_id }));
                                                                    fetchBillingMonths(formData.id);
                                                                    alert('✅ Link de pago Bold generado exitosamente');
                                                                }
                                                            } catch (err) {
                                                                alert('Error generando link: ' + (err.response?.data?.error || err.message));
                                                            } finally {
                                                                setIsGeneratingBoldLink(false);
                                                            }
                                                        }}
                                                        disabled={isGeneratingBoldLink}
                                                        className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-bold hover:from-amber-600 hover:to-orange-600 transition shadow-md flex items-center justify-center gap-2"
                                                    >
                                                        {isGeneratingBoldLink ? <><FaSpinner className="animate-spin" /> Generando link...</> : '💳 Generar Link de Pago Bold'}
                                                    </button>
                                                )
                                            )}

                                            {/* Crear Factura Oficial en admin */}
                                            {editingMonth.status !== 'gifted' && !editingMonth.admin_invoice_id && (
                                                <button 
                                                    onClick={() => handleCreateAdminInvoice(editingMonth.id)}
                                                    disabled={isGeneratingInvoice}
                                                    className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition flex items-center justify-center gap-1"
                                                >
                                                    {isGeneratingInvoice ? <FaSpinner className="animate-spin" /> : "📄 Generar Factura en admin.poslatino.com"}
                                                </button>
                                            )}

                                            {/* Si ya existe factura en admin y el mes sigue pendiente, poder registrar pago y enviar a la DIAN */}
                                            {editingMonth.admin_invoice_id && editingMonth.status === 'pending' && (
                                                <button 
                                                    onClick={() => handleMarkAsPaidAndDian(editingMonth.id, editingMonth.payment_method)}
                                                    disabled={isMarkingPaid}
                                                    className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-bold hover:from-emerald-600 hover:to-green-700 transition shadow-md flex items-center justify-center gap-2"
                                                >
                                                    {isMarkingPaid ? <FaSpinner className="animate-spin" /> : "⚡ Confirmar Pago y Emitir DIAN"}
                                                </button>
                                            )}

                                            {/* Si ya existe factura pero queremos enviarla o re-enviarla a la DIAN directamente */}
                                            {editingMonth.admin_invoice_id && (
                                                <button 
                                                    onClick={() => handleEmitDian(editingMonth.id)}
                                                    disabled={isEmittingDian}
                                                    className="w-full py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold hover:bg-indigo-100 transition flex items-center justify-center gap-2"
                                                >
                                                    {isEmittingDian ? <FaSpinner className="animate-spin" /> : "📤 Enviar Factura a la DIAN"}
                                                </button>
                                            )}

                                            <div className="flex gap-2">
                                                <button onClick={() => setEditingMonth(null)} className="w-1/2 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 transition">
                                                    Cancelar
                                                </button>
                                                <button 
                                                    onClick={() => handleUpdateMonthStatus(editingMonth.id, {
                                                        status: editingMonth.status,
                                                        amount: editingMonth.amount,
                                                        payment_method: editingMonth.payment_method,
                                                        notes: editingMonth.notes
                                                    })}
                                                    disabled={updatingMonthStatus}
                                                    className="w-1/2 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition"
                                                >
                                                    {updatingMonthStatus ? "Guardando..." : "Guardar"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Facturas reales desde admin.poslatino.com */}
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                                <h3 className="font-bold text-gray-800 text-sm border-b pb-2 flex items-center gap-2">
                                    📂 Facturas en admin.poslatino.com (En tiempo real por NIT)
                                </h3>

                                {loadingAdminInvoices ? (
                                    <div className="py-8 text-center text-gray-400 flex items-center justify-center gap-2">
                                        <FaSpinner className="animate-spin text-blue-500" /> Consultando Nube...
                                    </div>
                                ) : adminInvoices.length === 0 ? (
                                    <div className="p-4 bg-gray-50 rounded-xl text-center text-xs text-gray-400 font-semibold">
                                        No se encontraron facturas asociadas a este NIT en el sistema de admin.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto max-h-60">
                                        <table className="w-full text-left text-xs whitespace-nowrap">
                                            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                                                <tr>
                                                    <th className="px-4 py-2">Factura</th>
                                                    <th className="px-4 py-2">Fecha</th>
                                                    <th className="px-4 py-2">Monto</th>
                                                    <th className="px-4 py-2">Tipo</th>
                                                    <th className="px-4 py-2">Nota</th>
                                                    <th className="px-4 py-2 text-right">PDF</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {adminInvoices.map((fac) => (
                                                    <tr key={fac.id} className="hover:bg-gray-50/50">
                                                        <td className="px-4 py-3 font-bold text-gray-900">
                                                            {fac.es_electronica ? "⚡ " : ""}#{fac.numero}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-500 font-mono">
                                                            {new Date(fac.fecha).toLocaleDateString('es-CO')}
                                                        </td>
                                                        <td className="px-4 py-3 font-bold text-gray-800">
                                                            ${parseFloat(fac.monto || 0).toLocaleString('es-CO')}
                                                        </td>
                                                        <td className="px-4 py-3 capitalize text-gray-600">
                                                            {fac.tipo_pago} {fac.es_credito ? '(Crédito)' : ''}
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]" title={fac.nota}>
                                                            {fac.nota || '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button 
                                                                onClick={() => handleDownloadAdminInvoicePDF(fac.id)}
                                                                className="px-2 py-1 bg-blue-50 border border-blue-200 text-blue-600 rounded hover:bg-blue-100 font-bold transition flex items-center gap-1 inline-flex text-[10px]"
                                                            >
                                                                ⬇️ Descargar PDF
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                        )}

                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                            <button onClick={() => setEditingClient(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition">
                                Cancelar
                            </button>
                            <button onClick={saveClient} className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium shadow-md transition">
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isWizardOpen && (
                <ClientWizard
                    isOpen={isWizardOpen}
                    onClose={() => setIsWizardOpen(false)}
                    distributors={options.distributors || []}
                    advisors={options.advisors || []}
                    onSave={handleWizardSave}
                />
            )}
        </div>
    );
};

export default CRMClients;
