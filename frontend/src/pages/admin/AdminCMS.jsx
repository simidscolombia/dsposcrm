import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaImage, FaVideo, FaSave, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const API_BASE = import.meta.env.VITE_API_URL || 'https://dspos.vercel.app/api';

const AdminCMS = () => {
    const [assets, setAssets] = useState({
        video_demo_url: '',
        hero_image_url: '',
        carousel_images: []
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState(null);

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const res = await axios.get(`${API_BASE}/config/all`);
                if (res.data.success && res.data.configs.marketing_assets) {
                    setAssets(res.data.configs.marketing_assets);
                }
            } catch (e) {
                console.error("Error loading marketing assets");
            } finally {
                setLoading(false);
            }
        };
        fetchAssets();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setStatus(null);
        try {
            // Reusing company config PUT but for marketing_assets key logic if backend supports it
            // Assuming we'll have a specific PUT /api/config/marketing (if not, use PUT /api/config/company with different key logic)
            const res = await axios.put(`${API_BASE}/config/marketing`, assets);
            if (res.data.success) {
                setStatus({ type: 'success', text: 'Marketing visual actualizado correctamente.' });
            }
        } catch (e) {
            setStatus({ type: 'error', text: 'Error al guardar los cambios.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 font-bold uppercase tracking-widest animate-pulse">Cargando Centro Multimedia...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <header className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase">Personalización Visual</h2>
                    <p className="text-gray-500 text-sm">Gestiona los videos e imágenes de tu página principal.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#1c242e] text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-3 hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                    <FaSave /> {saving ? 'Guardando...' : 'Publicar Cambios'}
                </button>
            </header>

            {status && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {status.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                    {status.text}
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
                {/* Hero Settings */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                    <h3 className="font-black text-gray-800 uppercase flex items-center gap-3">
                        <FaImage className="text-blue-500" /> Cabecera (Hero)
                    </h3>
                    <div className="space-y-4">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Imagen Principal (URL)</label>
                        <input
                            type="text"
                            className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-blue-500"
                            placeholder="https://images.unsplash.com/..."
                            value={assets.hero_image_url}
                            onChange={(e) => setAssets({ ...assets, hero_image_url: e.target.value })}
                        />
                        <div className="h-40 rounded-2xl overflow-hidden bg-gray-100 border border-dashed border-gray-300">
                            {assets.hero_image_url ? (
                                <img src={assets.hero_image_url} alt="Vista Previa" className="w-full h-full object-contain" />
                            ) : <div className="w-full h-full flex items-center justify-center text-3xl opacity-10">🖼️</div>}
                        </div>
                    </div>
                </div>

                {/* Video Demo */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                    <h3 className="font-black text-gray-800 uppercase flex items-center gap-3">
                        <FaVideo className="text-red-500" /> Vídeo Demo
                    </h3>
                    <div className="space-y-4">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">URL de YouTube o MP4</label>
                        <input
                            type="text"
                            className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-red-500 font-mono text-sm"
                            placeholder="https://youtube.com/..."
                            value={assets.video_demo_url}
                            onChange={(e) => setAssets({ ...assets, video_demo_url: e.target.value })}
                        />
                        <p className="text-[10px] text-gray-400">Este link se abrirá cuando el cliente haga clic en "Ver Vídeo Demo".</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminCMS;
