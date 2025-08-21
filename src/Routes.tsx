// src/Routes.tsx
// Este archivo probablemente ya existe si estás usando un enrutador como react-router-dom
// Si no existe, deberás crear algo similar e integrarlo en index.tsx

import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { App } from './App.tsx'; // Tu componente principal que maneja la sesión general
import Loader from './components/Loader.tsx'; // Asumiendo que tienes un Loader

// Importa lazy para UpdatePasswordView si aún no lo está
const UpdatePasswordView = lazy(() => import('./components/UpdatePasswordView.tsx'));

const RoutesApp: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center"><Loader text="Cargando..." /></div>}>
        <Routes>
          {/* Ruta principal para la aplicación general (login o main app) */}
          <Route path="/" element={<App />} />

          {/* NUEVA RUTA: Para el restablecimiento de contraseña */}
          {/* Cuando Supabase redirija a /update-password, este componente se encargará. */}
          {/* La función onPasswordUpdated ahora solo necesita redirigir a la raíz (login). */}
          <Route
            path="/update-password"
            element={
              <UpdatePasswordView
                onPasswordUpdated={() => {
                  // Después de actualizar la contraseña, limpia la URL y redirige a la página principal (que mostrará AuthView)
                  window.location.href = '/';
                }}
              />
            }
          />

          {/* Opcional: Ruta para política de privacidad si quieres una URL dedicada */}
          {/* <Route path="/privacy-policy" element={<PrivacyPolicyView onGoBack={() => window.history.back()} />} /> */}

          {/* Redirigir cualquier otra ruta desconocida a la raíz */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default RoutesApp;