
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FaBox, FaTags, FaChartLine, FaSignOutAlt, FaRocket, FaGift, FaUsers, FaFunnelDollar, FaFileInvoiceDollar, FaCog, FaHandshake, FaHeadset, FaWhatsapp, FaBrain, FaImage } from 'react-icons/fa';

const AdminLayout = () => {
    const linkClass = ({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`;

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl flex-shrink-0">
                <div className="p-6 border-b border-slate-700">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <img src="/logo.png" alt="Discovery Logo" className="w-8 h-8 object-contain" />
                        <span>DSPOS CRM</span>
                    </h1>
                    <p className="text-[10px] text-slate-500 mt-1">Discovery Systems Admin</p>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-auto">
                    {/* CRM Section */}
                    <p className="text-[10px] text-slate-500 font-bold uppercase px-4 pt-2 pb-1">CRM</p>
                    <NavLink to="/admin/dashboard" className={linkClass}>
                        <FaChartLine /> Dashboard
                    </NavLink>
                    <NavLink to="/admin/pipeline" className={linkClass}>
                        <FaFunnelDollar /> Pipeline
                    </NavLink>
                    <NavLink to="/admin/clients" className={linkClass}>
                        <FaUsers /> Clientes
                    </NavLink>
                    <NavLink to="/admin/distributors" className={linkClass}>
                        <FaHandshake /> Distribuidores
                    </NavLink>
                    <NavLink to="/admin/billing" className={linkClass}>
                        <FaFileInvoiceDollar /> Cobros
                    </NavLink>
                    <NavLink to="/admin/support" className={linkClass}>
                        <FaHeadset /> Soporte
                    </NavLink>

                    {/* Catalog Section */}
                    <p className="text-[10px] text-slate-500 font-bold uppercase px-4 pt-4 pb-1">Catálogo</p>
                    <NavLink to="/admin/categories" className={linkClass}>
                        <FaTags /> Categorías
                    </NavLink>
                    <NavLink to="/admin/products" className={linkClass}>
                        <FaBox /> Productos
                    </NavLink>
                    <NavLink to="/admin/prizes" className={linkClass}>
                        <FaGift /> Premios
                    </NavLink>

                    {/* Config Section */}
                    <p className="text-[10px] text-slate-500 font-bold uppercase px-4 pt-4 pb-1">Sistema</p>
                    <NavLink to="/admin/config" className={linkClass}>
                        <FaCog /> Configuración
                    </NavLink>
                    <NavLink to="/admin/whatsapp" className={linkClass}>
                        <FaWhatsapp /> WhatsApp
                    </NavLink>

                    {/* IA Discovery Section */}
                    <p className="text-[10px] text-slate-500 font-bold uppercase px-4 pt-4 pb-1">IA Discovery</p>
                    <NavLink to="/admin/ai" className={linkClass}>
                        <FaBrain /> Inteligencia
                    </NavLink>
                    <NavLink to="/admin/cms" className={linkClass}>
                        <FaImage /> Multimedia
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <NavLink to="/configurador" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-blue-600 rounded-lg text-slate-300 hover:text-white transition-colors">
                        <FaSignOutAlt /> Ir al Wizard
                    </NavLink>
                    <p className="text-center text-xs text-slate-500 mt-4">v2.0.0 CRM Panel</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8 relative">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
