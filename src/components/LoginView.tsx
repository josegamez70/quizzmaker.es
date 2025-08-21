// src/components/LoginView.tsx

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { supabase } from '../supabaseClient.ts';
import { LightbulbIcon, EyeIcon, EyeOffIcon, MailIcon, XCircleIcon, InformationCircleIcon } from './icons.tsx';
import Loader from './Loader.tsx';

const PrivacyPolicyView = lazy(() => import('./PrivacyPolicyView.tsx'));

const isRateLimitError = (error: any): boolean => {
    if (error?.status === 429) return true;
    if (typeof error?.message === 'string' && error.message.toLowerCase().includes('rate limit exceeded')) return true;
    return false;
}

const ConfigHelp = () => (
    <div className="bg-yellow-900/50 border border-yellow-500/30 p-4 rounded-md text-sm text-yellow-200 space-y-2 mt-4">
      <p className="font-bold flex items-center gap-2"><InformationCircleIcon className="w-5 h-5"/> Guía de Configuración de Email</p>
      <p>
        Los problemas con el envío de correos (confirmación, reseteo de clave) casi siempre se deben a una configuración incorrecta en tu panel de Supabase.
      </p>
      <ol className="list-decimal list-inside space-y-1 pl-2 font-mono text-xs bg-gray-900/30 p-3 rounded-lg">
        <li>Ve a: <code className="text-yellow-300">https://supabase.com/dashboard</code></li>
        <li>Selecciona tu proyecto.</li>
        <li>Navega a: <code className="text-yellow-300">Authentication</code> &rarr; <code className="text-yellow-300">URL Configuration</code>.</li>
        <li className="font-sans text-yellow-200">En <strong>Site URL</strong>, introduce la URL <strong>exacta</strong> de tu aplicación online (ej: <code className="text-yellow-300">https://tu-sitio.piensasolutions.com</code>).</li>
        <li>Haz clic en <strong>Save</strong>.</li>
      </ol>
      <p>
        Esta URL es crucial para que Supabase genere los enlaces correctos. <strong>No debe ser <code>localhost</code></strong> si tu app está en producción.
      </p>
    </div>
  );

export const AuthView: React.FC = () => {
  const [view, setView] = useState<'login' | 'signup' | 'reset'>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showConfigHelp, setShowConfigHelp] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const startCooldown = (seconds: number) => {
    setCooldown(seconds);
  };

  const resetState = () => {
    setError(null);
    setMessage(null);
    setShowResend(false);
    setShowPassword(false);
    setCooldown(0);
    setShowConfigHelp(false);
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError("Por favor, introduce tu email para reenviar la confirmación.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    setShowConfigHelp(false);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });
      if (error) throw error;
      setMessage('Correo de confirmación reenviado. No olvides revisar tu carpeta de spam.');
      setShowResend(true);
    } catch (err: any) {
      let errorMessage: string;
      if (isRateLimitError(err)) {
          errorMessage = 'Límite de reenvío de correos excedido. Por favor, espera a que el contador finalice.';
          startCooldown(60);
      } else {
          errorMessage = 'No se pudo enviar el correo. Por favor, revisa la guía de configuración.';
          setShowConfigHelp(true);
      }
      setError(errorMessage);
      setShowResend(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetState();

    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            if (error.message.includes('Email not confirmed')) {
                setError('Tu cuenta aún no ha sido confirmada.');
                setMessage('Por favor, busca el enlace en tu correo (revisa también el spam).');
                setShowResend(true);
                return;
            }
            throw error;
        }
      } else {
        if (username.trim().length < 3) {
          throw new Error('El nombre de usuario debe tener al menos 3 caracteres.');
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim(),
              full_name: username.trim(),
            },
          },
        });

        if (signUpError) throw signUpError;

        await supabase.auth.signOut();

        setMessage('¡Registro casi completo! Revisa tu correo electrónico (y la carpeta de spam) para encontrar el enlace de confirmación. Deberás hacer clic en él antes de poder iniciar sesión.');
        setShowResend(true);
      }
    } catch (err: any) {
      let errorMessage = err.message || 'Ocurrió un error inesperado.';
      if (isRateLimitError(err)) {
          errorMessage = `Límite de solicitudes para ${view === 'login' ? 'inicio de sesión' : 'registro'} excedido. Por favor, inténtalo de nuevo más tarde.`;
          startCooldown(60);
      } else if (errorMessage.includes('User already registered')) {
        errorMessage = 'Ya existe un usuario registrado con este email.';
      } else if (errorMessage.includes('Error sending confirmation email')) {
        errorMessage = 'No se pudo enviar el correo de confirmación. Por favor, revisa la guía de configuración.';
        setShowConfigHelp(true);
      } else if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = 'Credenciales de inicio de sesión inválidas. Revisa tu email y contraseña.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetState();
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);

        if (error) throw error;

        setMessage('Si tu correo está registrado, recibirás un enlace de recuperación. No olvides revisar tu carpeta de spam.');
    } catch (err: any) {
        console.error("Error en restablecimiento de contraseña:", err);
        let errorMessage: string;
        if (isRateLimitError(err)) {
            errorMessage = 'Se ha alcanzado el límite de envío de correos. Por favor, espera a que el contador finalice para volver a intentarlo.';
            startCooldown(60);
        } else {
            errorMessage = 'No se pudo enviar el correo. Por favor, revisa la guía de configuración.';
            setShowConfigHelp(true);
        }
        setError(errorMessage);
    } finally {
        setLoading(false);
    }
  }


  const renderContent = () => {
    const alertBox = (
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
    );

    if (view === 'reset') {
      return (
        <>
          <div className="text-center">
            <LightbulbIcon className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-purple-400">
              Restablecer Contraseña
            </h1>
            <p className="mt-2 text-gray-400">
              Ingresa tu email para recibir el enlace de recuperación.
            </p>
          </div>
          <form className="space-y-4" onSubmit={handlePasswordReset}>
            <div>
              <label htmlFor="email-address" className="sr-only">Email</label>
              <input
                id="email-address" name="email" type="email" autoComplete="email" required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-700 bg-gray-900 placeholder-gray-500 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            { showConfigHelp && <ConfigHelp />}
            { (message || error) && alertBox}
            <div>
              <button
                type="submit" disabled={loading || cooldown > 0}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : (cooldown > 0 ? `Reintentar en ${cooldown}s` : 'Enviar Enlace')}
              </button>
            </div>
          </form>
          <p className="text-center text-sm">
            <button onClick={() => { setView('login'); resetState(); }} className="font-medium text-indigo-400 hover:text-indigo-300">
              Volver a Iniciar Sesión
            </button>
          </p>
        </>
      );
    }
    return (
        <>
            <div className="text-center">
              <LightbulbIcon className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
              {/* CAMBIO AQUI: Título principal "QUIZZMAKER" */}
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-purple-400">
                QUIZZMAKER
              </h1>
              {/* CAMBIO AQUI: Subtítulo para describir la acción */}
              <p className="mt-2 text-gray-400">
                {view === 'login' ? 'Bienvenido de Nuevo. Inicia sesión para continuar' : 'Crea tu Cuenta para empezar a crear y guardar tus cuestionarios'}
              </p>
            </div>
            <form className="space-y-4" onSubmit={handleAuth}>
              {view === 'signup' && (
                <div>
                  <label htmlFor="username" className="sr-only">Nombre de usuario</label>
                  <input
                    id="username" name="username" type="text" required
                    className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-700 bg-gray-900 placeholder-gray-500 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Nombre de usuario" value={username} onChange={(e) => setUsername(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-2 px-1">Será tu nombre público en la app.</p>
                </div>
              )}
              <div>
                <label htmlFor="email-address" className="sr-only">Email</label>
                <input
                  id="email-address" name="email" type="email" autoComplete="email" required
                  className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-700 bg-gray-900 placeholder-gray-500 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative">
                <label htmlFor="password" className="sr-only">Contraseña</label>
                <input
                  id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={view === 'login' ? 'current-password' : 'new-password'} required
                  className="appearance-none rounded-md block w-full px-3 py-3 border border-gray-700 bg-gray-900 placeholder-gray-500 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm pr-10"
                  placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)}
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

              {view === 'login' && (
                  <div className="flex items-center justify-end text-sm">
                      <button type="button" onClick={() => { setView('reset'); resetState(); }} className="font-medium text-indigo-400 hover:text-indigo-300">
                          ¿Olvidaste tu contraseña?
                      </button>
                  </div>
              )}

              { showConfigHelp && <ConfigHelp />}
              { (error || message) && alertBox }

              {showResend && (
                <div className="space-y-4">
                  <p className="text-center text-sm text-gray-400">
                      ¿No recibiste el correo?{' '}
                      <button
                          type="button"
                          onClick={handleResendConfirmation}
                          disabled={loading || cooldown > 0}
                          className="font-medium text-indigo-400 hover:text-indigo-300 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                          {loading ? 'Reenviando...' : (cooldown > 0 ? `Reintentar en ${cooldown}s` : 'Reenviar')}
                      </button>
                  </p>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:bg-gray-500"
                >
                  {loading ? (view === 'login' ? 'Iniciando Sesión...' : 'Creando Cuenta...') : (view === 'login' ? 'Iniciar Sesión' : 'Registrarse')}
                </button>
              </div>
            </form>
            <p className="text-center text-sm">
              <span className="text-gray-400">
                {view === 'login' ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
              </span>{' '}
              <button onClick={() => { setView(view === 'login' ? 'signup' : 'login'); resetState(); }} className="font-medium text-indigo-400 hover:text-indigo-300">
                {view === 'login' ? 'Regístrate' : 'Inicia sesión'}
              </button>
            </p>
        </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <Suspense fallback={<Loader text="Cargando..." />}>
        {showPrivacy ? (
          <PrivacyPolicyView onGoBack={() => setShowPrivacy(false)} />
        ) : (
          <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-2xl shadow-2xl">
              {renderContent()}
              <footer className="text-center text-gray-500 text-sm pt-2">
                  <button onClick={() => setShowPrivacy(true)} className="hover:text-indigo-400 transition-colors mb-2">
                    Política de Privacidad y Cookies
                  </button>
                  <p>&copy; 2024 J M GAMEZ</p>
              </footer>
          </div>
        )}
      </Suspense>
    </div>
  );
};