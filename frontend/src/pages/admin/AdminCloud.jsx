import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaServer, FaPowerOff, FaSync, FaTrash, FaGlobe, FaCogs, FaMicrochip, FaMemory, FaHdd, FaRocket } from 'react-icons/fa';

const AdminCloud = () => {
    const [instances, setInstances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ cpu: '25%', ram: '64%', traffic: '1.2 GB' });

    // Datos simulados basados en tu panel actual (mientras conectamos la API real)
    const mockInstances = [
        { id: 1, name: 'EL PUNTO IDEAL SAS', subdomain: 'elpuntoidealsas.poslatino.com', port: 8441, status: 'online' },
        { id: 2, name: 'DEREK', subdomain: 'derek.poslatino.com', port: 8905, status: 'online' },
        { id: 3, name: 'Diego Clinica San Luis', subdomain: 'sedijosas.poslatino.com', port: 8904, status: 'online' },
        { id: 4, name: 'BURGER GRILL SMASH', subdomain: 'burgergrillsmash.poslatino.com', port: 8701, status: 'online' },
        { id: 5, name: 'INSUMEDICAS LA VILLA', subdomain: 'insumedicaslavilla.poslatino.com', port: 8210, status: 'online' },
        { id: 6, name: 'CALLEJEROS SANGIL', subdomain: 'callejerossangil.poslatino.com', port: 8312, status: 'online' },
        { id: 7, name: 'EL BROASTER DEL CHEF', subdomain: 'elbroasterdelchef.poslatino.com', port: 8550, status: 'online' }
    ];

    useEffect(() => {
        // En el futuro aquí llamaremos a tu servidor de DigitalOcean
        setTimeout(() => {
            setInstances(mockInstances);
            setLoading(false);
        }, 1000);
    }, []);

    const getStatusColor = (status) => {
        return status === 'online' ? 'bg-green-500' : 'bg-red-500';
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header con Stats Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                            <FaServer className="text-white text-2xl" />
                        </div>
                        Torre de Control Cloud
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium italic">Gestión de infraestructura en DigitalOcean</p>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <FaMicrochip />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">CPU Servidor</p>
                        <p className="text-xl font-black text-slate-800">{stats.cpu}</p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                        <FaMemory />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">RAM en Uso</p>
                        <p className="text-xl font-black text-slate-800">{stats.ram}</p>
                    </div>
                </div>
            </div>

            {/* Acciones Globales */}
            <div className="flex justify-between items-center bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                        {instances.map((_, i) => (
                            <div key={i} className={`w-8 h-8 rounded-full border-2 border-slate-900 ${getStatusColor('online')}`}></div>
                        ))}
                    </div>
                    <p className="text-sm font-bold">{instances.length} Nubes Activas</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-black flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-600/30">
                    <FaRocket /> Nueva Instancia (Deploy)
                </button>
            </div>

            {/* Listado de Instancias */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="animate-spin text-4xl text-blue-600 mb-4 inline-block">⏳</div>
                        <p className="text-slate-500 font-bold">Escaneando red de DigitalOcean...</p>
                    </div>
                ) : (
                    instances.map((inst) => (
                        <div key={inst.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:border-blue-100 transition-all group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                        <FaGlobe size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">{inst.name}</h3>
                                        <p className="text-xs font-mono text-blue-600 uppercase mt-0.5 tracking-tighter">{inst.subdomain}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-100">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-[10px] font-black text-green-600 uppercase">Online</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-slate-50 p-3 rounded-xl">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Puerto Asignado</p>
                                    <p className="text-lg font-black text-slate-700">{inst.port}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl">
                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Ubicación</p>
                                    <p className="text-lg font-black text-slate-700 font-mono">NY-01 (DO)</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Core Engine v6.1</span>
                                <div className="flex gap-2">
                                    <button className="p-3 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all" title="Reiniciar PM2">
                                        <FaSync />
                                    </button>
                                    <button className="p-3 bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white rounded-xl transition-all" title="Ajustes de Red">
                                        <FaCogs />
                                    </button>
                                    <button className="p-3 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all" title="Purga Galáctica">
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminCloud;
