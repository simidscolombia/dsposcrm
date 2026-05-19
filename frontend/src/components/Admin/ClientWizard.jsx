import React, { useState } from 'react';
import { FaUser, FaGlobe, FaDesktop, FaServer, FaWrench, FaCheck, FaBuilding, FaPhone, FaArrowRight, FaArrowLeft, FaTimesCircle, FaMagic, FaCloudUploadAlt, FaSpinner } from 'react-icons/fa';
import axios from 'axios';

export default function ClientWizard({ isOpen, onClose, distributors, advisors, onSave }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isExtractingRut, setIsExtractingRut] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    nit: '',
    legal_representative: '',
    whatsapp: '',
    email: '',
    city: '',
    address: '',
    plan_type: 'local', // local, cloud, cloud_fe
    install_type: 'local_pc', // local_pc, local_ip, hybrid, cloud
    monthly_amount: 0,
    anydesk_id: '',
    cloud_url: '',
    server_name: '',
    pos_version: 'v1.0.0',
    distributor_id: '',
    technician_id: '',
    is_active: true
  });

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-generate subdomain if business name changes and cloud is selected
      if (name === 'business_name' && !prev.cloud_url) {
        const cleanName = value.toLowerCase().replace(/[^a-z0-9]/g, '');
        updated.cloud_url = cleanName ? `${cleanName}.poslatino.com` : '';
      }
      return updated;
    });
  };

  const handleRutUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Por favor selecciona un archivo PDF original del RUT.');
      return;
    }

    setIsExtractingRut(true);
    const fd = new FormData();
    fd.append('rut', file);

    try {
      const res = await axios.post('/api/pdf/extract-rut', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.success && res.data.data) {
        const info = res.data.data;
        setFormData(prev => ({
          ...prev,
          business_name: info.businessName || prev.business_name,
          nit: info.nit || prev.nit,
          legal_representative: info.repLegal || prev.legal_representative,
          email: info.email || prev.email,
          city: info.city || prev.city,
          address: info.address || prev.address,
          whatsapp: info.phone || prev.whatsapp
        }));
        alert('🚀 IA completó los datos del cliente desde el RUT.');
      } else {
        alert('No se pudo extraer información estructurada del RUT. Ingresa los datos manualmente.');
      }
    } catch (err) {
      console.error(err);
      alert('Error procesando el RUT con IA.');
    } finally {
      setIsExtractingRut(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.business_name || !formData.whatsapp) {
        alert('El nombre del negocio y el WhatsApp son obligatorios');
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setStep(prev => prev - 1);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (e) {
      alert('Error guardando cliente: ' + e.message);
    }
    setLoading(false);
  };

  const selectInstallType = (type) => {
    setFormData(prev => ({
      ...prev,
      install_type: type,
      plan_type: type === 'cloud' ? 'cloud' : 'local'
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FaWrench className="text-blue-400" /> Asistente de Provisión de Clientes
            </h2>
            <p className="text-slate-400 text-xs mt-1">Configura e instala el cliente de forma guiada</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <FaTimesCircle size={24} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="bg-slate-100 h-1.5 w-full flex">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`h-full flex-1 transition-all duration-300 ${
                s <= step ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: CLIENT DATA */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-purple-800 flex items-center gap-1">
                    <FaMagic /> Auto-llenado con IA
                  </h4>
                  <p className="text-xs text-purple-600">Carga el PDF del RUT de tu cliente y la IA completará los campos.</p>
                </div>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleRutUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="wizard_rut"
                    disabled={isExtractingRut}
                  />
                  <label
                    htmlFor="wizard_rut"
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center gap-2 text-xs font-bold shadow-sm transition cursor-pointer"
                  >
                    {isExtractingRut ? <FaSpinner className="animate-spin" /> : <FaCloudUploadAlt />} Subir RUT
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre Negocio *</label>
                  <input name="business_name" value={formData.business_name} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-xl text-sm" placeholder="Ej. Burger Grill" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">NIT</label>
                  <input name="nit" value={formData.nit} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-xl text-sm" placeholder="Ej. 123456789-0" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Representante Legal</label>
                  <input name="legal_representative" value={formData.legal_representative} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-xl text-sm" placeholder="Nombre completo" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">WhatsApp / Contacto *</label>
                  <input name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-xl text-sm" placeholder="Ej. 3123456789" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Correo Electrónico</label>
                  <input name="email" value={formData.email} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-xl text-sm" placeholder="correo@ejemplo.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Ciudad</label>
                  <input name="city" value={formData.city} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-xl text-sm" placeholder="Ej. Bogotá" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Dirección Física</label>
                  <input name="address" value={formData.address} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-xl text-sm" placeholder="Calle/Carrera y número" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: INSTALLATION TYPE */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-center font-bold text-gray-700 text-lg">¿Cómo se instalará el sistema para este cliente?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => selectInstallType('cloud')}
                  className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-4 ${
                    formData.install_type === 'cloud'
                      ? 'border-blue-600 bg-blue-50/50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 text-2xl">
                    <FaGlobe />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-800 text-lg">Instalación Nube (SaaS)</h4>
                    <p className="text-xs text-gray-500 mt-1">El POS corre en nuestro servidor DigitalOcean de forma centralizada con base de datos en MongoDB Atlas.</p>
                  </div>
                </div>

                <div
                  onClick={() => selectInstallType('local_pc')}
                  className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-4 ${
                    formData.install_type !== 'cloud'
                      ? 'border-blue-600 bg-blue-50/50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 text-2xl">
                    <FaDesktop />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-800 text-lg">Instalación Local (Fijo/Híbrido)</h4>
                    <p className="text-xs text-gray-500 mt-1">El POS se instala localmente en la computadora física del cliente para trabajar offline o red local.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: TECHNICAL CONFIG */}
          {step === 3 && (
            <div className="space-y-4">
              {formData.install_type === 'cloud' ? (
                // NUBE TECH CONFIG
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-700">Parámetros de Servidor Cloud</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre Servidor (Droplet)</label>
                      <input name="server_name" value={formData.server_name} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-xl text-sm" placeholder="Ej. Server1, NY-01" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Subdominio de Acceso</label>
                      <input name="cloud_url" value={formData.cloud_url} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-xl text-sm font-mono" placeholder="empresa.poslatino.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Versión POS</label>
                      <input name="pos_version" value={formData.pos_version} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-xl text-sm font-mono" placeholder="v1.0.0" />
                    </div>
                  </div>
                </div>
              ) : (
                // LOCAL TECH CONFIG (3 subtypes)
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Subtipo de instalación Local</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { type: 'local_pc', label: '💻 Solo este PC', desc: 'localhost' },
                        { type: 'local_ip', label: '🌐 Red Local (IP)', desc: '0.0.0.0' },
                        { type: 'hybrid', label: '🔄 Híbrido Sync', desc: 'Sync a Nube' }
                      ].map(sub => (
                        <div
                          key={sub.type}
                          onClick={() => selectInstallType(sub.type)}
                          className={`p-3 rounded-xl border cursor-pointer text-center transition-all ${
                            formData.install_type === sub.type
                              ? 'border-blue-600 bg-blue-50/30 font-bold text-blue-700'
                              : 'border-gray-200 hover:border-blue-300 text-gray-600'
                          }`}
                        >
                          <div className="text-xs">{sub.label}</div>
                          <div className="text-[9px] opacity-60 mt-0.5">{sub.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">AnyDesk ID</label>
                      <input name="anydesk_id" value={formData.anydesk_id} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-xl text-sm" placeholder="123 456 789" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Versión POS a empaquetar</label>
                      <input name="pos_version" value={formData.pos_version} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-xl text-sm font-mono" placeholder="v1.0.0" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: ASSIGNMENT & SUMMARY */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-700">Asignación Comercial & Cobros</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Distribuidor / Propietario</label>
                  <select name="distributor_id" value={formData.distributor_id} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-white">
                    <option value="">Directo (Discovery)</option>
                    {distributors.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.city})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Técnico A Cargo</label>
                  <select name="technician_id" value={formData.technician_id} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-white">
                    <option value="">Sin técnico asignado</option>
                    {advisors.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Mensualidad Pactada ($COP)</label>
                  <input type="number" name="monthly_amount" value={formData.monthly_amount} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-xl text-sm" placeholder="Valor mensual" />
                </div>
              </div>

              <div className="bg-slate-50 border border-gray-100 rounded-2xl p-4 mt-6">
                <h4 className="font-bold text-xs uppercase text-gray-400 tracking-wider mb-2">Resumen de Provisión</h4>
                <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                  <div className="text-gray-500">Negocio:</div>
                  <div className="text-gray-800 font-bold">{formData.business_name}</div>
                  <div className="text-gray-500">Contacto:</div>
                  <div className="text-gray-800">{formData.whatsapp}</div>
                  <div className="text-gray-500">Tipo Instalación:</div>
                  <div className="text-blue-600 font-bold uppercase">{formData.install_type}</div>
                  {formData.install_type === 'cloud' ? (
                    <>
                      <div className="text-gray-500">Droplet Servidor:</div>
                      <div className="text-gray-800">{formData.server_name || 'Autodetect'}</div>
                      <div className="text-gray-500 font-bold">Subdominio:</div>
                      <div className="text-blue-600 font-mono font-bold">{formData.cloud_url}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-gray-500">AnyDesk ID:</div>
                      <div className="text-gray-800">{formData.anydesk_id || 'N/A'}</div>
                      <div className="text-gray-500">Instalación local:</div>
                      <div className="text-gray-800">Se compilará archivo instalador (.zip)</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-gray-100 flex justify-between items-center">
          {step > 1 ? (
            <button onClick={handlePrev} className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-600 rounded-xl font-bold flex items-center gap-2 text-sm transition">
              <FaArrowLeft /> Atrás
            </button>
          ) : <div />}

          {step < 4 ? (
            <button onClick={handleNext} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 text-sm shadow-md transition ml-auto">
              Siguiente <FaArrowRight />
            </button>
          ) : (
            <button onClick={handleSave} disabled={loading} className="px-8 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 text-sm shadow-md transition ml-auto disabled:opacity-50">
              {loading ? <FaSpinner className="animate-spin" /> : <FaCheck />} Guardar e Instalar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
