import React from 'react';
import { FaLaptop, FaDesktop, FaServer } from 'react-icons/fa';

const SystemTypeSelection = ({ onSelect }) => {
    const options = [
        {
            id: 'Software',
            name: 'Solo Software',
            desc: 'Ya tengo equipos, solo necesito el sistema',
            icon: <FaServer className="text-blue-500" />,
            color: 'blue'
        },
        {
            id: 'Combo',
            name: 'Combo Completo',
            desc: 'Necesito computadores, impresoras y software',
            icon: <FaDesktop className="text-green-500" />,
            color: 'green'
        },
        {
            id: 'Mix',
            name: 'Software + Algunos Equipos',
            desc: 'Tengo algunas cosas pero me faltan otras',
            icon: <FaLaptop className="text-orange-500" />,
            color: 'orange'
        }
    ];

    return (
        <div className="text-center p-6">

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {options.map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => onSelect(opt.id)}
                        className={`flex flex-col items-center p-6 md:p-8 bg-white border-2 border-gray-100 rounded-2xl hover:border-${opt.color}-500 hover:shadow-xl transition-all duration-300 transform md:hover:-translate-y-2 group h-full`}
                    >
                        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-${opt.color}-50 flex items-center justify-center mb-4 md:mb-6 group-hover:bg-${opt.color}-100 transition-colors`}>
                            <span className="text-3xl md:text-4xl">{opt.icon}</span>
                        </div>
                        <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2 md:mb-3 group-hover:text-${opt.color}-600">
                            {opt.name}
                        </h3>
                        <p className="text-gray-500 text-xs md:text-sm leading-relaxed">
                            {opt.desc}
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SystemTypeSelection;
