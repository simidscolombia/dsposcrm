import React, { useState, useEffect } from 'react';
import { colombiaData } from '../../../data/colombia';
import { FaMapMarkerAlt, FaGlobeAmericas, FaChevronRight, FaArrowLeft, FaSearch } from 'react-icons/fa';

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
                // Usamos una API gratuita de IP para no pedir permiso de GPS (menos intrusivo)
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

    // Filtrar departamentos o ciudades según búsqueda
    const filteredDepts = colombiaData.filter(d =>
        d.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDeptSelect = (dept) => {
        setSelectedDept(dept);
        setSearchTerm('');
    };

    const handleBack = () => {
        setSelectedDept(null);
        setSearchTerm('');
    };

    return (
        <div className="max-w-xl mx-auto p-4 md:p-6 animate-fade-in">
            {/* Header explicativo */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-inner">
                    <FaMapMarkerAlt />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">¿Dónde te encuentras?</h2>
                <p className="text-gray-500 mt-2">Personalizaremos tu experiencia según tu ubicación.</p>
            </div>

            {/* Geodetección (Si aplica) */}
            {detectedCity && !selectedDept && (
                <div className="mb-6 animate-bounce-subtle">
                    <button
                        onClick={() => onSelect(detectedCity)}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-2xl text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <FaGlobeAmericas className="text-xl" />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] uppercase tracking-widest opacity-80">Ubicación detectada</p>
                                <p className="text-lg font-bold">{detectedCity}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 font-bold text-sm bg-white/10 px-3 py-1 rounded-full group-hover:bg-white/20">
                            Confirmar <FaChevronRight className="text-[10px]" />
                        </div>
                    </button>
                </div>
            )}

            {/* Buscador Contextual */}
            <div className="relative mb-6">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder={selectedDept ? `Buscar en ${selectedDept.department}...` : "Ej: Antioquia, Bogotá..."}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Lista Principal (Departamentos) */}
            {!selectedDept && (
                <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                        {filteredDepts.map((dept) => (
                            <button
                                key={dept.department}
                                onClick={() => handleDeptSelect(dept)}
                                className="w-full p-4 hover:bg-blue-50 border-b border-gray-50 last:border-0 flex items-center justify-between transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl grayscale group-hover:grayscale-0 transition-all">{dept.emoji}</span>
                                    <span className="font-semibold text-gray-700 group-hover:text-blue-700">{dept.department}</span>
                                </div>
                                <FaChevronRight className="text-gray-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Lista de Ciudades */}
            {selectedDept && (
                <div className="animate-fade-in">
                    <button
                        onClick={handleBack}
                        className="mb-4 flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline"
                    >
                        <FaArrowLeft /> Volver a departamentos
                    </button>

                    <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                        <div className="p-4 bg-gray-50 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                🏙️ Ciudades en {selectedDept.department}
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 max-h-[350px] overflow-y-auto custom-scrollbar">
                            {selectedDept.cities
                                .filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map((city) => (
                                    <button
                                        key={city}
                                        onClick={() => onSelect(city)}
                                        className="p-4 hover:bg-blue-50 border-b md:border-r border-gray-50 text-left flex items-center justify-between transition-colors font-medium text-gray-600 hover:text-blue-700"
                                    >
                                        {city}
                                        <FaChevronRight className="text-[10px] opacity-0 group-hover:opacity-100" />
                                    </button>
                                ))}
                        </div>
                    </div>
                </div>
            )}

            {filteredDepts.length === 0 && !selectedDept && (
                <div className="text-center py-10">
                    <div className="text-4xl mb-4">🕵️‍♂️</div>
                    <p className="text-gray-400">No encontramos ese lugar, prueba con otro nombre.</p>
                </div>
            )}
        </div>
    );
};

export default CitySelection;
