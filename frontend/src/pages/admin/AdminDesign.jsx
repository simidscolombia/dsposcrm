import React, { useState } from 'react';
import axios from 'axios';
import { FaPalette, FaImage, FaMagic, FaCheckCircle, FaRobot, FaExpand } from 'react-icons/fa';

const API_BASE = '';

const AdminDesign = () => {
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleEnhance = async () => {
        if (!image) return;
        setIsAnalyzing(true);
        try {
            const formData = new FormData();
            formData.append('image', image);

            // This endpoint would use Gemini Vision to analyze and improve
            const res = await axios.post(`${API_BASE}/ai/design/enhance`, formData);
            setResult(res.data.suggestion);
        } catch (err) {
            alert('Error en el Agente de Diseño');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
            <header className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
                        <FaPalette />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Agente de Diseño Experto</h2>
                        <p className="text-gray-500 text-sm">Optimiza tus fotos y crea contenido visual premium para el catálogo.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-full font-bold text-xs">
                    <FaRobot /> MODO: MEJORA VISUAL
                </div>
            </header>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Upload Section */}
                <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 space-y-6 flex flex-col items-center justify-center text-center">
                    <input type="file" id="design-upload" className="hidden" onChange={handleImageChange} accept="image/*" />
                    {!preview ? (
                        <label htmlFor="design-upload" className="w-full h-80 border-4 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all group">
                            <FaImage className="text-6xl text-gray-200 group-hover:text-purple-200 mb-4 transition-colors" />
                            <p className="text-gray-400 font-bold uppercase tracking-widest">Sube una foto de producto</p>
                            <span className="text-[10px] text-gray-300 mt-2">PNG, JPG o WEBP</span>
                        </label>
                    ) : (
                        <div className="relative w-full h-80 rounded-3xl overflow-hidden group">
                            <img src={preview} alt="Preview" className="w-full h-full object-contain bg-gray-50" />
                            <label htmlFor="design-upload" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold cursor-pointer transition-opacity">
                                CAMBIAR IMAGEN
                            </label>
                        </div>
                    )}

                    <button
                        onClick={handleEnhance}
                        disabled={!preview || isAnalyzing}
                        className="w-full bg-purple-600 text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-purple-100 disabled:opacity-50"
                    >
                        {isAnalyzing ? <><FaPalette className="animate-spin" /> ESTILIZANDO...</> : <><FaMagic /> MEJORAR CON IA</>}
                    </button>
                </div>

                {/* Results Section */}
                <div className="bg-[#1c242e] text-white p-10 rounded-3xl shadow-2xl space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl"><FaMagic /></div>

                    <div>
                        <h3 className="text-xl font-black uppercase text-purple-400 flex items-center gap-3">
                            <FaCheckCircle /> Resultados de Diseño
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">Sugerencias inteligentes basadas en tendencias actuales.</p>
                    </div>

                    {!result ? (
                        <div className="h-64 flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                            <FaRobot className="text-5xl" />
                            <p className="max-w-xs text-sm">Sube una imagen y deja que el Agente de Diseño analice la composición y el contenido.</p>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Descripción Premium Generada</p>
                                <p className="text-lg leading-relaxed">{result.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Paleta Sugerida</p>
                                    <div className="flex gap-2">
                                        {result.colors?.map((c, i) => <div key={i} className="w-6 h-6 rounded-full" style={{ backgroundColor: c }} />)}
                                    </div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Impacto Visual</p>
                                    <p className="text-xl font-bold text-green-400">{result.score}%</p>
                                </div>
                            </div>
                            <button className="w-full bg-white/10 py-3 rounded-xl font-bold text-sm hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                                <FaExpand /> REMOVER FONDO (PROXIMAMENTE)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDesign;
