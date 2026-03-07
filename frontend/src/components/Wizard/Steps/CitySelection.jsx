import React, { useState, useEffect, useMemo } from 'react';
import { colombiaData } from '../../../data/colombia';
import { FaMapMarkerAlt, FaGlobeAmericas, FaChevronRight, FaArrowLeft, FaSearch, FaTimes } from 'react-icons/fa';

const CitySelection = ({ onSelect }) => {
    const [selectedDept, setSelectedDept] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [detectedCity, setDetectedCity] = useState(null);
    const [detecting, setDetecting] = useState(false);

    // Helper para normalizar texto (quitar acentos para búsqueda)
    const normalize = (str) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    // Intentar geolocalizar al cargar
    useEffect(() => {
        const detectLocation = async () => {
            setDetecting(true);
            try {
                const res = await fetch('https://ipapi.co/json/');
                const data = await res.json();
                if (data.country_code === 'CO' && data.city) {
                    setDetectedCity(data.city);
                }
            } catch (e) {
                console.log("No se pudo detectar la ubicación");
            }
            setDetecting(false);
        };
        detectLocation();
    }, []);

    // BÚSQUEDA INTELIGENTE GLOBAL: Busca en todas las ciudades de todos los departamentos
    const searchResults = useMemo(() => {
        const term = normalize(searchTerm);
        if (!term || term.length < 2) return [];

        const results = [];

        colombiaData.forEach(dept => {
            const deptNorm = normalize(dept.department);
            dept.cities.forEach(city => {
                const cityNorm = normalize(city);
                if (cityNorm.includes(term) || deptNorm.includes(term)) {
                    results.push({ city, department: dept.department, emoji: dept.emoji });
                }
            });
        });

        // Ordenar: exactos primero, luego por longitud
        return results.sort((a, b) => {
            const aNorm = normalize(a.city);
            const bNorm = normalize(b.city);
            if (aNorm === term) return -1;
            if (bNorm === term) return 1;
            return aNorm.length - bNorm.length;
        }).slice(0, 15);
    }, [searchTerm]);

    const handleDeptSelect = (dept) => {
        setSelectedDept(dept);
        setSearchTerm('');
    };

    const handleBack = () => {
        setSelectedDept(null);
        setSearchTerm('');
    };

    const handleGlobalSelect = (item) => {
        onSelect(item.city);
    };

    return (
        <div className="max-w-xl mx-auto p-4 md:p-6 animate-fade-in flex flex-col h-full bg-gray-50/30">
            {/* Header - Muy visual para móvil */}
            <div className="text-center mb-6 pt-2">
                <div className="relative inline-block">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 text-white rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-3 md:mb-4 text-2xl md:text-3xl shadow-lg transform -rotate-3">
                        <FaMapMarkerAlt />
                    </div>
                    {detecting && (
                        <div className="absolute -right-1 -top-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                    )}
                </div>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-tight">¿En qué ciudad<br />estás hoy?</h2>
            </div>

            {/* Buscador - Fijo en la parte superior del flujo */}
            <div className="relative mb-6 sticky top-0 z-20 group">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 group-focus-within:scale-110 transition-transform" />
                <input
                    type="text"
                    placeholder="Escribe tu ciudad (ej: Chía, Cali...)"
                    className="w-full pl-12 pr-12 py-4 md:py-5 bg-white border-2 border-transparent shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] rounded-2xl md:rounded-3xl focus:border-blue-500 outline-none transition-all text-base md:text-lg font-medium placeholder:text-gray-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus={!detectedCity}
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-100 text-gray-400 rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-50 hover:text-red-400 transition-colors"
                    >
                        <FaTimes />
                    </button>
                )}
            </div>

            {/* SUGERENCIA INTELIGENTE (GEOLOCALIZACIÓN) */}
            {detectedCity && !searchTerm && !selectedDept && (
                <div className="mb-8 animate-fade-in">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-2">¿Es esta tu ubicación?</p>
                    <button
                        onClick={() => onSelect(detectedCity)}
                        className="w-full bg-white p-4 md:p-5 rounded-2xl md:rounded-3xl border-2 border-blue-500 shadow-xl shadow-blue-500/10 flex items-center justify-between group active:scale-[0.98] transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-xl md:rounded-2xl flex items-center justify-center text-blue-600">
                                <FaGlobeAmericas className="text-xl md:text-2xl animate-spin-slow" />
                            </div>
                            <div className="text-left">
                                <p className="text-lg md:text-xl font-black text-gray-800">{detectedCity}</p>
                                <p className="text-[10px] md:text-xs text-blue-500 font-bold">Clic para confirmar</p>
                            </div>
                        </div>
                        <div className="bg-blue-600 text-white p-1.5 md:p-2 rounded-lg md:rounded-xl text-xs md:text-base">
                            <FaChevronRight />
                        </div>
                    </button>
                </div>
            )}

            {/* RESULTADOS DE BÚSQUEDA (MODO ACTIVO) */}
            {searchTerm && (
                <div className="animate-fade-in-up">
                    {searchResults.length > 0 ? (
                        <div className="bg-white rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-2xl border border-blue-50">
                            <div className="p-3 md:p-4 bg-blue-50/50 text-[9px] md:text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] border-b border-blue-100 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                                Sugerencias encontradas
                            </div>
                            <div className="divide-y divide-gray-50 max-h-[40vh] md:max-h-[50vh] overflow-y-auto custom-scrollbar">
                                {searchResults.map((item, idx) => (
                                    <button
                                        key={`${item.city}-${idx}`}
                                        onClick={() => handleGlobalSelect(item)}
                                        className="w-full p-4 md:p-5 hover:bg-blue-50 flex items-center justify-between group active:bg-blue-100 transition-all font-sans"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-xl md:text-2xl transition-transform group-hover:scale-125">{item.emoji}</span>
                                            <div className="text-left">
                                                <p className="font-bold text-gray-800 text-base md:text-lg group-hover:text-blue-700">{item.city}</p>
                                                <p className="text-[9px] md:text-[10px] text-gray-400 font-mono tracking-tighter uppercase">{item.department}</p>
                                            </div>
                                        </div>
                                        <FaChevronRight className="text-gray-200 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : searchTerm.length >= 2 && (
                        <div className="text-center py-12 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 shadow-sm">
                            <div className="text-5xl mb-4 grayscale opacity-30">🔍</div>
                            <p className="text-gray-800 font-black">No encontramos resultados</p>
                            <p className="text-sm text-gray-400 mt-2 px-8">Intenta escribiendo el nombre sin tildes o revisa la ortografía.</p>
                        </div>
                    )}
                </div>
            )}

            {/* NAVEGACIÓN POR DEPARTAMENTOS (ESTADO INICIAL) */}
            {!searchTerm && !selectedDept && (
                <div className="flex-1 animate-fade-in">
                    <div className="flex items-center justify-between mb-3 px-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">O explora por departamento</p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm">
                        <div className="max-h-[50vh] md:max-h-[350px] overflow-y-auto custom-scrollbar divide-y divide-gray-50">
                            {colombiaData.map((dept) => (
                                <button
                                    key={dept.department}
                                    onClick={() => handleDeptSelect(dept)}
                                    className="w-full p-4 hover:bg-blue-50 flex items-center justify-between group active:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-xl grayscale group-hover:grayscale-0 transition-all">{dept.emoji}</span>
                                        <span className="text-sm font-bold text-gray-600 group-hover:text-blue-700">{dept.department}</span>
                                    </div>
                                    <FaChevronRight className="text-gray-100 group-hover:text-blue-200" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* NAVEGACIÓN CIUDADES (SEGUNDA CAPA) */}
            {!searchTerm && selectedDept && (
                <div className="animate-fade-in-up">
                    <button
                        onClick={handleBack}
                        className="mb-4 flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-full w-fit active:scale-95 transition-all"
                    >
                        <FaArrowLeft /> Regresar
                    </button>

                    <div className="bg-white rounded-[2rem] shadow-xl border border-blue-50 overflow-hidden">
                        <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
                            <h3 className="font-bold flex items-center gap-2">
                                <span className="text-2xl">{selectedDept.emoji}</span>
                                <div>
                                    <p className="text-[10px] opacity-70 uppercase tracking-tight font-black">Departamento</p>
                                    <p className="text-lg leading-tight">{selectedDept.department}</p>
                                </div>
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 max-h-[50vh] md:max-h-[350px] overflow-y-auto custom-scrollbar divide-y divide-gray-50">
                            {selectedDept.cities.map((city) => (
                                <button
                                    key={city}
                                    onClick={() => onSelect(city)}
                                    className="p-5 hover:bg-blue-50 text-left flex items-center justify-between font-bold text-gray-700 active:bg-blue-100 transition-all group"
                                >
                                    <span>{city}</span>
                                    <FaChevronRight className="text-blue-100 group-hover:text-blue-600 transition-all" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CitySelection;
