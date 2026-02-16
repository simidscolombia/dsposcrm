import React, { useState } from 'react';
import { FaCheckSquare, FaSquare } from 'react-icons/fa';

const HardwareChecklist = ({ onSelect }) => {
    const [selectedItems, setSelectedItems] = useState([]);

    const items = [
        { id: 'computador', label: 'Computador / Portátil' },
        { id: 'impresora', label: 'Impresora de Recibos' },
        { id: 'cajon', label: 'Cajón Monedero' },
        { id: 'lector', label: 'Lector de Códigos' },
        { id: 'balanza', label: 'Balanza / Pesa' },
        { id: 'tablet', label: 'Tablet / Celular pedidor' },
    ];

    const toggleItem = (id) => {
        if (selectedItems.includes(id)) {
            setSelectedItems(selectedItems.filter(item => item !== id));
        } else {
            setSelectedItems([...selectedItems, id]);
        }
    };

    const handleContinue = () => {
        onSelect(selectedItems);
    };

    return (
        <div className="text-center p-6 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
                ¿Qué equipos TIENES actualmente?
            </h2>
            <p className="text-gray-500 mb-8">Marca los equipos que YA tienes y funcionan bien.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {items.map((item) => {
                    const isSelected = selectedItems.includes(item.id);
                    return (
                        <div
                            key={item.id}
                            onClick={() => toggleItem(item.id)}
                            className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${isSelected
                                    ? 'border-green-500 bg-green-50 shadow-md'
                                    : 'border-gray-200 hover:border-blue-300 bg-white'
                                }`}
                        >
                            <div className={`text-2xl mr-4 ${isSelected ? 'text-green-600' : 'text-gray-300'}`}>
                                {isSelected ? <FaCheckSquare /> : <FaSquare />}
                            </div>
                            <span className={`font-semibold ${isSelected ? 'text-green-800' : 'text-gray-600'}`}>
                                {item.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all transform"
            >
                Continuar y Ver Resultado ✨
            </button>
        </div>
    );
};

export default HardwareChecklist;
