import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import QuotePage from './pages/QuotePage';
import ActionScreen from './components/PostRoulette/ActionScreen';

function App() {
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

