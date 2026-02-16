import React, { useState } from 'react';

const NameCapture = ({ onNext }) => {
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
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
    if (formData.name && formData.businessName) {
      onNext(formData);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-10">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
        🚀 Descubre el POS ideal para tu negocio
      </h2>
      <p className="text-center text-gray-600 mb-8">
        Completa tus datos para iniciar el análisis personalizado con IA y obtener tu cotización.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Tu Nombre</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Ej. Juan Pérez"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">Nombre del Negocio</label>
          <input
            type="text"
            name="businessName"
            value={formData.businessName}
            onChange={handleChange}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Ej. Restaurante El Sabor"
            required
          />
        </div>

        <div>
           <label className="block text-gray-700 font-semibold mb-2">WhatsApp (Opcional)</label>
           <input
            type="tel"
            name="whatsapp"
            value={formData.whatsapp}
            onChange={handleChange}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Ej. 3001234567"
           />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105"
        >
          Iniciar Análisis con IA ✨
        </button>
      </form>
    </div>
  );
};

export default NameCapture;
