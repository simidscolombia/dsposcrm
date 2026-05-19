import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FaBox, FaTags, FaChartLine, FaSignOutAlt, FaRocket, FaGift, FaUsers, FaFunnelDollar, FaFileInvoiceDollar, FaTools, FaHandshake, FaHeadset, FaWhatsapp, FaBrain, FaImage, FaBars, FaTimes, FaServer } from 'react-icons/fa';

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();

    const linkClass = ({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`;

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
            {/* Mobile Header Toggle */}
            <div className="lg:hidden fixed top-4 left-4 z-[100]">
                <button 
                    onClick={toggleSidebar}
                    className="p-3 bg-slate-900 border border-slate-700 text-white rounded-xl shadow-xl hover:bg-slate-800 transition-colors"
                >
                    {isSidebarOpen ? <FaTimes /> : <FaBars />}
                </button>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div 
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-[90]
                w-64 bg-slate-900 text-white flex flex-col shadow-2xl flex-shrink-0
                transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-6 border-b border-slate-700">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <img src="/logo.png" alt="Discovery Logo" className="w-8 h-8 object-contain" />
                        <span>DSPOS CRM</span>
                    </h1>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-semibold">Discovery Systems Admin</p>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-auto custom-scrollbar">
                    {/* CRM Section */}
                    <p className="text-[10px] text-slate-500 font-bold uppercase px-4 pt-2 pb-1">CRM</p>
                    <NavLink to="/admin/dashboard" onClick={() => setIsSidebarOpen(false)} className={linkClass}>
                        <FaChartLine /> Dashboard
                    </NavLink>
                    <NavLink to="/admin/pipeline" onClick={() => setIsSidebarOpen(false)} className={linkClass}>
                        <FaFunnelDollar /> Pipeline
                    </NavLink>
                    <NavLink to="/admin/clients" onClick={() => setIsSidebarOpen(false)} className={linkClass}>
                        <FaUsers /> Clientes
                    </NavLink>
                    <NavLink to="/admin/distributors" onClick={() => setIsSidebarOpen(false)} className={linkClass}>
                        <FaHandshake /> Distribuidores
                    </NavLink>
                    <NavLink to="/admin/billing" onClick={() => setIsSidebarOpen(false)} className={linkClass}>
                        <FaFileInvoiceDollar /> Cobros
                    </NavLink>
                    <NavLink to="/admin/support" onClick={() => setIsSidebarOpen(false)} className={linkClass}>
                        <FaHeadset /> Soporte
                    </NavLink>

                    {/* Catalog Section */}
                    <p className="text-[10px] text-slate-500 font-bold uppercase px-4 pt-4 pb-1">Catálogo</p>
                    <NavLink to="/admin/categories" onClick={() => setIsSidebarOpen(false)} className={linkClass}>
                        <FaTags /> Categorías
                    </NavLink>
                    <NavLink to="/admin/products" onClick={() => setIsSidebarOpen(false)} className={linkClass}>
                        <FaBox /> Productos
                    </NavLink>
                    <NavLink to="/admin/prizes" onClick={() => setIsSidebarOpen(false)} className={linkClass}>
                        <FaGift /> Premios
                    </NavLink>

                    {/* Config Section */}
                    <p className="text-[10px] text-slate-500 font-bold uppercase px-4 pt-4 pb-1">Sistema</p>
                    <NavLink to="/admin/config" onClick={() => setIsSidebarOpen(false)} className={linkClass}>
                        <FaTools /> Configuración
                    </NavLink>
                    <NavLink to="/admin/whatsapp" onClick={() => setIsSidebarOpen(false)} className={linkClass}>
                        <FaWhatsapp /> WhatsApp
                    </NavLink>

                    {/* IA Discovery Section */}
                    <p className="text-[10px] text-slate-500 font-bold uppercase px-4 pt-4 pb-1">IA Discovery</p>
                    <NavLink to="/admin/ai" onClick={() => setIsSidebarOpen(false)} className={linkClass}>
                        <FaBrain /> Inteligencia
                    </NavLink>
                    <NavLink to="/admin/cms" onClick={() => setIsSidebarOpen(false)} className={linkClass}>
                        <FaImage /> Multimedia
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-slate-700 space-y-2">
                    <NavLink to="/configurador" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-blue-600 rounded-lg text-slate-300 hover:text-white transition-colors">
                        <FaRocket /> Ir al Wizard
                    </NavLink>
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-600 rounded-lg text-red-500 hover:text-white transition-colors"
                    >
                        <FaSignOutAlt /> Cerrar Sesión
                    </button>
                    <p className="text-center text-[10px] text-slate-500 mt-2">v2.1.0 CRM Panel</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-4 lg:p-8 relative bg-slate-50">
                <div className="lg:hidden h-14 w-full mb-4"></div>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
