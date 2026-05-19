import React, { useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import QuotePage from './pages/QuotePage';
import ClientPortal from './pages/ClientPortal';
// Admin Imports
import AdminLayout from './components/Admin/Layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCategories from './pages/admin/AdminCategories';
import AdminProducts from './pages/admin/AdminProducts';
import AdminPrizes from './pages/admin/AdminPrizes';
// CRM Imports
import CRMPipeline from './pages/admin/CRMPipeline';
import CRMClients from './pages/admin/CRMClients';
import CRMBilling from './pages/admin/CRMBilling';
import CRMDistributors from './pages/admin/CRMDistributors';
import CRMSupport from './pages/admin/CRMSupport';
import AdminWhatsApp from './pages/admin/AdminWhatsApp';
import AdminAI from './pages/admin/AdminAI';
import AdminCMS from './pages/admin/AdminCMS';
import AdminDesign from './pages/admin/AdminDesign';
import LoginPage from './pages/admin/LoginPage';
import PublicInstallPage from './pages/PublicInstallPage';
import ProtectedRoute from './components/Auth/ProtectedRoute';

function App() {
  // Global Click Sound Effect
  const audioCtxRef = useRef(null);

  useEffect(() => {
    // Initialize Audio Context on first interaction
    const initAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
    };

    const playClickSound = (e) => {
      // Check if target is clickable (button, link, or inside one)
      const target = e.target.closest('button, a, input[type="button"], [role="button"]');

      if (target) {
        initAudio(); // Ensure context exists
        if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();

        const ctx = audioCtxRef.current;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Sound Profile: Short high-pitch 'pop' (UI Click)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);

        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.08);
      }
    };

    document.addEventListener('click', playClickSound);

    console.log("v6.7 - SYMBOLIC REBUILD 🚀");

    return () => document.removeEventListener('click', playClickSound);
  }, []);

  return (
    <HashRouter>
      <div className="relative min-h-screen bg-gray-50 flex flex-col">
        {/* Banner de Versión Persistente */}
        <div className="bg-[#1c242e] text-[#A8E0F0] text-[10px] py-1 px-4 flex justify-between items-center z-[200] border-b border-blue-500/20 font-mono tracking-widest uppercase">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span>Discovery Systems POS v6.7</span>
            </div>
            <Link to="/admin" className="bg-blue-500/10 hover:bg-blue-500/20 text-[#A8E0F0] px-2 py-0.5 rounded border border-blue-500/30 transition-all flex items-center gap-1 group">
              <span className="opacity-70 group-hover:opacity-100">🔐</span>
              <span>Ingresar</span>
            </Link>
          </div>
          <div className="hidden md:block">Cloud Sync • Supabase Ready • Node 16 Stable</div>
        </div>

        <div className="flex-1">
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/" element={<HomePage />} />
            <Route path="/configurador" element={<QuotePage />} />
            <Route path="/portal/:id" element={<ClientPortal />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/instalar/:token" element={<PublicInstallPage />} />

            {/* Rutas Administrativas Protegidas */}
            <Route element={<ProtectedRoute redirectPath="/login" />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="prizes" element={<AdminPrizes />} />
                <Route path="pipeline" element={<CRMPipeline />} />
                <Route path="clients" element={<CRMClients />} />
                <Route path="distributors" element={<CRMDistributors />} />
                <Route path="billing" element={<CRMBilling />} />
                <Route path="support" element={<CRMSupport />} />
                <Route path="whatsapp" element={<AdminWhatsApp />} />
                <Route path="ai" element={<AdminAI />} />
                <Route path="cms" element={<AdminCMS />} />
                <Route path="design" element={<AdminDesign />} />
              </Route>
            </Route>
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
}

export default App;
