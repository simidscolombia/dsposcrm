import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaBuilding, FaSearch, FaEdit, FaTrash, FaPlus,
    FaPercentage, FaUsers, FaCheckCircle, FaTimesCircle, FaWhatsapp
} from 'react-icons/fa';

const API_URL = '';

const CRMDistributors = () => {
    const [distributors, setDistributors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        fetchDistributors();
        // eslint-disable-next-line
    }, []);

    const fetchDistributors = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);

            const res = await axios.get(`${API_URL}/distributors?${params.toString()}`);
            if (res.data.success) {
                setDistributors(res.data.distributors);
            }
        } catch (error) {
            console.error('Error fetching distributors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchDistributors();
    };

    const openModal = (dist = null) => {
        if (dist) {
            setFormData(dist);
        } else {
            setFormData({ name: '', contact_name: '', whatsapp: '', city: '', commission_rate: 0, is_active: true });
        }
        setShowModal(true);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (formData.id) {
                // Update
                const res = await axios.put(`${API_URL}/distributors/${formData.id}`, formData);
                if (res.data.success) {
                    alert('Distribuidor actualizado');
                }
            } else {
                // Create
                const res = await axios.post(`${API_URL}/distributors`, formData);
                if (res.data.success) {
                    alert('Distribuidor creado');
                }
            }
            setShowModal(false);
            fetchDistributors();
        } catch (error) {
            console.error('Error saving:', error);
            alert(error.response?.data?.error || 'Error al guardar distribuidor');
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`¿Estás seguro de que deseas ELIMINAR al distribuidor ${name}?`)) return;

        try {
            const res = await axios.delete(`${API_URL}/distributors/${id}`);
            if (res.data.success) {
                alert('Eliminado exitosamente');
                fetchDistributors();
            }
        } catch (error) {
            alert(error.response?.data?.error || 'Error al eliminar');
        }
    };

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FaBuilding className="text-blue-600" />
                        Red de Distribuidores
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Control de aliados comerciales y sus comisiones
                    </p>
                </div>

                <button
                    onClick={() => openModal()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 font-medium"
                >
                    <FaPlus /> Añadir Distribuidor
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 md:p-5 border-b border-gray-100 bg-gray-50/50">
                    <form onSubmit={handleSearch} className="relative w-full md:w-96">
                        <FaSearch className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Buscar distribuidor, ciudad o contacto..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                    </form>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white text-gray-500 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-medium">Distribuidor</th>
                                <th className="px-6 py-4 font-medium">Ubicación</th>
                                <th className="px-6 py-4 font-medium">Métricas SaaS</th>
                                <th className="px-6 py-4 font-medium">Comisión</th>
                                <th className="px-6 py-4 font-medium text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Cargando aliados...</td></tr>
                            ) : distributors.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No se encontraron aliados comerciales.</td></tr>
                            ) : (
                                distributors.map((d) => (
                                    <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {d.is_active ? <FaCheckCircle className="text-green-500" title="Activo" /> : <FaTimesCircle className="text-red-500" title="Inactivo" />}
                                                <div>
                                                    <div className="font-bold text-gray-900">{d.name}</div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                        <FaWhatsapp className="text-green-500" /> {d.whatsapp || 'Sin WhatsApp'}
                                                        {d.contact_name ? ` • ${d.contact_name}` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {d.city || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-1 font-semibold text-gray-800">
                                                    <FaUsers className="text-blue-500 text-xs" /> {d.total_clients} clientes ({d.active_clients} activos)
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Generando: {formatMoney(d.total_managed_monthly)} / mes
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-bold flex items-center gap-1 w-max">
                                                {d.commission_rate}% <FaPercentage className="text-xs" />
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openModal(d)}
                                                    className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600"
                                                    title="Editar Aliado"
                                                >
                                                    <FaEdit />
                                                </button>
                                                {parseInt(d.total_clients) === 0 && (
                                                    <button
                                                        onClick={() => handleDelete(d.id, d.name)}
                                                        className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100"
                                                        title="Eliminar (No tiene clientes)"
                                                    >
                                                        <FaTrash />
                                                    </button>
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in-up">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <FaBuilding className="text-blue-600" />
                                {formData.id ? 'Editar Distribuidor' : 'Nuevo Distribuidor'}
                            </h2>
                            <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500">
                                <FaTimesCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial de la Alianza</label>
                                <input required type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" placeholder="Ej: Soluciones POS Bogotá" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Contacto</label>
                                    <input type="text" name="contact_name" value={formData.contact_name || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" placeholder="Agente principal" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                                    <input type="text" name="whatsapp" value={formData.whatsapp || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" placeholder="Ej: 3001234567" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cdad. Principal</label>
                                    <input type="text" name="city" value={formData.city || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded" placeholder="Zona de acción" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">% Comisión Prometida</label>
                                    <input type="number" step="0.1" name="commission_rate" value={formData.commission_rate || 0} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded text-blue-600 font-bold" />
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                    <input type="checkbox" name="is_active" checked={formData.is_active === true || formData.is_active === 'true'} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded" />
                                    Distribuidor Activo (Puede vender y comisionar)
                                </label>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl bg-gray-50">
                            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow">Guardar Aliado</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default CRMDistributors;
