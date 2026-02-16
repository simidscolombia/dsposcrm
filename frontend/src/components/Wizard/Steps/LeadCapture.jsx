import React, { useState } from 'react';

const LeadCapture = ({ onComplete }) => {
    const [formData, setFormData] = useState({
        name: '',
        whatsapp: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.name && formData.whatsapp) {
            onComplete(formData);
        }
    };

    return (
        <div className="max-w-md mx-auto p-8 bg-white rounded-2xl shadow-2xl animate-fade-in-up">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 animate-bounce">
                    🎁
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    ¡Tu Premio está listo!
                </h2>
                <p className="text-gray-600">
                    Ingresa tus datos para enviarte la cotización detallada y activar tu beneficio exclusivo.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">Tu Nombre Completo</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                        placeholder="Ej. María Rodríguez"
                        required
                    />
                </div>

                <div>
                    <label className="block text-gray-700 font-semibold mb-2 text-sm">WhatsApp (para enviarte el PDF)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-3.5 text-gray-400">📱</span>
                        <input
                            type="tel"
                            name="whatsapp"
                            value={formData.whatsapp}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ej. 300 123 4567"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-green-600 text-white font-bold py-4 rounded-lg hover:bg-green-700 transition duration-300 shadow-lg transform hover:scale-[1.02]"
                >
                    Reclamar Premio y Ver Cotización 🚀
                </button>

                <p className="text-xs text-center text-gray-400 mt-4">
                    Tus datos están protegidos. Solo te contactaremos para entregarte tu cotización.
                </p>
            </form>
        </div>
    );
};

export default LeadCapture;
