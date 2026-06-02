import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserPlus, FaEdit, FaTrash, FaLock, FaUserShield, FaTimes, FaSave, FaUser } from 'react-icons/fa';

const API_URL = '/api';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: '',
        role: 'admin',
        is_active: true
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/users`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
            });
            if (res.data.success) {
                setUsers(res.data.users);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name,
                username: user.username,
                password: '', // blank unless changing
                role: user.role,
                is_active: user.is_active
            });
        } else {
            setEditingUser(null);
            setFormData({
                name: '',
                username: '',
                password: '',
                role: 'admin',
                is_active: true
            });
        }
        setModalOpen(true);
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
        setSaving(true);
        try {
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } };
            if (editingUser) {
                // Update
                const payload = { ...formData };
                if (!payload.password) delete payload.password; // Don't send empty password if not changing
                
                await axios.put(`${API_URL}/users/${editingUser.id}`, payload, config);
                alert('Usuario actualizado con éxito');
            } else {
                // Create
                if (!formData.password) {
                    alert('La contraseña es obligatoria para nuevos usuarios');
                    setSaving(false);
                    return;
                }
                await axios.post(`${API_URL}/users`, formData, config);
                alert('Usuario creado con éxito');
            }
            setModalOpen(false);
            fetchUsers();
        } catch (error) {
            alert('Error: ' + (error.response?.data?.error || error.message));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, username) => {
        if (username === 'admin') {
            alert('No puedes eliminar al administrador principal.');
            return;
        }
        if (window.confirm('¿Estás seguro de desactivar este usuario?')) {
            try {
                await axios.delete(`${API_URL}/users/${id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
                });
                fetchUsers();
            } catch (error) {
                alert('Error al eliminar: ' + error.message);
            }
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FaUserShield className="text-blue-600" />
                        Gestión de Usuarios
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Administra accesos y contraseñas del CRM.</p>
                </div>
                <button 
                    onClick={() => openModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <FaUserPlus /> Nuevo Usuario
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                                    <th className="px-6 py-4 font-bold">Usuario</th>
                                    <th className="px-6 py-4 font-bold">Nombre</th>
                                    <th className="px-6 py-4 font-bold">Rol</th>
                                    <th className="px-6 py-4 font-bold">Estado</th>
                                    <th className="px-6 py-4 font-bold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 font-medium text-gray-800">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                    <FaUser className="w-4 h-4" />
                                                </div>
                                                {user.username}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{user.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.is_active ? (
                                                <span className="text-green-600 font-medium text-sm flex items-center gap-1">🟢 Activo</span>
                                            ) : (
                                                <span className="text-red-500 font-medium text-sm flex items-center gap-1">🔴 Inactivo</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => openModal(user)}
                                                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                                                    title="Editar / Cambiar Clave"
                                                >
                                                    <FaEdit />
                                                </button>
                                                {user.username !== 'admin' && (
                                                    <button 
                                                        onClick={() => handleDelete(user.id, user.username)}
                                                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                                                        title="Desactivar"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal de Usuario */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-lg font-bold text-gray-800">
                                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </h2>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-red-500 transition">
                                <FaTimes className="text-xl" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    value={formData.name} 
                                    onChange={handleChange} 
                                    required
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario (Login)</label>
                                <input 
                                    type="text" 
                                    name="username" 
                                    value={formData.username} 
                                    onChange={handleChange} 
                                    required
                                    readOnly={editingUser?.username === 'admin'}
                                    className={`w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${editingUser?.username === 'admin' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                                    <FaLock className="text-gray-400" /> Contraseña
                                </label>
                                <input 
                                    type="password" 
                                    name="password" 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    placeholder={editingUser ? "Dejar en blanco para mantener la actual" : "Requerida"}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                    <select 
                                        name="role" 
                                        value={formData.role} 
                                        onChange={handleChange}
                                        disabled={editingUser?.username === 'admin'}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="admin">Administrador</option>
                                        <option value="sales">Ventas / Asesor</option>
                                        <option value="support">Soporte</option>
                                    </select>
                                </div>
                                <div className="flex items-center pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            name="is_active" 
                                            checked={formData.is_active} 
                                            onChange={handleChange}
                                            disabled={editingUser?.username === 'admin'}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Usuario Activo</span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition disabled:opacity-70"
                                >
                                    <FaSave /> {saving ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
