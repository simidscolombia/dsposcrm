
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaGift, FaPercent, FaTimes, FaToggleOn, FaToggleOff, FaExclamationTriangle } from 'react-icons/fa';

const EMOJI_OPTIONS = ['🎁', '🎉', '🏷️', '💰', '🔥', '⭐', '💎', '🎯', '🎊', '🎈', '🏆', '👑', '💸', '🤑', '📦', '🎶', '🛒', '💻', '🖨️', '📱', '🔓', '🆓', '📚', '📖'];

const TYPE_LABELS = {
    discount: { label: 'Descuento %', color: 'bg-green-100 text-green-700', icon: '🏷️' },
    free_month: { label: 'Mes Gratis', color: 'bg-blue-100 text-blue-700', icon: '🆓' },
    hardware: { label: 'Hardware', color: 'bg-purple-100 text-purple-700', icon: '📦' },
    ebook: { label: 'Ebook / Info', color: 'bg-orange-100 text-orange-700', icon: '📚' },
    bonus: { label: 'Bono', color: 'bg-amber-100 text-amber-700', icon: '💰' },
    cashback: { label: 'Cashback', color: 'bg-emerald-100 text-emerald-700', icon: '💸' },
    none: { label: 'Sin premio', color: 'bg-gray-100 text-gray-500', icon: '😢' }
};

const PRODUCT_CATEGORIES = [
    { id: 'all', label: 'Todas las categorías', icon: '🌐' },
    { id: 'Combos', label: 'Combos', icon: '📦' },
    { id: 'Hardware', label: 'Hardware', icon: '🖥️' },
    { id: 'Software', label: 'Software', icon: '💻' },
    { id: 'Seguridad', label: 'Seguridad', icon: '📹' },
    { id: 'Servicios', label: 'Servicios', icon: '🛠️' }
];

const AdminPrizes = () => {
    const [prizes, setPrizes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '', description: '', probability: 10, type: 'discount', value: '', icon: '🎁', is_active: true, applicable_categories: 'all'
    });
    const [editMode, setEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);

    const API_URL = '/api';

    const fetchPrizes = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/prizes`);
            if (res.data.success) {
                setPrizes(res.data.prizes || []);
            }
        } catch (error) {
            console.error('Error fetching prizes:', error);
            alert('Error al cargar premios: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPrizes(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                probability: parseInt(formData.probability) || 0,
                type: formData.type,
                value: formData.value,
                icon: formData.icon || '🎁',
                is_active: formData.is_active
            };

            if (editMode) {
                const res = await axios.put(`${API_URL}/prizes/${currentId}`, payload);
                if (res.data.success) {
                    alert('✅ Premio actualizado');
                }
            } else {
                const res = await axios.post(`${API_URL}/prizes`, payload);
                if (res.data.success) {
                    alert('✅ Premio creado');
                }
            }
            setShowModal(false);
            resetForm();
            fetchPrizes();
        } catch (error) {
            console.error('Error saving prize:', error);
            alert('❌ Error al guardar: ' + (error.response?.data?.error || error.message));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`¿Eliminar el premio "${name}"? Esta acción no se puede deshacer.`)) return;
        setDeleting(id);
        try {
            const res = await axios.delete(`${API_URL}/prizes/${id}`);
            if (res.data.success) {
                alert('✅ Premio eliminado');
                fetchPrizes();
            } else {
                alert('❌ Error: ' + (res.data.error || 'No se pudo eliminar'));
            }
        } catch (error) {
            console.error('Error deleting prize:', error);
            alert('❌ Error al eliminar: ' + (error.response?.data?.error || error.message));
        } finally {
            setDeleting(null);
        }
    };

    const toggleActive = async (prize) => {
        try {
            await axios.put(`${API_URL}/prizes/${prize.id}`, {
                ...prize,
                is_active: !prize.is_active
            });
            fetchPrizes();
        } catch (error) {
            alert('Error al cambiar estado');
        }
    };

    const handleEdit = (prize) => {
        setFormData({
            name: prize.name || '',
            description: prize.description || '',
            probability: prize.probability || 0,
            type: prize.type || 'discount',
            value: prize.value || '',
            icon: prize.icon || '🎁',
            is_active: prize.is_active !== undefined ? prize.is_active : true,
            applicable_categories: prize.applicable_categories || 'all'
        });
        setCurrentId(prize.id);
        setEditMode(true);
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', probability: 10, type: 'discount', value: '', icon: '🎁', is_active: true, applicable_categories: 'all' });
        setEditMode(false);
        setCurrentId(null);
    };

    const totalProbability = prizes.reduce((sum, p) => sum + (p.is_active ? (parseInt(p.probability) || 0) : 0), 0);
    const activeCount = prizes.filter(p => p.is_active).length;

    return (
        <div className="p-4 md:p-8 max-w-[1200px] mx-auto animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FaGift className="w-6 h-6 text-purple-600" /> Premios de la Ruleta
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Configura los premios, descuentos y bonos que aparecen en la ruleta para los clientes
                    </p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-purple-200 transition-all text-sm"
                >
                    <FaPlus className="w-3 h-3" /> Nuevo Premio
                </button>
            </div>

            {/* Probability Status Bar */}
            <div className={`p-4 rounded-2xl border mb-6 ${totalProbability === 100 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-bold text-sm">
                        <FaPercent className={totalProbability === 100 ? 'text-green-600' : 'text-yellow-600'} />
                        <span className={totalProbability === 100 ? 'text-green-700' : 'text-yellow-700'}>
                            Probabilidad Total: {totalProbability}%
                        </span>
                    </div>
                    <span className="text-xs text-gray-500">{activeCount} premios activos</span>
                </div>
                {/* Visual bar */}
                <div className="w-full bg-white rounded-full h-3 overflow-hidden border border-gray-200">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${totalProbability === 100 ? 'bg-green-500' : totalProbability > 100 ? 'bg-red-500' : 'bg-yellow-500'}`}
                        style={{ width: `${Math.min(totalProbability, 100)}%` }}
                    />
                </div>
                {totalProbability !== 100 && (
                    <p className="text-xs mt-2 flex items-center gap-1 text-yellow-700">
                        <FaExclamationTriangle className="w-3 h-3" />
                        {totalProbability < 100
                            ? `Faltan ${100 - totalProbability}% para llegar al 100%.`
                            : `Excede en ${totalProbability - 100}%. Reduce probabilidades.`}
                    </p>
                )}
            </div>

            {/* Prizes Grid */}
            {loading ? (
                <div className="flex justify-center p-12 text-gray-400">
                    <FaSpinner className="animate-spin text-4xl" />
                </div>
            ) : prizes.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-2xl shadow-sm border border-gray-100 text-gray-400">
                    <FaGift className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No hay premios configurados</p>
                    <p className="text-sm">Crea el primer premio para la ruleta</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {prizes.map((prize) => {
                        const typeInfo = TYPE_LABELS[prize.type] || TYPE_LABELS.discount;
                        return (
                            <div
                                key={prize.id}
                                className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all hover:shadow-md ${prize.is_active ? 'border-gray-100' : 'border-gray-200 opacity-60'}`}
                            >
                                {/* Card Header with icon */}
                                <div className={`p-4 flex items-center gap-3 ${prize.is_active ? 'bg-gradient-to-r from-purple-50 to-indigo-50' : 'bg-gray-50'}`}>
                                    <span className="text-4xl">{prize.icon || '🎁'}</span>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-800 truncate">{prize.name}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${typeInfo.color}`}>
                                            {typeInfo.label}
                                        </span>
                                    </div>
                                    {/* Toggle active */}
                                    <button
                                        onClick={() => toggleActive(prize)}
                                        className="text-2xl transition-colors"
                                        title={prize.is_active ? 'Desactivar' : 'Activar'}
                                    >
                                        {prize.is_active
                                            ? <FaToggleOn className="text-green-500 hover:text-green-600" />
                                            : <FaToggleOff className="text-gray-300 hover:text-gray-400" />
                                        }
                                    </button>
                                </div>

                                {/* Card Body */}
                                <div className="p-4">
                                    {/* Category badges */}
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {(!prize.applicable_categories || prize.applicable_categories === 'all') ? (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">🌐 Todas</span>
                                        ) : prize.applicable_categories.split(',').map(cat => (
                                            <span key={cat} className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded font-medium">
                                                {PRODUCT_CATEGORIES.find(c => c.id === cat.trim())?.icon} {cat.trim()}
                                            </span>
                                        ))}
                                    </div>
                                    {prize.description && (
                                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{prize.description}</p>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-3">
                                            <div className="text-center">
                                                <p className="text-xs text-gray-400">Valor</p>
                                                <p className="font-bold text-gray-800">{prize.value || '—'}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-gray-400">Probabilidad</p>
                                                <p className="font-bold text-purple-600">{prize.probability}%</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleEdit(prize)}
                                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(prize.id, prize.name)}
                                                disabled={deleting === prize.id}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                title="Eliminar"
                                            >
                                                {deleting === prize.id ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ==================== MODAL: Crear/Editar Premio ==================== */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <FaGift /> {editMode ? 'Editar Premio' : 'Nuevo Premio'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-white/70 hover:text-white">
                                <FaTimes className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Emoji Picker */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-2">Ícono del Premio</label>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-5xl w-16 h-16 flex items-center justify-center bg-purple-50 rounded-xl border-2 border-purple-200">
                                        {formData.icon}
                                    </span>
                                    <div className="flex-1">
                                        <div className="flex flex-wrap gap-1.5">
                                            {EMOJI_OPTIONS.map((emoji) => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    onClick={() => setFormData(p => ({ ...p, icon: emoji }))}
                                                    className={`w-9 h-9 text-lg rounded-lg transition-all flex items-center justify-center ${formData.icon === emoji
                                                        ? 'bg-purple-100 border-2 border-purple-500 scale-110'
                                                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            value={formData.icon}
                                            onChange={(e) => setFormData(p => ({ ...p, icon: e.target.value }))}
                                            className="mt-2 w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm"
                                            placeholder="O escribe tu propio emoji..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre del Premio *</label>
                                <input
                                    type="text" required
                                    value={formData.name}
                                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                    placeholder="Ej: Descuento 10%, Mes Gratis, Bono $50.000"
                                />
                            </div>

                            {/* Type + Value */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData(p => ({ ...p, type: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                    >
                                        {Object.entries(TYPE_LABELS).map(([key, val]) => (
                                            <option key={key} value={key}>{val.icon} {val.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Valor (lo que recibe el cliente)</label>
                                    <input
                                        type="text"
                                        value={formData.value}
                                        onChange={(e) => setFormData(p => ({ ...p, value: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                        placeholder="Ej: 10%, $50.000, 1 mes"
                                    />
                                </div>
                            </div>

                            {/* Probability */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Probabilidad: <span className="font-bold text-purple-600">{formData.probability}%</span>
                                </label>
                                <input
                                    type="range"
                                    min="0" max="100" step="5"
                                    value={formData.probability}
                                    onChange={(e) => setFormData(p => ({ ...p, probability: parseInt(e.target.value) }))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                />
                                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                    <span>0% (Nunca)</span>
                                    <span>50% (Mitad)</span>
                                    <span>100% (Siempre)</span>
                                </div>
                            </div>

                            {/* Applicable Categories */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-2">Aplica para categorías de producto</label>
                                <div className="flex flex-wrap gap-2">
                                    {PRODUCT_CATEGORIES.map(cat => {
                                        const selected = formData.applicable_categories === 'all'
                                            ? cat.id === 'all'
                                            : formData.applicable_categories?.split(',').includes(cat.id);
                                        return (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => {
                                                    if (cat.id === 'all') {
                                                        setFormData(p => ({ ...p, applicable_categories: 'all' }));
                                                    } else {
                                                        let current = formData.applicable_categories === 'all' ? [] : (formData.applicable_categories?.split(',').filter(Boolean) || []);
                                                        if (current.includes(cat.id)) {
                                                            current = current.filter(c => c !== cat.id);
                                                        } else {
                                                            current.push(cat.id);
                                                        }
                                                        setFormData(p => ({ ...p, applicable_categories: current.length === 0 ? 'all' : current.join(',') }));
                                                    }
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${selected
                                                        ? 'bg-purple-100 border-purple-400 text-purple-700 ring-1 ring-purple-300'
                                                        : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {cat.icon} {cat.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">Selecciona en qué categorías de producto aplica este premio. "Todas" = aplica siempre.</p>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Descripción (lo que ve el cliente)</label>
                                <textarea
                                    rows={2}
                                    value={formData.description}
                                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 outline-none text-sm resize-none"
                                    placeholder="Ej: ¡Obtén un 10% de descuento en tu compra!"
                                />
                            </div>

                            {/* Active toggle */}
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, is_active: !p.is_active }))}
                                    className="text-3xl"
                                >
                                    {formData.is_active
                                        ? <FaToggleOn className="text-green-500" />
                                        : <FaToggleOff className="text-gray-300" />
                                    }
                                </button>
                                <div>
                                    <p className="text-sm font-medium text-gray-700">
                                        {formData.is_active ? 'Activo — Aparece en la ruleta' : 'Inactivo — No aparece en la ruleta'}
                                    </p>
                                    <p className="text-xs text-gray-400">Puedes desactiva sin eliminar</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg text-sm">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={saving}
                                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-lg text-sm disabled:opacity-50 transition-all">
                                    {saving ? 'Guardando...' : editMode ? 'Actualizar' : 'Crear Premio'}
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
