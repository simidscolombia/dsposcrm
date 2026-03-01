import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaRocket, FaRobot, FaUtensils, FaTools,
    FaStore, FaMedkit, FaCogs, FaCheckCircle
} from 'react-icons/fa';

const HomePage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
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
            <nav className="fixed w-full z-50 bg-[#1c242e]/95 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Discovery" className="w-10 h-10 object-contain" />
                    <div className="flex flex-col">
                        <span className="text-white font-bold text-xl leading-none tracking-wide">Discovery</span>
                        <span className="text-gray-400 text-[10px] font-semibold leading-none tracking-widest uppercase">Systems Pos</span>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
                    <a href="#soluciones" className="hover:text-[#A8E0F0] transition-colors">Soluciones</a>
                    <a href="#ia" className="hover:text-[#A8E0F0] transition-colors">IA Discovery</a>
                    <button
                        onClick={() => navigate('/configurador')}
                        className="bg-[#A8E0F0] text-[#1c242e] px-6 py-2 rounded-full font-bold hover:shadow-[0_0_20px_rgba(168,224,240,0.5)] transition-all transform hover:scale-105"
                    >
                        Configurar ahora
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 overflow-hidden bg-[#1c242e]">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#A8E0F0]/10 to-transparent pointer-events-none" />
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8 animate-fade-in">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[#A8E0F0] text-sm font-semibold">
                            <FaRobot className="animate-pulse" /> Desarrollado con Inteligencia Artificial
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white leading-tight">
                            Configura tu <span className="text-[#A8E0F0]">Sistema a Medida</span> aquí.
                        </h1>
                        <p className="text-xl text-gray-400 max-w-lg">
                            No compres solo hardware. Obtén una asesoría experta en tiempo real para equipar tu negocio con tecnología de punta.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => navigate('/configurador')}
                                className="group relative px-8 py-4 bg-[#A8E0F0] text-[#1c242e] rounded-xl font-black text-lg overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(168,224,240,0.4)]"
                            >
                                <div className="relative z-10 flex items-center gap-2">
                                    EMPEZAR CONFIGURACIÓN <FaRocket className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </div>
                            </button>
                            <button className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-bold hover:bg-white/10 transition-all">
                                Ver Vídeo Demo
                            </button>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="absolute -inset-4 bg-[#A8E0F0]/20 blur-3xl rounded-full animate-pulse" />
                        <img
                            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800"
                            alt="POS System"
                            className="relative rounded-2xl shadow-2xl border border-white/10"
                        />
                        {/* AI Floating Card */}
                        <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-gray-100 flex items-center gap-4 animate-bounce-slow">
                            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xl">
                                <FaRobot />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Asistente Virtual</p>
                                <p className="text-sm font-black text-gray-800">"Sugerencia: Kit de Restaurante..."</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Solutions by Niche */}
            <section id="soluciones" className="py-24 px-6 bg-gray-50">
                <div className="max-w-7xl mx-auto space-y-16">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl font-black text-gray-900">Soluciones por Nicho</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">Adaptamos nuestro sistema a las necesidades reales de tu sector comercial.</p>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {niches.map((n, idx) => (
                            <div key={idx} className="group bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all cursor-pointer">
                                <div className={`w-16 h-16 rounded-2xl bg-${n.color}-50 text-${n.color}-500 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform`}>
                                    {n.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-2">{n.name}</h3>
                                <p className="text-gray-500 text-sm">Configuración avanzada optimizada para flujo de alto tráfico.</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* AI Features */}
            <section id="ia" className="py-24 px-6 bg-white border-t border-gray-100">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
                    <div className="order-2 lg:order-1">
                        <img
                            src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=800"
                            alt="AI Tech"
                            className="rounded-3xl shadow-lg transform -rotate-2"
                        />
                    </div>
                    <div className="order-1 lg:order-2 space-y-8">
                        <h2 className="text-4xl font-black leading-tight">El Cotizador que <span className="text-blue-600">Aprende contigo.</span></h2>
                        <div className="space-y-6">
                            {[
                                { title: 'Asesoría en Tiempo Real', desc: 'La IA analiza tu tipo de negocio y sugiere el hardware compatible.' },
                                { title: 'Optimización de Costos', desc: 'Evita comprar accesorios que no necesitas según tu operación local.' },
                                { title: 'Soporte Predictivo', desc: 'Identifica posibles cuellos de botella en tu configuración antes de comprar.' }
                            ].map((f, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="flex-shrink-0 w-6 h-6 text-green-500 mt-1">
                                        <FaCheckCircle />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{f.title}</h4>
                                        <p className="text-gray-600 text-sm">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => navigate('/configurador')}
                            className="w-full py-4 bg-[#1c242e] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all"
                        >
                            Comenzar Asesoría Virtual <FaRobot />
                        </button>
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto bg-gradient-to-br from-[#1c242e] to-[#2d3a4b] rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-8 relative z-10">¿Listo para modernizar tu negocio?</h2>
                    <div className="relative z-10 flex flex-col sm:flex-row justify-center gap-6">
                        <button
                            onClick={() => navigate('/configurador')}
                            className="bg-[#A8E0F0] text-[#1c242e] px-12 py-5 rounded-2xl font-black text-xl hover:scale-105 transition-transform shadow-xl"
                        >
                            Configurar mi Sistema
                        </button>
                        <button className="bg-white/10 text-white border border-white/20 px-12 py-5 rounded-2xl font-bold text-xl hover:bg-white/20 transition-all">
                            Hablar con un asesor
                        </button>
                    </div>
                </div>
            </section>

            {/* Floating Admin Entry (Subtle) */}
            <button
                onClick={() => navigate('/admin')}
                className="fixed bottom-4 right-4 w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/10 hover:text-white/40 transition-all z-10"
                title="Admin Access"
            >
                <FaCog />
            </button>

            {/* Footer */}
            <footer className="bg-[#0f172a] py-16 px-6 text-center border-t border-white/5">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex justify-center items-center gap-4 text-white/30">
                        <img src="/logo.png" alt="Logo" className="w-8 opacity-20 grayscale" />
                        <span className="font-bold tracking-widest text-xs uppercase">Discovery Systems POS</span>
                    </div>

                    <div className="flex justify-center flex-wrap gap-8 text-[10px] font-black uppercase tracking-widest text-gray-500">
                        <a href="#/admin" className="hover:text-[#A8E0F0] transition-colors">Panel de Control</a>
                        <a href="https://wa.me/573202792169" className="text-green-600 hover:text-green-500">Soporte WhatsApp</a>
                        <a href="#/configurador" className="hover:text-white transition-colors">Cotizador Online</a>
                    </div>

                    <p className="text-gray-600 text-[10px]">
                        © {new Date().getFullYear()} Soluciones Tecnológicas de Vanguardia. Medellín, Colombia.
                    </p>
                </div>
            </footer>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s infinite ease-in-out;
        }
        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
        </div>
    );
};

export default HomePage;
