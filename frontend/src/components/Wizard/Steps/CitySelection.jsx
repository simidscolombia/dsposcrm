import React, { useState, useEffect, useMemo } from 'react';
import { colombiaData } from '../../../data/colombia';
import { FaMapMarkerAlt, FaGlobeAmericas, FaChevronRight, FaArrowLeft, FaSearch, FaHistory } from 'react-icons/fa';

const CitySelection = ({ onSelect }) => {
    const [selectedDept, setSelectedDept] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [detectedCity, setDetectedCity] = useState(null);
    const [detecting, setDetecting] = useState(false);

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
        if (!searchTerm || searchTerm.length < 2) return [];

        const results = [];
        const term = searchTerm.toLowerCase();

        colombiaData.forEach(dept => {
            dept.cities.forEach(city => {
                if (city.toLowerCase().includes(term) || dept.department.toLowerCase().includes(term)) {
                    results.push({ city, department: dept.department, emoji: dept.emoji });
                }
            });
        });

        // Limitar resultados para no saturar el móvil
        return results.slice(0, 15);
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
        <div className="max-w-xl mx-auto p-4 md:p-6 animate-fade-in flex flex-col h-full">
            {/* Header - Compacto en móvil */}
            <div className="text-center mb-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl md:text-2xl shadow-inner">
                    <FaMapMarkerAlt />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 tracking-tight">¿Dónde te encuentras?</h2>
                <p className="text-gray-500 text-xs md:text-sm mt-1">Busca tu ciudad para personalizar tu oferta.</p>
            </div>

            {/* Buscador Inteligente - Siempre Arriba */}
            <div className="relative mb-4 sticky top-0 z-10">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Escribe tu ciudad (ej: Medellín, Chía...)"
                    className="w-full pl-12 pr-4 py-4 md:py-5 bg-white border-2 border-transparent shadow-lg rounded-2xl focus:border-blue-500 outline-none transition-all text-base md:text-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-100 text-gray-400 rounded-full p-1 text-xs"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Geodetección - Solo si no estamos buscando */}
            {detectedCity && !searchTerm && !selectedDept && (
                <div className="mb-4">
                    <button
                        onClick={() => onSelect(detectedCity)}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-2xl text-white shadow-md active:scale-95 transition-all flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3">
                            <FaGlobeAmericas className="text-xl animate-spin-slow" />
                            <div className="text-left">
                                <p className="text-[9px] uppercase font-black opacity-70 tracking-tighter">Sugerencia inteligente</p>
                                <p className="text-base font-bold">{detectedCity}</p>
                            </div>
                        </div>
                        <FaChevronRight className="text-white/50" />
                    </button>
                </div>
            )}

            {/* RESULTADOS DE BÚSQUEDA GLOBAL */}
            {searchTerm && searchResults.length > 0 && (
                <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 animate-fade-in">
                    <div className="p-3 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                        Resultados encontrados
                    </div>
                    {searchResults.map((item, idx) => (
                        <button
                            key={`${item.city}-${idx}`}
                            onClick={() => handleGlobalSelect(item)}
                            className="w-full p-4 hover:bg-blue-50 border-b border-gray-50 last:border-0 flex items-center justify-between transition-colors group active:bg-blue-100"
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-xl">{item.emoji}</span>
                                <div className="text-left">
                                    <p className="font-bold text-gray-800 group-hover:text-blue-700">{item.city}</p>
                                    <p className="text-[10px] text-gray-400">{item.department}</p>
                                </div>
                            </div>
                            <FaChevronRight className="text-gray-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                        </button>
                    ))}
                </div>
            )}

            {/* LISTA POR DEPARTAMENTOS (SI NO HAY BÚSQUEDA) */}
            {!searchTerm && !selectedDept && (
                <div className="flex-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">O selecciona tu departamento</p>
                    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                        <div className="max-h-[40vh] md:max-h-[350px] overflow-y-auto custom-scrollbar">
                            {colombiaData.map((dept) => (
                                <button
                                    key={dept.department}
                                    onClick={() => handleDeptSelect(dept)}
                                    className="w-full p-4 hover:bg-blue-50 border-b border-gray-50 last:border-0 flex items-center justify-between transition-colors group active:bg-gray-100"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-xl">{dept.emoji}</span>
                                        <span className="font-semibold text-gray-700 group-hover:text-blue-700">{dept.department}</span>
                                    </div>
                                    <FaChevronRight className="text-gray-200" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* LISTA POR CIUDAD (DENTRO DE DEPARTAMENTO SELECCIONADO) */}
            {!searchTerm && selectedDept && (
                <div className="animate-fade-in">
                    <button
                        onClick={handleBack}
                        className="mb-4 flex items-center gap-2 text-blue-600 font-bold text-sm"
                    >
                        <FaArrowLeft /> Volver
                    </button>

                    <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800 text-sm">🏙️ Ciudades en {selectedDept.department}</h3>
                        </div>
                        <div className="grid grid-cols-1 max-h-[40vh] md:max-h-[350px] overflow-y-auto custom-scrollbar">
                            {selectedDept.cities.map((city) => (
                                <button
                                    key={city}
                                    onClick={() => onSelect(city)}
                                    className="p-4 hover:bg-blue-50 border-b border-gray-50 text-left flex items-center justify-between font-medium text-gray-600 active:bg-blue-100"
                                >
                                    {city}
                                    <FaChevronRight className="text-xs text-blue-300" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Sin resultados */}
            {searchTerm && searchResults.length === 0 && (
                <div className="text-center py-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="text-4xl mb-2">🕵️‍♂️</div>
                    <p className="text-gray-500 font-medium">No encontramos esa ciudad.</p>
                    <p className="text-xs text-gray-400 mt-1">Prueba escribiendo "Bogotá" o "Cali"</p>
                </div>
            )}
        </div>
    );
};

export default CitySelection;
