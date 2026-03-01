import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaRobot, FaBrain, FaSave, FaPlus, FaTrash, FaLightbulb, FaImage, FaHeadset } from 'react-icons/fa';

const API_BASE = import.meta.env.VITE_API_URL || 'https://dspos.vercel.app/api';

const AdminAI = () => {
    const navigate = useNavigate();
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingRule, setEditingRule] = useState(null);
    const [activeTab, setActiveTab] = useState('rules'); // rules, learning, agents
    const [brainText, setBrainText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

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

    const handleAnalyzeBrain = async () => {
        if (!brainText.trim()) return;
        setIsAnalyzing(true);
        try {
            const res = await axios.post(`${API_BASE}/ai/brain/analyze`, { text: brainText });
            setAnalysisResult(res.data.analysis);
        } catch (err) {
            alert('Error al analizar con el cerebro Discovery');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleApplyAnalysis = async (niche, suggestion) => {
        try {
            await axios.post(`${API_BASE}/admin/ai-rules`, {
                niche,
                key_question: suggestion.key_question,
                expert_tips: suggestion.expert_tips,
                suggested_hardware: suggestion.suggested_hardware
            });
            fetchRules();
            setAnalysisResult(null);
            setBrainText('');
            alert('Nuevo conocimiento aplicado al cerebro con éxito.');
        } catch (err) {
            alert('Error al aplicar el conocimiento');
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

            {/* Tabs Navigation */}
            <div className="flex gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('rules')}
                    className={`pb-4 px-2 font-bold text-sm transition-all ${activeTab === 'rules' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    REGLAS POR NICHO
                </button>
                <button
                    onClick={() => setActiveTab('learning')}
                    className={`pb-4 px-2 font-bold text-sm transition-all ${activeTab === 'learning' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    APRENDIZAJE PROFUNDO (WHATSAPP/MANUALES)
                </button>
                <button
                    onClick={() => setActiveTab('agents')}
                    className={`pb-4 px-2 font-bold text-sm transition-all ${activeTab === 'agents' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    AGENTES ESPECIALIZADOS
                </button>
            </div>

            {activeTab === 'rules' && (
                <div className="grid lg:grid-cols-2 gap-6 animate-fade-in">
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
                        <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-[#A8E0F0]">
                            Consola de Entrenamiento
                        </h2>
                        {editingRule ? (
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase">Nicho de Negocio</label>
                                    <input
                                        type="text"
                                        value={editingRule.niche}
                                        onChange={(e) => setEditingRule({ ...editingRule, niche: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase">Respuesta de Experto</label>
                                    <textarea
                                        value={editingRule.key_question}
                                        onChange={(e) => setEditingRule({ ...editingRule, key_question: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 mt-1 h-32"
                                    />
                                </div>
                                <button onClick={() => handleSave(editingRule)} className="w-full bg-[#A8E0F0] text-[#1c242e] py-4 rounded-xl font-black">
                                    GUARDAR REGLA
                                </button>
                            </div>
                        ) : <p className="text-gray-500 italic">Selecciona una regla para editar su comportamiento.</p>}
                    </div>
                </div>
            )}

            {activeTab === 'learning' && (
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl max-w-4xl mx-auto space-y-6 animate-fade-in">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white text-2xl">
                            <FaBrain />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-800 uppercase">Cerebro Discovery (Deep Learning)</h2>
                            <p className="text-gray-500">Pega conversaciones de WhatsApp o fragmentos de manuales para que la IA aprenda.</p>
                        </div>
                    </div>

                    <textarea
                        className="w-full h-64 p-6 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-green-500 font-mono text-sm text-gray-600"
                        placeholder="Pega aquí la transcripción del chat o texto del manual..."
                        value={brainText}
                        onChange={(e) => setBrainText(e.target.value)}
                    />

                    <button
                        onClick={handleAnalyzeBrain}
                        disabled={isAnalyzing}
                        className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-green-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-green-100"
                    >
                        {isAnalyzing ? 'PROCESANDO CONOCIMIENTO...' : 'ANALIZAR Y APRENDER'}
                    </button>

                    {analysisResult && (
                        <div className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100 space-y-4 animate-bounce-slow">
                            <h3 className="font-bold text-blue-900 flex items-center gap-2">
                                <FaLightbulb /> Sugerencia de la IA para un nuevo Nicho:
                            </h3>
                            <div className="bg-white p-4 rounded-xl">
                                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Nicho Detectado</p>
                                <p className="text-xl font-bold text-blue-600">{analysisResult.niche}</p>
                                <p className="mt-2 text-gray-700 font-medium">"{analysisResult.expert_advice}"</p>
                            </div>
                            <button
                                onClick={() => handleApplyAnalysis(analysisResult.niche, {
                                    key_question: analysisResult.expert_advice,
                                    expert_tips: analysisResult.tips || [],
                                    suggested_hardware: analysisResult.hardware || []
                                })}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm"
                            >
                                INTEGRAR AL CEREBRO
                            </button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'agents' && (
                <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
                    {[
                        { name: 'Agente de Ventas', icon: <FaPlus />, status: 'ACTIVO', color: 'blue', desc: 'Guía al cliente en el configurador.', path: '/configurador' },
                        { name: 'Agente de Diseño', icon: <FaImage />, status: 'ACTIVO', color: 'purple', desc: 'Mejora imágenes y crea banners.', path: '/admin/design' },
                        { name: 'Agente de Soporte', icon: <FaHeadset />, status: 'APRENDIENDO', color: 'orange', desc: 'Responde dudas técnicas (PDFs).', path: null }
                    ].map((agent, i) => (
                        <div key={i} className={`bg-white p-8 rounded-3xl border border-gray-100 shadow-sm border-t-4 border-${agent.color}-500 space-y-4`}>
                            <div className={`w-14 h-14 bg-${agent.color}-50 text-${agent.color}-600 rounded-2xl flex items-center justify-center text-2xl`}>
                                {agent.icon}
                            </div>
                            <h3 className="text-xl font-black text-gray-800">{agent.name}</h3>
                            <p className="text-gray-500 text-sm">{agent.desc}</p>
                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                <span className={`text-[10px] font-black px-2 py-1 rounded-full bg-${agent.color}-50 text-${agent.color}-600`}>
                                    {agent.status}
                                </span>
                                {agent.path ? (
                                    <button
                                        onClick={() => navigate(agent.path)}
                                        className="text-xs font-bold text-blue-600 hover:underline"
                                    >
                                        CONFIGURAR
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setActiveTab('learning')}
                                        className="text-xs font-bold text-orange-600 hover:underline"
                                    >
                                        ENTRENAR
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminAI;
