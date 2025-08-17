import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SuccessView = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/'); // Redirigir al inicio tras 5 segundos
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center p-4">
      <h1 className="text-3xl font-bold mb-4">✅ ¡Gracias por tu compra!</h1>
      <p className="text-lg">Tu suscripción se ha activado correctamente.</p>
      <p className="mt-2 text-sm text-gray-400">Redirigiendo a inicio...</p>
    </div>
  );
};

export default SuccessView;
