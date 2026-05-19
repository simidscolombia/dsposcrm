import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FaWrench, FaServer, FaDesktop, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaArrowRight, FaArrowLeft, FaMagic, FaCloudUploadAlt, FaDatabase, FaCopy, FaGlobe, FaChevronRight } from 'react-icons/fa';

export default function PublicInstallPage() {
  const { token } = useParams();
  const [validating, setValidating] = useState(true);
  const [tokenData, setTokenData] = useState(null);
  const [error, setError] = useState(null);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [isExtractingRut, setIsExtractingRut] = useState(false);

  const [formData, setFormData] = useState({
    business_name: '',
    nit: '',
    legal_representative: '',
    whatsapp: '',
    email: '',
    city: '',
    address: '',
    plan_type: 'local',
    monthly_amount: 0,
    pos_version: 'v1.0.0',
    server_name: '',
    cloud_url: '',
    anydesk_id: '',
    install_type: 'local_pc' // local_pc, local_ip, hybrid, cloud
  });

  useEffect(() => {
    const validate = async () => {
      try {
        const res = await axios.get(`/api/public/install/validate/${token}`);
        if (res.data.success) {
          setTokenData(res.data);
          setFormData(prev => ({
            ...prev,
            install_type: res.data.install_type,
            plan_type: res.data.install_type === 'cloud' ? 'cloud' : 'local'
          }));
        } else {
          setError(res.data.error || 'Token inválido');
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Error de conexión al validar el token');
      } finally {
        setValidating(false);
      }
    };
    validate();
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
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
        alert('No se pudo extraer información del RUT. Ingresa los datos manualmente.');
      }
    } catch (err) {
      console.error(err);
      alert('Error procesando el RUT con IA.');
    } finally {
      setIsExtractingRut(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await axios.post(`/api/public/install/submit/${token}`, formData);
      if (res.data.success) {
        setSuccessData(res.data.client);
      }
    } catch (err) {
      alert('Error de provisión: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4" />
        <p className="font-mono text-sm tracking-widest text-slate-400">VALIDANDO CREDENCIALES DE INSTALACIÓN...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 border border-red-500/20 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-4xl mx-auto">
            <FaExclamationTriangle />
          </div>
          <div>
            <h1 className="text-2xl font-black">Acceso Denegado</h1>
            <p className="text-slate-400 text-sm mt-2">{error}</p>
          </div>
          <div className="text-xs text-slate-500 bg-slate-900/50 p-4 rounded-xl font-mono">
            El link de instalación temporal ha caducado o ya ha sido utilizado para registrar un terminal. Solicita un nuevo link al administrador del CRM.
          </div>
          <Link to="/" className="block w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm font-bold transition">
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  if (successData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-slate-900 rounded-3xl p-8 border border-emerald-500/20 space-y-6 shadow-2xl animate-fade-in-up">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-4xl mx-auto">
            <FaCheckCircle />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black">¡Cliente Registrado con Éxito!</h1>
            <p className="text-slate-400 text-sm mt-1">El proceso de aprovisionamiento ha sido completado</p>
          </div>

          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Razón Social:</span>
              <span className="font-bold text-slate-200">{successData.business_name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">ID del Cliente (CRM):</span>
              <span className="font-mono text-blue-400 font-bold">{successData.id}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Tipo de Instalación:</span>
              <span className="uppercase font-bold text-emerald-400">{successData.install_type}</span>
            </div>
            {successData.install_type === 'cloud' ? (
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Dominio de Acceso:</span>
                <a href={`http://${successData.cloud_url}`} target="_blank" rel="noreferrer" className="text-blue-400 font-bold hover:underline flex items-center gap-1 font-mono">
                  {successData.cloud_url} <FaGlobe size={12} />
                </a>
              </div>
            ) : (
              <div className="pt-2 space-y-3">
                <p className="text-xs text-slate-400">El terminal requiere la descarga del instalador empaquetado para local:</p>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-300">Empaquetado SIMIDS Local</div>
                    <div className="text-[10px] text-slate-500 font-mono">ID: {successData.id} | Versión: {successData.pos_version}</div>
                  </div>
                  <a
                    href={`/api/clients/${successData.id}/provision/local`}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    Descargar Instalador (.zip)
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="text-center text-xs text-slate-500">
            Esta ventana puede cerrarse. El departamento técnico ha sido notificado vía CRM.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center p-4 py-12">
      <div className="max-w-2xl w-full mx-auto bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col">
        {/* Top Info Banner */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-6 flex justify-between items-center border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FaWrench className="text-blue-400 animate-spin-slow" /> Provisión Técnica
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Asistente de configuración pública para técnicos e instaladores</p>
          </div>
          <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-xs font-mono font-bold uppercase">
            {formData.install_type}
          </div>
        </div>

        {/* Step indicator */}
        <div className="bg-slate-950 h-1 w-full flex">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-full flex-1 transition-all ${s <= step ? 'bg-blue-500' : 'bg-slate-800'}`} />
          ))}
        </div>

        {/* Content */}
        <div className="p-8 flex-1 space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-purple-950/20 border border-purple-500/20 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-purple-400 flex items-center gap-1">
                    <FaMagic /> Llenado Inteligente (RUT)
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">Carga el PDF del RUT del cliente y rellenaremos los campos con IA.</p>
                </div>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleRutUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="public_rut"
                    disabled={isExtractingRut}
                  />
                  <label
                    htmlFor="public_rut"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    {isExtractingRut ? <FaSpinner className="animate-spin" /> : <FaCloudUploadAlt />} Cargar RUT
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre Negocio *</label>
                  <input name="business_name" value={formData.business_name} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-slate-200" placeholder="Nombre comercial" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">NIT</label>
                  <input name="nit" value={formData.nit} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-slate-200" placeholder="Ej. 123456789" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Representante Legal</label>
                  <input name="legal_representative" value={formData.legal_representative} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-slate-200" placeholder="Nombre completo" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">WhatsApp de Contacto *</label>
                  <input name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-slate-200" placeholder="Ej. 3123456789" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                  <input name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-slate-200" placeholder="correo@ejemplo.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ciudad</label>
                  <input name="city" value={formData.city} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-slate-200" placeholder="Ej. Cali" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Dirección del Establecimiento</label>
                  <input name="address" value={formData.address} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-slate-200" placeholder="Calle / Carrera" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {formData.install_type === 'cloud' ? (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-300 flex items-center gap-2"><FaServer /> Configuración del Servidor Cloud</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Servidor / Droplet de Asignación</label>
                      <input name="server_name" value={formData.server_name} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-slate-200" placeholder="Ej. Server1, Node03" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Dominio / URL de acceso</label>
                      <input name="cloud_url" value={formData.cloud_url} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-slate-200 font-mono" placeholder="empresa.poslatino.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Versión del POS</label>
                      <input name="pos_version" value={formData.pos_version} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-slate-200 font-mono" placeholder="v1.0.0" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-300 flex items-center gap-2"><FaDesktop /> Configuración del Terminal Local</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">AnyDesk ID de Soporte</label>
                      <input name="anydesk_id" value={formData.anydesk_id} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-slate-200" placeholder="123 456 789" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Versión del POS a compilar</label>
                      <input name="pos_version" value={formData.pos_version} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-slate-200 font-mono" placeholder="v1.0.0" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-300">Confirmación Técnica de Instalación</h3>
              <p className="text-xs text-slate-400">Verifica los datos antes de lanzar la provisión. Al guardar, el cliente quedará registrado en el CRM comercial.</p>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-3 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-800/50">
                  <span className="text-slate-500">Razón Social:</span>
                  <span className="font-bold text-slate-300">{formData.business_name}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-800/50">
                  <span className="text-slate-500">Contacto:</span>
                  <span className="text-slate-300">{formData.whatsapp}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-800/50">
                  <span className="text-slate-500">Tipo de Instalación:</span>
                  <span className="uppercase text-blue-400 font-mono font-bold">{formData.install_type}</span>
                </div>
                {formData.install_type === 'cloud' ? (
                  <>
                    <div className="flex justify-between pb-2 border-b border-slate-800/50">
                      <span className="text-slate-500">Servidor Nube:</span>
                      <span className="text-slate-300">{formData.server_name || 'Autodetect'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Dominio de acceso:</span>
                      <span className="text-blue-400 font-mono">{formData.cloud_url}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between pb-2 border-b border-slate-800/50">
                      <span className="text-slate-500">AnyDesk ID:</span>
                      <span className="text-slate-300 font-mono">{formData.anydesk_id || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Instalación Local:</span>
                      <span className="text-emerald-400">Se generará archivo instalador zip</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="bg-slate-900 p-6 border-t border-slate-800 flex justify-between items-center">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="px-5 py-2.5 border border-slate-800 hover:bg-slate-800 text-slate-400 rounded-xl text-sm font-bold flex items-center gap-1 transition">
              <FaArrowLeft /> Atrás
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={() => {
                if (step === 1 && (!formData.business_name || !formData.whatsapp)) {
                  alert('El nombre del negocio y el WhatsApp son obligatorios');
                  return;
                }
                setStep(step + 1);
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-1 transition ml-auto shadow-lg shadow-blue-500/20"
            >
              Siguiente <FaArrowRight />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center gap-1 transition ml-auto shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {submitting ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />} Registrar e Instalar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
