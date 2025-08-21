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
};

const ConfigHelp = () => (
  <div className="bg-yellow-900/50 border border-yellow-500/30 p-4 rounded-md text-sm text-yellow-200 space-y-2 mt-4">
    <p className="font-bold flex items-center gap-2">
      <InformationCircleIcon className="w-5 h-5" /> Guía de Configuración de Email
    </p>
    <p>
      Los problemas con el envío de correos (confirmación, reseteo de clave) casi siempre se deben a una configuración incorrecta en tu panel de Supabase.
    </p>
    <ol className="list-decimal list-inside space-y-1 pl-2 font-mono text-xs bg-gray-900/30 p-3 rounded-lg">
      <li>Ve a: <code className="text-yellow-300">https://supabase.com/dashboard</code></li>
      <li>Selecciona tu proyecto.</li>
      <li>Navega a: <code className="text-yellow-300">Authentication</code> → <code className="text-yellow-300">URL Configuration</code>.</li>
      <li className="font-sans text-yellow-200">En <strong>Site URL</strong>, introduce la URL <strong>exacta</strong> de tu app en producción.</li>
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

  const startCooldown = (seconds: number) => setCooldown(seconds);

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
      setError('Por favor, introduce tu email para reenviar la confirmación.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    setShowConfigHelp(false);

    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      setMessage('Correo de confirmación reenviado. Revisa también el spam.');
      setShowResend(true);
    } catch (err: any) {
      let errorMessage: string;
      if (isRateLimitError(err)) {
        errorMessage = 'Límite de reenvío de correos excedido. Espera a que el contador finalice.';
        startCooldown(60);
      } else {
        errorMessage = 'No se pudo enviar el correo. Revisa la guía de configuración.';
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
            setMessage('Busca el enlace en tu correo (revisa también el spam).');
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
          options: { data: { username: username.trim(), full_name: username.trim() } },
        });
        if (signUpError) throw signUpError;

        await supabase.auth.signOut();
        setMessage('¡Registro casi completo! Revisa tu correo y confirma la cuenta.');
        setShowResend(true);
      }
    } catch (err: any) {
      let errorMessage = err.message || 'Ocurrió un error inesperado.';
      if (isRateLimitError(err)) {
        errorMessage = `Límite de solicitudes para ${view === 'login' ? 'inicio de sesión' : 'registro'} excedido. Inténtalo más tarde.`;
        startCooldown(60);
      } else if (errorMessage.includes('User already registered')) {
        errorMessage = 'Ya existe un usuario registrado con este email.';
      } else if (errorMessage.includes('Error sending confirmation email')) {
        errorMessage = 'No se pudo enviar el correo de confirmación. Revisa la guía de configuración.';
        setShowConfigHelp(true);
      } else if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = 'Credenciales inválidas. Revisa tu email y contraseña.';
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
      // ✅ Ahora redirige a /reset-password para forzar PASSWORD_RECOVERY
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;

      setMessage('Si tu correo está registrado, recibirás un enlace de recuperación. Revisa también el spam.');
    } catch (err: any) {
      console.error('Error en restablecimiento de contraseña:', err);
      let errorMessage: string;
      if (isRateLimitError(err)) {
        errorMessage = 'Se ha alcanzado el límite de envío de correos. Espera a que el contador finalice.';
        startCooldown(60);
      } else {
        errorMessage = 'No se pudo enviar el correo. Revisa la guía de configuración.';
        setShowConfigHelp(true);
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ... resto del componente igual (renderContent, return ...)
  // (no lo recorto porque ya lo tienes en tu archivo; solo he tocado handlePasswordReset)
  
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <Suspense fallback={<Loader text="Cargando..." />}>
        {showPrivacy ? (
          <PrivacyPolicyView onGoBack={() => setShowPrivacy(false)} />
        ) : (
          <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-2xl shadow-2xl">
            {/* Aquí sigue tu renderContent completo */}
          </div>
        )}
      </Suspense>
    </div>
  );
};
