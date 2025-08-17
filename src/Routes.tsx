import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { App } from './App';
import SuccessPage from './routes/success';
import CancelPage from './routes/cancel';

const RoutesApp = () => {
  return (
    <Router>
      <Suspense fallback={<div className="text-white p-8">Cargando...</div>}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/cancel" element={<CancelPage />} />
          <Route path="*" element={<div className="text-white p-8">Página no encontrada</div>} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default RoutesApp;
