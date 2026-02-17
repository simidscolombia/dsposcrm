import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FaBox, FaTags, FaChartLine, FaSignOutAlt, FaRocket } from 'react-icons/fa';

const AdminLayout = () => {
    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl">
                <div className="p-6 border-b border-slate-700">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <FaRocket className="text-yellow-400" />
                        <span>DSPOS Admin</span>
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <NavLink
                        to="/admin/dashboard"
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <FaChartLine /> Dashboard
                    </NavLink>

                    <NavLink
                        to="/admin/categories"
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <FaTags /> Categorías
                    </NavLink>

                    <NavLink
                        to="/admin/products"
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <FaBox /> Productos
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-600 rounded-lg text-slate-300 hover:text-white transition-colors">
                        <FaSignOutAlt /> Salir
                    </button>
                    <p className="text-center text-xs text-slate-500 mt-4">v1.0.0 Admin Panel</p>
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
