// src/components/FreeAttemptsExceededView.tsx
import React from 'react';
import { CreditCardIcon } from './icons.tsx'; // Asumo que tienes un icono para tarjetas de crédito o similar

interface FreeAttemptsExceededViewProps {
  onGoPro: () => void; // Función para redirigir a Stripe
  onGoHome: () => void; // Función para volver a la pantalla principal (opcional, pero buena UX)
}

const FreeAttemptsExceededView: React.FC<FreeAttemptsExceededViewProps> = ({ onGoPro, onGoHome }) => {
  return (
    <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl max-w-md mx-auto">
      <CreditCardIcon className="w-20 h-20 text-red-500 mx-auto mb-6" />
      <h2 className="text-3xl font-bold text-red-400 mb-4">¡Intentos Gratuitos Agotados!</h2>
      <p className="text-gray-300 text-lg mb-6">
        Has agotado los 4 intentos gratuitos para generar cuestionarios. Para un uso ilimitado y acceder a todas las funciones, hazte Pro.
      </p>
      <div className="flex flex-col gap-4">
        <button
          onClick={onGoPro}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-colors duration-300 transform hover:scale-105"
        >
          🚀 Hazte Pro ahora
        </button>
        <button
          onClick={onGoHome}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold rounded-lg shadow-sm transition-colors duration-300"
        >
          Volver a Inicio
        </button>
      </div>
    </div>
  );
};

export default FreeAttemptsExceededView;