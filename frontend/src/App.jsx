import React, { useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
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

    console.log("v6.0 - NEW QUOTE FLOW 🚀");

    return () => document.removeEventListener('click', playClickSound);
  }, []);

  return (
    <HashRouter>
      <Routes>
        {/* Wizard principal - todo el flujo inline */}
        <Route path="/" element={<QuotePage />} />

        {/* Client Portal */}
        <Route path="/portal/:id" element={<ClientPortal />} />

        {/* Rutas Administrativas */}
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
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
