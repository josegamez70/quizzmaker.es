import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CancelPage: React.FC = () => {
  const navigate = useNavigate();

  // Redirige automáticamente tras 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000); // 5 segundos

    return () => clearTimeout(timer); // limpia si el componente se desmonta
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-red-400 mb-4">Pago cancelado</h1>
      <p className="text-lg text-gray-300 mb-6">
        No se ha completado el proceso de compra.
        <br />
        Serás redirigido al inicio en unos segundos...
      </p>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded text-white font-semibold"
      >
        Volver al Inicio
      </button>
    </div>
  );
};

export default CancelPage;
