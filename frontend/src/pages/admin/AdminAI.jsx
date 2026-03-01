import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaRobot, FaBrain, FaSave, FaPlus, FaTrash, FaLightbulb } from 'react-icons/fa';

const API_BASE = import.meta.env.VITE_API_URL || 'https://dspos.vercel.app/api';

const AdminAI = () => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingRule, setEditingRule] = useState(null);

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            const res = await axios.get(`${API_BASE}/admin/ai-rules`);
            setRules(res.data.rules || []);
        } catch (err) {
            console.error('Error fetching AI rules', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (rule) => {
        try {
            if (rule.id) {
                await axios.put(`${API_BASE}/admin/ai-rules/${rule.id}`, rule);
            } else {
                await axios.post(`${API_BASE}/admin/ai-rules`, rule);
            }
            fetchRules();
            setEditingRule(null);
        } catch (err) {
            alert('Error al guardar la regla');
        }
    };

    return (
        <div className="p-6 space-y-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg">
                        <FaBrain />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Centro de Inteligencia</h1>
                        <p className="text-gray-500 text-sm">Entrena al asistente de Discovery Systems con tu experiencia.</p>
                    </div>
                </div>
                <button
                    onClick={() => setEditingRule({ niche: '', key_question: '', expert_tips: [], suggested_hardware: [] })}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md"
                >
                    <FaPlus /> Nueva Regla
                </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Active Knowledge Base */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                        <FaLightbulb className="text-yellow-500" /> Base de Conocimiento Activa
                    </h2>
                    {loading ? <p>Cargando neuronas...</p> : (
                        rules.map(rule => (
                            <div key={rule.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-black text-blue-900 uppercase tracking-tighter">{rule.niche}</h3>
                                    <button onClick={() => setEditingRule(rule)} className="text-xs font-bold text-blue-600 hover:underline">EDITAR</button>
                                </div>
                                <div className="space-y-3">
                                    <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                        <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Pregunta Clave</p>
                                        <p className="text-gray-700 italic">"{rule.key_question}"</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Tips de Experto</p>
                                        <ul className="text-sm text-gray-600 list-disc list-inside">
                                            {Array.isArray(rule.expert_tips) && rule.expert_tips.map((tip, i) => (
                                                <li key={i}>{tip}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Training Console */}
                <div className="bg-[#1c242e] text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl">
                        <FaRobot />
                    </div>
                    <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                        <FaRobot className="text-[#A8E0F0]" /> Consola de Entrenamiento
                    </h2>

                    {editingRule ? (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Nicho de Negocio</label>
                                <input
                                    type="text"
                                    value={editingRule.niche}
                                    onChange={(e) => setEditingRule({ ...editingRule, niche: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 mt-1 focus:border-[#A8E0F0] outline-none transition-all"
                                    placeholder="Ej: Veterinaria"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Pregunta del Asistente</label>
                                <textarea
                                    value={editingRule.key_question}
                                    onChange={(e) => setEditingRule({ ...editingRule, key_question: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 mt-1 focus:border-[#A8E0F0] outline-none h-24"
                                    placeholder="¿Vendes productos pesados?"
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => handleSave(editingRule)}
                                    className="flex-1 bg-[#A8E0F0] text-[#1c242e] py-3 rounded-xl font-black uppercase text-sm"
                                >
                                    Guardar Conocimiento
                                </button>
                                <button
                                    onClick={() => setEditingRule(null)}
                                    className="px-6 py-3 bg-white/10 rounded-xl font-bold text-sm"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-center space-y-4 text-gray-400 border-2 border-dashed border-white/10 rounded-2xl">
                            <FaBrain className="text-4xl opacity-20" />
                            <p className="max-w-xs">Selecciona o crea una regla para entrenar a tu asistente personal de Discovery.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminAI;
