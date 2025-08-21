import React, { useState } from 'react';
import { supabase } from '../supabaseClient.ts';
import { LightbulbIcon, EyeIcon, EyeOffIcon, MailIcon, XCircleIcon } from './icons.tsx';

interface UpdatePasswordViewProps {
  onPasswordUpdated: () => void;
}

const UpdatePasswordView: React.FC<UpdatePasswordViewProps> = ({ onPasswordUpdated }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage('¡Contraseña actualizada con éxito! En breve serás redirigido para iniciar sesión.');

      setTimeout(() => {
        onPasswordUpdated(); // tu App.tsx fuerza logout aquí
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar la contraseña.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-2xl shadow-2xl">
        <div className="text-center">
          <LightbulbIcon className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-purple-400">
            Establecer Nueva Contraseña
          </h1>
          <p className="mt-2 text-gray-400">Ingresa tu nueva contraseña a continuación.</p>
        </div>

        <form className="space-y-6" onSubmit={handleUpdatePassword}>
          <div className="relative">
            <label htmlFor="new-password" className="sr-only">Nueva Contraseña</label>
            <input
              id="new-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              className="appearance-none rounded-md block w-full px-3 py-3 border border-gray-700 bg-gray-900 placeholder-gray-500 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm pr-10"
              placeholder="Nueva Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 z-20 flex items-center px-3 text-gray-400 hover:text-white"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>

          <div className="space-y-3">
            {error && (
              <div className="bg-red-900/50 border border-red-500/30 p-3 rounded-md flex items-center gap-3 text-sm text-red-300">
                <XCircleIcon className="h-5 w-5 flex-shrink-0" />
                <span className="flex-grow">{error}</span>
              </div>
            )}
            {message && (
              <div className="bg-green-900/50 border border-green-500/30 p-3 rounded-md flex items-center gap-3 text-sm text-green-300">
                <MailIcon className="h-5 w-5 flex-shrink-0" />
                <span className="flex-grow">{message}</span>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:bg-gray-500"
            >
              {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </div>
        </form>

        <footer className="text-center text-gray-500 text-sm pt-2">
          <p>&copy; 2024 J M GAMEZ</p>
        </footer>
      </div>
    </div>
  );
};

export default UpdatePasswordView;
