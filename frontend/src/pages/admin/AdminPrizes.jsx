
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaGift, FaPercent } from 'react-icons/fa';

const AdminPrizes = () => {
    const [prizes, setPrizes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '', description: '', probability: 0, type: 'discount', value: '', icon: '🎁', is_active: true
    });
    const [editMode, setEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);

    const API_URL = '/api'; // Sticking to relative path which works with Vercel rewrites

    const fetchPrizes = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/prizes`);
            if (res.data.success) {
                setPrizes(res.data.prizes);
            }
        } catch (error) {
            console.error('Error fetching prizes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrizes();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                probability: parseInt(formData.probability)
            };

            if (editMode) {
                await axios.put(`${API_URL}/prizes/${currentId}`, payload);
            } else {
                await axios.post(`${API_URL}/prizes`, payload);
            }
            setShowModal(false);
            fetchPrizes();
            resetForm();
        } catch (error) {
            console.error('Error saving prize:', error);
            alert('Error al guardar: ' + (error.response?.data?.error || 'Desconocido'));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Seguro que deseas eliminar este premio?')) return;
        try {
            await axios.delete(`${API_URL}/prizes/${id}`);
            fetchPrizes();
        } catch (error) {
            console.error('Error deleting prize:', error);
        }
    };

    const handleEdit = (prize) => {
        setFormData({
            name: prize.name,
            description: prize.description || '',
            probability: prize.probability || 0,
            type: prize.type || 'discount',
            value: prize.value || '',
            icon: prize.icon || '🎁',
            is_active: prize.is_active !== undefined ? prize.is_active : true
        });
        setCurrentId(prize.id);
        setEditMode(true);
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', probability: 0, type: 'discount', value: '', icon: '🎁', is_active: true });
        setEditMode(false);
        setCurrentId(null);
    };

    // Calculate total probability to show warning if != 100%
    const totalProbability = prizes.reduce((sum, p) => sum + (p.is_active ? p.probability : 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                    <FaGift className="text-purple-600" /> Premios (Ruleta)
                </h1>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg transition-all"
                >
                    <FaPlus /> Nuevo Premio
                </button>
            </div>

            {/* Probability Status */}
            <div className={`p-4 rounded-lg border ${totalProbability === 100 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                <div className="flex items-center gap-2 font-bold">
                    <FaPercent /> Probabilidad Total: {totalProbability}%
                </div>
                {totalProbability !== 100 && (
                    <p className="text-sm mt-1">
                        ⚠️ La suma de probabilidades debería ser 100% para un funcionamiento óptimo de la ruleta.
                    </p>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center p-12 text-gray-400">
                    <FaSpinner className="animate-spin text-4xl" />
                </div>
            ) : prizes.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-400">
                    No hay premios configurados. ¡Crea el primero!
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Icono</th>
                                <th className="px-6 py-4">Nombre</th>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4">Valor</th>
                                <th className="px-6 py-4">Probabilidad</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {prizes.map((prize) => (
                                <tr key={prize.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-2xl">{prize.icon}</td>
                                    <td className="px-6 py-4 font-medium text-gray-800">
                                        {prize.name}
                                        <div className="text-xs text-gray-400 font-normal">{prize.description}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 uppercase font-bold">
                                            {prize.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-sm">{prize.value}</td>
                                    <td className="px-6 py-4 font-bold text-gray-700">{prize.probability}%</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${prize.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {prize.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => handleEdit(prize)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                                            <FaEdit />
                                        </button>
                                        <button onClick={() => handleDelete(prize.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-pop-in">
                        <h2 className="text-xl font-bold mb-4">
                            {editMode ? 'Editar Premio' : 'Nuevo Premio'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Probabilidad (%)</label>
                                    <input
                                        type="number"
                                        value={formData.probability}
                                        onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none"
                                        min="0"
                                        max="100"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Icono / Emoji</label>
                                    <input
                                        type="text"
                                        value={formData.icon}
                                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none"
                                    >
                                        <option value="discount">Descuento</option>
                                        <option value="free_month">Mes Gratis</option>
                                        <option value="hardware">Hardware</option>
                                        <option value="ebook">Ebook / Info</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor (ej: 10%)</label>
                                    <input
                                        type="text"
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none min-h-[60px]"
                                />
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    type="checkbox"
                                    id="prize_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                />
                                <label htmlFor="prize_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    Premio Activo (Aparece en la ruleta)
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
                                >
                                    {editMode ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPrizes;
