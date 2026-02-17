import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import QuotePage from './pages/QuotePage';
import ActionScreen from './components/PostRoulette/ActionScreen';

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

    console.log("v4.5 - MERCADOLIBRE DEPLOY 🛍️ - FORCE UPDATE");

    return () => document.removeEventListener('click', playClickSound);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<QuotePage />} />
        <Route path="/resultado" element={<ActionScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

