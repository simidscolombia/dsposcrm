import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
    FaRocket, FaUtensils, FaTools,
    FaStore, FaMedkit, FaCheckCircle,
    FaArrowRight, FaPlay, FaUserTie, FaCommentDots, FaInfoCircle
} from 'react-icons/fa';

const API_BASE = import.meta.env.VITE_API_URL || 'https://dspos.vercel.app/api';

const HomePage = () => {
    const navigate = useNavigate();

    const [assets, setAssets] = useState({
        video_demo_url: '',
        hero_image_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=1200',
        carousel_images: []
    });

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchAssets = async () => {
            try {
                const res = await axios.get(`${API_BASE}/config/all`);
                if (res.data.success && res.data.configs.marketing_assets) {
                    setAssets(res.data.configs.marketing_assets);
                }
            } catch (e) {
                console.log("Using default assets");
            }
        };
        fetchAssets();
    }, []);

    const niches = [
        { name: 'Restaurantes', icon: <FaUtensils />, color: 'orange' },
        { name: 'Ferreterías', icon: <FaTools />, color: 'blue' },
        { name: 'Mercados', icon: <FaStore />, color: 'green' },
        { name: 'Droguerías', icon: <FaMedkit />, color: 'red' },
    ];

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900">
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-[#1c242e]/95 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center transition-all duration-300">
                <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <img src="/logo.png" alt="Discovery" className="w-10 h-10 object-contain" />
                    <div className="flex flex-col">
                        <span className="text-white font-black text-xl leading-none tracking-tight">Discovery</span>
                        <span className="text-gray-400 text-[10px] font-bold leading-none tracking-widest uppercase opacity-60">Systems Pos</span>
                    </div>
                </Link>
                <div className="hidden md:flex items-center gap-8 text-sm">
                    <a href="#soluciones" className="text-gray-300 hover:text-[#A8E0F0] font-bold uppercase tracking-widest text-[11px] transition-colors">Soluciones</a>

                    <Link to="/admin" className="flex items-center gap-2 text-[#A8E0F0] font-black border-r border-white/10 pr-6 hover:opacity-70 transition-all text-[11px] uppercase tracking-[0.1em]">
                        <FaUserTie className="text-sm" /> Ingresar
                    </Link>

                    <button
                        onClick={() => navigate('/configurador')}
                        className="bg-[#A8E0F0] text-[#1c242e] px-8 py-2.5 rounded-xl font-black uppercase text-[11px] tracking-widest hover:shadow-[0_0_20px_rgba(168,224,240,0.4)] transition-all transform hover:scale-105"
                    >
                        IR AHORA
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-24 px-6 overflow-hidden bg-[#1c242e]">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#A8E0F0]/5 to-transparent pointer-events-none" />
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8 animate-fade-in relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[#A8E0F0] text-[10px] font-black uppercase tracking-[0.2em] shadow-inner">
                            <span className="w-2 h-2 bg-[#A8E0F0] rounded-full animate-pulse shadow-[0_0_10px_#A8E0F0]"></span>
                            Sistema POS de Nueva Generación
                        </div>
                        <h1 className="text-4xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter">
                            Configura tu <br /> <span className="text-[#A8E0F0]">Sistema a Medida</span> <br /> aquí.
                        </h1>
                        <p className="text-lg md:text-xl text-gray-400 max-w-lg leading-relaxed font-medium">
                            Olvídate de pagar de más. Obtén una asesoría experta y personalizada para equipar tu negocio con la tecnología exacta que necesitas.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => navigate('/configurador')}
                                className="group relative px-8 py-5 md:px-10 md:py-6 bg-[#A8E0F0] text-[#1c242e] rounded-2xl font-black text-lg md:text-xl overflow-hidden transition-all hover:shadow-[0_20px_40px_-10px_rgba(168,224,240,0.5)] flex items-center justify-center gap-3"
                            >
                                IR AHORA <FaRocket className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </button>
                            <a
                                href={assets.video_demo_url || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-8 py-5 md:px-10 md:py-6 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-base md:text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-3 backdrop-blur-sm"
                            >
                                <FaPlay size={14} className="text-[#A8E0F0]" /> Ver Vídeo Demo
                            </a>
                        </div>
                    </div>
                    <div className="relative animate-fade-in-right">
                        <div className="absolute -inset-10 bg-[#A8E0F0]/10 blur-[120px] rounded-full animate-pulse" />
                        <div className="relative">
                            <img
                                src={assets.hero_image_url || "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800"}
                                alt="POS System"
                                className="relative rounded-[4rem] shadow-2xl border border-white/10 w-full object-cover aspect-[4/3] grayscale transition-all duration-700 hover:grayscale-0"
                            />
                            {/* Accent line */}
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 border-r-8 border-b-8 border-[#A8E0F0]/20 rounded-br-[4rem]" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Solutions by Niche */}
            <section id="soluciones" className="py-20 md:py-32 px-6 bg-gray-50/50">
                <div className="max-w-7xl mx-auto space-y-12 md:space-y-20">
                    <div className="max-w-3xl space-y-4 md:space-y-6">
                        <p className="text-[#A8E0F0] font-black uppercase tracking-[0.3em] text-[9px] md:text-[10px]">Especialización</p>
                        <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">Soluciones para <br /> cada Nicho</h2>
                        <p className="text-gray-500 text-sm md:text-lg font-medium leading-relaxed">Adaptamos nuestro sistema a las necesidades y retos operativos de tu sector comercial.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                        {niches.map((n, idx) => (
                            <div
                                key={idx}
                                onClick={() => navigate('/configurador', { state: { initialNiche: n.name } })}
                                className="group bg-white p-6 md:p-10 rounded-3xl md:rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-blue-50 hover:-translate-y-4 transition-all duration-500 cursor-pointer"
                            >
                                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-${n.color}-50 text-${n.color}-500 flex items-center justify-center text-3xl md:text-4xl mb-6 md:mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner`}>
                                    {n.icon}
                                </div>
                                <h3 className="text-xl md:text-2xl font-black mb-2 md:mb-3 text-gray-800 tracking-tight">{n.name}</h3>
                                <p className="text-gray-500 text-xs md:text-sm leading-relaxed font-medium">Configuración premium optimizada para la operación de tu {n.name.toLowerCase()}.</p>
                                <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-gray-50 flex items-center gap-2 text-[9px] md:text-[10px] font-black text-blue-600 md:opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                                    Configurar Ahora <FaArrowRight />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Expert Advisory Section */}
            <section className="py-20 md:py-32 px-6 bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 md:gap-24 items-center">
                    <div className="relative">
                        <div className="absolute -inset-20 bg-blue-50 blur-[100px] opacity-60 rounded-full" />
                        <img
                            src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800"
                            alt="Professional Support"
                            className="relative rounded-3xl md:rounded-[4rem] shadow-2xl rotate-1 md:rotate-2 hover:rotate-0 transition-transform duration-1000"
                        />
                        <div className="absolute -bottom-6 -left-6 md:-bottom-10 md:-left-10 bg-[#1c242e] text-white p-6 md:p-10 rounded-2xl md:rounded-[3rem] shadow-2xl z-20">
                            <p className="text-3xl md:text-4xl font-black text-[#A8E0F0]">100%</p>
                            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-60 mt-1">Soporte Humano</p>
                        </div>
                    </div>
                    <div className="space-y-8 md:space-y-10">
                        <h2 className="text-3xl md:text-6xl font-black text-gray-900 leading-[1.1] tracking-tighter">Asesoría de <span className="text-blue-600 text-glow">Expertos</span> para tu crecimiento.</h2>
                        <div className="space-y-8">
                            {[
                                { title: 'Personalización Total', desc: 'No vendemos cajas, diseñamos soluciones basadas en tu flujo de trabajo.' },
                                { title: 'Hardware Certificado', desc: 'Solo trabajamos con marcas líderes que garantizan durabilidad y velocidad.' },
                                { title: 'Puesta en Marcha', desc: 'Recibe tu sistema configurado, importado y listo para vender desde el minuto uno.' }
                            ].map((f, idx) => (
                                <div key={idx} className="flex gap-6 group">
                                    <div className="flex-shrink-0 w-12 h-12 bg-gray-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm">
                                        <FaCheckCircle />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-2">{f.title}</h4>
                                        <p className="text-gray-500 font-medium leading-relaxed">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => navigate('/configurador')}
                            className="w-full sm:w-fit px-10 py-5 md:px-12 md:py-6 bg-[#1c242e] text-white rounded-2xl font-black text-base md:text-lg flex items-center justify-center gap-4 hover:bg-black transition-all shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] group"
                        >
                            PEDIR MI ASESORÍA AHORA <FaRocket className="group-hover:translate-x-1" />
                        </button>
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-16 md:py-24 px-6 mb-10 md:mb-20">
                <div className="max-w-6xl mx-auto bg-gradient-to-br from-[#1c242e] via-[#242f3d] to-[#1c242e] rounded-[2.5rem] md:rounded-[5rem] p-10 md:p-24 text-center relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] border border-white/5">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                    <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#A8E0F0]/10 blur-[100px] rounded-full" />
                    <div className="relative z-10 space-y-8 md:space-y-10">
                        <h2 className="text-3xl md:text-7xl font-black text-white leading-tight tracking-tighter">¿Listo para modernizar <br /> tu punto de venta?</h2>
                        <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6 pt-4">
                            <button
                                onClick={() => navigate('/configurador')}
                                className="bg-[#A8E0F0] text-[#1c242e] px-8 py-5 md:px-16 md:py-7 rounded-2xl md:rounded-3xl font-black text-lg md:text-2xl hover:scale-105 transition-all shadow-[0_30px_60px_-15px_rgba(168,224,240,0.5)]"
                            >
                                EMPEZAR COTIZACIÓN AHORA
                            </button>
                            <a
                                href="https://wa.me/573202792169"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white/5 text-white border border-white/10 px-8 py-5 md:px-16 md:py-7 rounded-2xl md:rounded-3xl font-bold text-lg md:text-2xl hover:bg-white/10 transition-all backdrop-blur-sm"
                            >
                                Hablar con un asesor
                            </a>
                        </div>
                    </div>
                </div>
            </section>



            {/* Footer */}
            <footer className="bg-[#0b1120] py-20 px-6 text-center border-t border-white/5">
                <div className="max-w-7xl mx-auto space-y-12">
                    <div className="flex flex-col items-center gap-6">
                        <img src="/logo.png" alt="Logo" className="w-12 opacity-20 hover:opacity-100 transition-opacity duration-700" />
                        <div className="space-y-1">
                            <p className="text-white font-black text-2xl leading-none tracking-tighter">Discovery</p>
                            <p className="text-gray-600 text-[10px] uppercase font-black tracking-[0.4em] opacity-40">Systems POS Solutions</p>
                        </div>
                    </div>

                    <div className="flex justify-center flex-wrap gap-12 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
                        <Link to="/admin" className="hover:text-[#A8E0F0] transition-all">Panel Administrativo</Link>
                        <a href="https://wa.me/573202792169" className="text-green-600 hover:text-green-500 border-b-2 border-green-500/10 hover:border-green-500 transition-all pb-1 mx-4">WhatsApp Oficial</a>
                        <Link to="/configurador" className="hover:text-white transition-all">Cotizador Web</Link>
                    </div>

                    <div className="pt-12 border-t border-white/5 space-y-4">
                        <p className="text-gray-400 text-[10px] font-bold max-w-sm mx-auto leading-relaxed">
                            © {new Date().getFullYear()} Discovery Systems. Diseñado para la eficiencia operativa.
                        </p>
                        <p className="text-gray-600 text-[9px] uppercase tracking-widest font-black opacity-30">Medellín • Colombia</p>
                    </div>
                </div>
            </footer>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in-right {
          animation: fadeInRight 1.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .text-glow {
          text-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }
      `}} />
        </div>
    );
};

export default HomePage;
