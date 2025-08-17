import React from 'react';
import ReactDOM from 'react-dom/client';
import RoutesApp from './Routes'; // Importa el enrutador principal
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("No se pudo encontrar el elemento raíz para montar la aplicación.");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <RoutesApp />
  </React.StrictMode>
);
