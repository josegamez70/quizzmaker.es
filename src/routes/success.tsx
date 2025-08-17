import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SuccessPage: React.FC = () => {
  const navigate = useNavigate();

  // Redirige automáticamente tras 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000); // 5000ms = 5 segundos

    return () => clearTimeout(timer); // limpia el temporizador si el componente se desmonta
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-green-400 mb-4">¡Gracias por tu compra!</h1>
      <p className="text-lg text-gray-300 mb-6">
        Tu cuenta ahora tiene acceso ilimitado como usuario Pro.
        <br />
        Serás redirigido al inicio automáticamente...
      </p>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-semibold"
      >
        Volver al Inicio
      </button>
    </div>
  );
};

export default SuccessPage;
