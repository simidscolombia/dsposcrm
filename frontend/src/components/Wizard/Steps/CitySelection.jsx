import React, { useState } from 'react';
import { colombiaData } from '../../../data/colombia';

const CitySelection = ({ onSelect }) => {
    const [selectedDept, setSelectedDept] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Filtrar departamentos o ciudades según búsqueda
    const filteredDepts = colombiaData.filter(d =>
        d.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDeptSelect = (dept) => {
        // Si solo tiene una ciudad (ej. Bogota DC -> Bogota), seleccionar auto
        if (dept.cities.length === 1) {
            onSelect(dept.cities[0]);
        } else {
            setSelectedDept(dept);
            setSearchTerm(''); // Limpiar búsqueda para mostrar ciudades
        }
    };

    const handleBack = () => {
        setSelectedDept(null);
        setSearchTerm('');
    };

    return (
        <div className="text-center p-6 animate-fade-in-up">
            {selectedDept && (
                <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-700">📍 {selectedDept.department}</h3>
                    <p className="text-sm text-gray-500">¿En qué municipio o ciudad te encuentras?</p>
                </div>
            )}

            {/* Buscador */}
            <div className="max-w-md mx-auto mb-6 relative">
                <span className="absolute left-3 top-3 text-gray-400">🔍</span>
                <input
                    type="text"
                    placeholder={selectedDept ? "Buscar ciudad..." : "Buscar departamento..."}
                    className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Grid de Departamentos */}
            {!selectedDept && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredDepts.map((dept) => (
                        <button
                            key={dept.department}
                            onClick={() => handleDeptSelect(dept)}
                            className="p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-400 hover:shadow-md transition-all text-left flex items-center gap-3 group"
                        >
                            <span className="text-2xl">{dept.emoji}</span>
                            <span className="font-semibold text-gray-700 group-hover:text-blue-600 text-sm flex-1">{dept.department}</span>
                            <span className="text-gray-300 text-xs">›</span>
                        </button>
                    ))}
                    {filteredDepts.length === 0 && (
                        <div className="col-span-4 text-gray-400 py-4">No se encontraron resultados</div>
                    )}
                </div>
            )}

            {/* Grid de Ciudades (Nivel 2) */}
            {selectedDept && (
                <div className="animate-fade-in">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {selectedDept.cities
                            .filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map((city) => (
                                <button
                                    key={city}
                                    onClick={() => onSelect(city)}
                                    className="p-3 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-colors text-center font-medium text-gray-600 text-sm"
                                >
                                    {city}
                                </button>
                            ))}
                    </div>

                    <button
                        onClick={handleBack}
                        className="mt-6 text-gray-400 hover:text-gray-600 underline text-sm"
                    >
                        ← Volver a Departamentos
                    </button>
                </div>
            )}
        </div>
    );
};

export default CitySelection;
