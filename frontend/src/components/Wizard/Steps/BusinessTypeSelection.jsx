import React, { useState } from 'react';
import {
    FaUtensils, FaHeartbeat, FaTshirt, FaSpa, FaMobileAlt,
    FaCar, FaPaw, FaHome, FaGraduationCap, FaStore,
    FaArrowLeft, FaCheck, FaSearch
} from 'react-icons/fa';

const BusinessTypeSelection = ({ onSelect }) => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [customType, setCustomType] = useState('');
    const [isCustom, setIsCustom] = useState(false);

    const categories = [
        {
            id: 'gastronomia',
            name: 'Gastronomía y Vida Nocturna',
            icon: <FaUtensils />,
            color: 'text-orange-500',
            bg: 'bg-orange-50',
            types: [
                'Restaurante de Mantel (Gourmet)',
                'Gastrobar',
                'Bar / Pub',
                'Restaurante de Comida Rápida (Fast Food)',
                'Cafetería y Repostería',
                'Food Truck (Gastronomía móvil)',
                'Discoteca / Club Nocturno',
                'Dark Kitchen (Cocinas ocultas)'
            ]
        },
        {
            id: 'salud',
            name: 'Salud, Bienestar y Deporte',
            icon: <FaHeartbeat />,
            color: 'text-green-500',
            bg: 'bg-green-50',
            types: [
                'Droguería / Farmacia',
                'Tienda Naturista',
                'Gimnasio (Gym) / Centro de Crossfit',
                'Estudio de Yoga y Pilates',
                'Centro Odontológico',
                'Óptica y Examen Visual',
                'Centro de Fisioterapia'
            ]
        },
        {
            id: 'moda',
            name: 'Moda y Complementos',
            icon: <FaTshirt />,
            color: 'text-pink-500',
            bg: 'bg-pink-50',
            types: [
                'Almacén de Ropa (Boutique)',
                'Almacén de Calzado',
                'Tienda de Accesorios y Bisutería',
                'Ropa Deportiva',
                'Marroquinería (Artículos de cuero)',
                'Tienda de Relojería y Joyas'
            ]
        },
        {
            id: 'belleza',
            name: 'Belleza y Cuidado Personal',
            icon: <FaSpa />,
            color: 'text-purple-500',
            bg: 'bg-purple-50',
            types: [
                'Salón de Belleza / Peluquería',
                'Barbería (Corte y barba)',
                'Spa y Centro de Masajes',
                'Nail Spa (Uñas y manicura)',
                'Centro de Estética',
                'Tienda de Maquillaje y Cosméticos'
            ]
        },
        {
            id: 'tecnologia',
            name: 'Tecnología y Electrónica',
            icon: <FaMobileAlt />,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
            types: [
                'Tienda de Celulares y Accesorios',
                'Centro de Computación',
                'Almacén de Electrodomésticos',
                'Servicio Técnico y Reparación',
                'Tienda de Cámaras y Fotografía',
                'Gadgets y Domótica'
            ]
        },
        {
            id: 'automotriz',
            name: 'Automotriz y Movilidad',
            icon: <FaCar />,
            color: 'text-red-500',
            bg: 'bg-red-50',
            types: [
                'Venta de Repuestos para Motos',
                'Venta de Repuestos para Carros',
                'Autolavado (Car Wash)',
                'Taller Mecánico General',
                'Llantería',
                'Centro de Diagnóstico Automotriz',
                'Compra y Venta de Vehículos'
            ]
        },
        {
            id: 'mascotas',
            name: 'Mascotas y Veterinaria',
            icon: <FaPaw />,
            color: 'text-yellow-500',
            bg: 'bg-yellow-50',
            types: [
                'Clínica Veterinaria',
                'Pet Shop',
                'Peluquería y Estética Canina',
                'Guardería y Hotel para Mascotas',
                'Acuarios y Peces'
            ]
        },
        {
            id: 'hogar',
            name: 'Hogar, Construcción y Oficios',
            icon: <FaHome />,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            types: [
                'Ferretería',
                'Tienda de Decoración y Muebles',
                'Vivero y Jardinería',
                'Almacén de Pinturas',
                'Lavandería y Tintorería',
                'Cerrajería y Sastrería'
            ]
        },
        {
            id: 'educacion',
            name: 'Educación, Papelería y Trámites',
            icon: <FaGraduationCap />,
            color: 'text-indigo-500',
            bg: 'bg-indigo-50',
            types: [
                'Papelería y Miscelánea',
                'Librería',
                'Centro de Idiomas',
                'Corresponsal Bancario y Giros',
                'Agencia de Seguros'
            ]
        }
    ];

    const handleCustomSubmit = (e) => {
        e.preventDefault();
        if (customType.trim()) {
            onSelect(customType);
        }
    };

    return (
        <div className="text-center p-6 animate-fade-in-up max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
                    {selectedCategory ? selectedCategory.name : '¿Cuál es tu industria?'}
                </h2>
                <p className="text-gray-500">
                    {selectedCategory
                        ? 'Selecciona tu tipo de negocio específico...'
                        : 'Elige la categoría que mejor describe tu negocio'}
                </p>
            </div>

            {/* Main Categories View */}
            {!selectedCategory && !isCustom && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat)}
                            className="flex flex-col items-center p-5 border-2 border-gray-100 rounded-xl hover:border-indigo-500 hover:shadow-lg transition-all group bg-white"
                        >
                            <div className={`text-3xl mb-3 p-3 rounded-full ${cat.bg} ${cat.color} group-hover:scale-110 transition-transform`}>
                                {cat.icon}
                            </div>
                            <span className="font-semibold text-gray-700 text-sm md:text-base group-hover:text-indigo-600">
                                {cat.name}
                            </span>
                        </button>
                    ))}

                    {/* Other / Custom Option */}
                    <button
                        onClick={() => setIsCustom(true)}
                        className="flex flex-col items-center p-5 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-500 hover:bg-gray-50 transition-all group"
                    >
                        <div className="text-3xl mb-3 p-3 text-gray-400 group-hover:scale-110 transition-transform">
                            <FaSearch />
                        </div>
                        <span className="font-semibold text-gray-500 text-sm md:text-base group-hover:text-gray-700">
                            Otro / No está en la lista
                        </span>
                    </button>
                </div>
            )}

            {/* Subcategories View */}
            {selectedCategory && (
                <div className="animate-fade-in">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className="mb-6 flex items-center text-gray-500 hover:text-indigo-600 transition font-medium"
                    >
                        <FaArrowLeft className="mr-2" /> Volver a categorías
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {selectedCategory.types.map((type, idx) => (
                            <button
                                key={idx}
                                onClick={() => onSelect(type)}
                                className="p-4 text-left border rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-between group bg-white shadow-sm"
                            >
                                <span className="font-medium text-gray-700 group-hover:text-indigo-700">{type}</span>
                                <FaCheck className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <p className="text-sm text-gray-500 mb-3">¿No ves tu tipo de negocio exacto?</p>
                        <button
                            onClick={() => { setSelectedCategory(null); setIsCustom(true); }}
                            className="text-indigo-600 font-medium hover:underline flex items-center justify-center mx-auto"
                        >
                            <FaStore className="mr-2" /> Escribir manualmente
                        </button>
                    </div>
                </div>
            )}

            {/* Custom Input View */}
            {isCustom && (
                <div className="animate-fade-in max-w-md mx-auto">
                    <button
                        onClick={() => setIsCustom(false)}
                        className="mb-6 flex items-center text-gray-500 hover:text-indigo-600 transition font-medium"
                    >
                        <FaArrowLeft className="mr-2" /> Volver
                    </button>

                    <form onSubmit={handleCustomSubmit} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                        <div className="mb-6">
                            <label className="block text-left text-sm font-medium text-gray-700 mb-2">
                                Describe tu tipo de negocio
                            </label>
                            <input
                                type="text"
                                value={customType}
                                onChange={(e) => setCustomType(e.target.value)}
                                placeholder="Ej: Tienda de Comics, Taller de Arte..."
                                className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 text-lg"
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!customType.trim()}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold hover:shadow-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Continuar
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default BusinessTypeSelection;
