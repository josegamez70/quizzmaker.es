// src/App.tsx
import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { AppState, Question, SavedQuiz } from './types.ts';
import { generateQuizFromImageAndText } from './services/geminiService.ts';
import Loader from './components/Loader.tsx';
import { LightbulbIcon, BookmarkIcon, LogoutIcon } from './components/icons.tsx';
import { supabase } from './supabaseClient.ts';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

const shuffleArray = (array: Question[]): Question[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

import { AuthView } from './components/LoginView.tsx';

const ImageUploader = lazy(() => import('./components/ImageUploader.tsx'));
const QuizView = lazy(() => import('./components/QuizView.tsx'));
const ResultsView = lazy(() => import('./components/ResultsView.tsx'));
const SavedQuizzesView = lazy(() => import('./components/SavedQuizzesView.tsx'));
const UpdatePasswordView = lazy(() => import('./components/UpdatePasswordView.tsx'));
const PrivacyPolicyView = lazy(() => import('./components/PrivacyPolicyView.tsx'));
const FreeAttemptsExceededView = lazy(() => import('./components/FreeAttemptsExceededView.tsx')); // Asegúrate de que este archivo existe

interface MainAppProps {
  session: Session;
  forceLogout: () => void;
}

const MainApp = ({ session, forceLogout }: MainAppProps) => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [files, setFiles] = useState<File[]>([]);
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [quiz, setQuiz] = useState<Question[]>([]);
  const [score, setScore] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [error, setError] = useState<string>('');
  const [profile, setProfile] = useState<{ username?: string; is_pro?: boolean } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // … aquí mantengo tu lógica de perfil, intentos, Pro, etc. …

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setUserId(user.id);
        const { data, error: message } = await supabase
          .from('profiles')
          .select('username, is_pro')
          .eq('id', user.id)
          .single();

        if (message) throw message;
        setProfile(data || {});
      } catch (message) {
        console.error("Error fetching profile:", message);
      }
    };
    fetchProfile();
  }, [userId, appState]);

  const handleLogout = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.access_token) {
        await supabase.auth.signOut();
        console.log("Sesión cerrada correctamente.");
      } else {
        console.warn("No hay sesión activa para cerrar.");
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      forceLogout();
    }
  };

  const handleGoPro = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert('Debes iniciar sesión primero.');
      return;
    }

    try {
      const res = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (e) {
      console.error(e);
      alert('No se pudo iniciar el checkout.');
    }
  };

  const handleGenerate = useCallback(async () => {
    try {
      setAppState(AppState.LOADING);
      setError('');

      // … tu lógica de intentos, Pro, etc. …

      const result = await generateQuizFromImageAndText(files, numQuestions);
      if (!result || !Array.isArray(result) || result.length === 0) {
        throw new Error('No se pudieron generar preguntas. Intenta con un archivo diferente.');
      }

      setQuiz(result);
      setAppState(AppState.QUIZ);
    } catch (caughtError: unknown) {
      const message = caughtError instanceof Error ? caughtError.message : 'Ocurrió un error desconocido.';
      console.error(caughtError);
      setError(message);
      setAppState(AppState.ERROR);
    }
  }, [files, numQuestions, userId]);

  const handleQuizFinish = (finalScore: number, finalAnswers: (string | null)[]) => {
    setScore(finalScore);
    setUserAnswers(finalAnswers);
    setAppState(AppState.RESULTS);
  };

  const handleRestart = () => {
    setAppState(AppState.IDLE);
    setFiles([]);
    setQuiz([]);
    setScore(0);
    setUserAnswers([]);
    setError('');
    setNumQuestions(10);
  };

  const handleReshuffle = () => setQuiz((prev) => shuffleArray(prev));

  const handleShowSaved = () => setAppState(AppState.SAVED_QUIZZES);

  const handleViewSavedQuiz = (saved: SavedQuiz) => {
    setQuiz(saved.questions);
    setAppState(AppState.QUIZ);
  };

  const renderContent = () => {
    switch (appState) {
      case AppState.LOADING: return <Loader text="Generando tu cuestionario..." />;
      case AppState.QUIZ: return <QuizView questions={quiz} onFinish={handleQuizFinish} onRestart={handleRestart} />;
      case AppState.RESULTS: return <ResultsView score={score} questions={quiz} userAnswers={userAnswers} onRestart={handleRestart} onReshuffle={handleReshuffle} user={session.user} />;
      case AppState.ERROR: return (
        <div className="text-center p-8">
          <p className="mb-4 text-red-300">{error || 'Error inesperado'}</p>
          <button onClick={handleRestart} className="px-6 py-2 bg-indigo-600 rounded hover:bg-indigo-700">Intentar de Nuevo</button>
        </div>
      );
      case AppState.SAVED_QUIZZES: return <SavedQuizzesView onViewQuiz={handleViewSavedQuiz} onGoHome={handleRestart} />;
      case AppState.PRIVACY: return <PrivacyPolicyView onGoBack={handleRestart} />;
      case AppState.LIMIT_REACHED: return <FreeAttemptsExceededView onGoPro={handleGoPro} onGoHome={handleRestart} />;
      case AppState.IDLE:
      default:
        return (
          <ImageUploader
            onFilesSelected={setFiles}
            onGenerate={handleGenerate}
            numQuestions={numQuestions}
            onNumQuestionsChange={setNumQuestions}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
      {/* Header */}
      <header className="w-full max-w-5xl mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between print:hidden">
        {/* LOGO + TÍTULO: vuelve al inicio al hacer click */}
        <button
          type="button"
          onClick={handleRestart}
          className="flex items-center gap-3 mb-4 sm:mb-0 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded-lg"
          aria-label="Ir a la página principal"
          title="Ir a la página principal"
        >
          <LightbulbIcon className="w-10 h-10 text-yellow-300" />
          <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-purple-400">
            QUIZZMAKER
          </h1>
        </button>

        {/* Botones de navegación */}
        <div className="flex items-center w-full sm:w-auto justify-center sm:justify-end gap-2 px-2 sm:px-0">
          <span className="hidden sm:block text-sm text-gray-300" title={profile?.username || session.user.email}>
            Hola, <span className="font-semibold">{profile?.username || session.user.email?.split('@')[0]}</span>
          </span>

          <button
            onClick={handleShowSaved}
            title="Mis Cuestionarios"
            className="px-2 py-2 sm:px-3 sm:py-2 rounded-md bg-gray-800/60 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2"
          >
            <BookmarkIcon className="w-5 h-5" />
            <span className="hidden md:inline text-sm font-medium">Guardados</span>
          </button>

          {!profile?.is_pro && (
            <button
              onClick={handleGoPro}
              className="px-3 py-2 rounded-md bg-yellow-400 text-gray-900 font-semibold hover:bg-yellow-300 transition-colors"
              title="Hazte Pro"
            >
              PRO
            </button>
          )}

          <button
            onClick={handleLogout}
            className="px-2 py-2 sm:px-3 sm:py-2 rounded-md bg-gray-800/60 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2"
            title="Cerrar sesión"
          >
            <LogoutIcon className="w-5 h-5" />
            <span className="hidden md:inline text-sm font-medium">Salir</span>
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="w-full max-w-5xl">{renderContent()}</main>

      {/* Footer simple */}
      <footer className="w-full max-w-5xl mt-10 text-center text-sm text-gray-400">
        <button onClick={() => setAppState(AppState.PRIVACY)} className="underline hover:text-gray-200">
          Política de privacidad
        </button>
      </footer>
    </div>
  );
};

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authEvent, setAuthEvent] = useState<AuthChangeEvent | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setAuthEvent(_event); setSession(session); setLoading(false); });
    return () => subscription.unsubscribe();
  }, []);

  const forceLogout = () => { setSession(null); setAuthEvent(null); };
  const handlePasswordUpdated = () => forceLogout();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader text="Cargando sesión..." />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <Loader text="Cargando..." />
        </div>
      }
    >
      {session && authEvent === 'PASSWORD_RECOVERY' ? (
        <UpdatePasswordView onPasswordUpdated={handlePasswordUpdated} />
      ) : session ? (
        <MainApp session={session} forceLogout={forceLogout} />
      ) : (
        <AuthView />
      )}
    </Suspense>
  );
}
