import React from 'react';

const AdminCloudLegacy = () => {
    return (
        <div className="h-full flex flex-col">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Cloud Legacy Admin</h1>
                    <p className="text-slate-500 text-sm">Panel de administración de nubes en producción</p>
                </div>
                <a 
                    href="https://legacy.simids.app" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs text-blue-500 hover:text-blue-700 underline"
                >
                    Abrir en nueva pestaña ↗
                </a>
            </div>
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[80vh]">
                <iframe 
                    src="https://legacy.simids.app" 
                    title="Administrador de Nubes Legacy"
                    className="w-full h-full border-0"
                    allow="same-origin"
                />
            </div>
        </div>
    );
};

export default AdminCloudLegacy;
