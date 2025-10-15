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
  const [profile, setProfile] = useState<{ username: string; is_pro?: boolean; quiz_attempts?: number } | null>(null);
  const userId = session.user.id;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      try {
        const { data, error } = await supabase.from('profiles').select('username, is_pro, quiz_attempts').eq('id', userId).maybeSingle();
        if (error) throw error;
        if (data) setProfile(data);
      } catch (caughtError: unknown) {
        const message = caughtError instanceof Error ? caughtError.message : 'Error al buscar el perfil.';
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

    const res = await fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: user.id, email: user.email }),
    });

    const { url } = await res.json();
    if (url) {
      window.location.href = url;
    } else {
      alert('Error al iniciar la compra. Intenta más tarde.');
    }
  };

  const handleQuizGeneration = useCallback(async () => {
    if (files.length === 0) {
      setError('Por favor, sube un archivo (imagen o PDF).');
      setAppState(AppState.ERROR);
      return;
    }
    setError('');

    try {
      const { data: profileData, error: profileError } = await supabase.from('profiles').select('quiz_attempts, is_pro').eq('id', userId).single();
      if (profileError) throw profileError;

      const attempts = profileData.quiz_attempts || 0;
      const isPro = profileData.is_pro || false;

      if (isPro) {
        console.log("Usuario Pro, generando cuestionario ilimitado.");
        setAppState(AppState.GENERATING);
        const questions = await generateQuizFromImageAndText(files, numQuestions);
        if (questions && questions.length > 0) {
          setQuiz(shuffleArray(questions));
          setUserAnswers(Array(questions.length).fill(null));
          setScore(0);
          setAppState(AppState.QUIZ);
        } else {
          throw new Error('No se pudieron generar preguntas. Intenta con un archivo diferente.');
        }
      } else if (attempts < 4) {
        await supabase.from('profiles').update({ quiz_attempts: attempts + 1 }).eq('id', userId);
        console.log(`Usuario no Pro. Intento ${attempts + 1} de 4. Generando cuestionario.`);
        setAppState(AppState.GENERATING);
        const questions = await generateQuizFromImageAndText(files, numQuestions);
        if (questions && questions.length > 0) {
          setQuiz(shuffleArray(questions));
          setUserAnswers(Array(questions.length).fill(null));
          setScore(0);
          setAppState(AppState.QUIZ);
        } else {
          throw new Error('No se pudieron generar preguntas. Intenta con un archivo diferente.');
        }
      } else {
        console.log("Usuario no Pro. Intentos agotados. Mostrando vista de límite.");
        setAppState(AppState.LIMIT_REACHED);
      }
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

  const handleReshuffle = () => {
    if (quiz.length > 0) {
      setQuiz(shuffleArray(quiz));
      setUserAnswers(Array(quiz.length).fill(null));
      setScore(0);
      setAppState(AppState.QUIZ);
    }
  };

  const handleShowSaved = () => setAppState(AppState.SAVED_QUIZZES);
  const handleShowPrivacy = () => setAppState(AppState.PRIVACY);
  const handleViewSavedQuiz = (savedQuiz: SavedQuiz) => {
    setQuiz(savedQuiz.questions);
    setScore(savedQuiz.score);
    setUserAnswers(savedQuiz.userAnswers);
    setAppState(AppState.RESULTS);
  };

  const renderContent = () => {
    switch (appState) {
      case AppState.GENERATING: return <Loader text="Generando tu cuestionario..." />;
      case AppState.QUIZ: return <QuizView questions={quiz} onFinish={handleQuizFinish} onRestart={handleRestart} />;
      case AppState.RESULTS: return <ResultsView score={score} questions={quiz} userAnswers={userAnswers} onRestart={handleRestart} onReshuffle={handleReshuffle} user={session.user} />;
      case AppState.ERROR: return (<div className="text-center p-8 bg-gray-800 rounded-lg"><h2 className="text-2xl font-bold text-red-500 mb-4">¡Oops! Algo salió mal</h2><p className="text-gray-300 mb-6">{error}</p><button onClick={handleRestart} className="px-6 py-2 bg-indigo-600">Intentar de Nuevo</button></div>);
      case AppState.SAVED_QUIZZES: return <SavedQuizzesView onViewQuiz={handleViewSavedQuiz} onGoHome={handleRestart} />;
      case AppState.PRIVACY: return <PrivacyPolicyView onGoBack={handleRestart} />;
      case AppState.LIMIT_REACHED: return <FreeAttemptsExceededView onGoPro={handleGoPro} onGoHome={handleRestart} />;
      case AppState.IDLE: default: return (<ImageUploader onFilesSelect={setFiles} onSubmit={handleQuizGeneration} numQuestions={numQuestions} onNumQuestionsChange={setNumQuestions} />);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
      <header className="w-full max-w-5xl mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between print:hidden">
        {/* Logo: al hacer click vuelve al inicio */}
        <button
          onClick={handleRestart}
          className="flex items-center gap-3 mb-4 sm:mb-0 cursor-pointer focus:outline-none"
          title="Ir a la página principal"
        >
          <LightbulbIcon className="w-10 h-10 text-yellow-300" />
          <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-purple-400">
            QUIZZMAKER
          </h1>
        </button>

        {/* Sección de los botones de navegación */}
        <div className="flex items-center w-full sm:w-auto justify-center sm:justify-end gap-2 px-2 sm:px-0">
          <span className="hidden sm:block text-sm text-gray-300" title={profile?.username || session.user.email}>
            Hola, <span className="font-semibold">{profile?.username || session.user.email?.split('@')[0]}</span>
          </span>

          <button onClick={handleShowSaved} title="Mis Cuestionarios" className="flex items-center gap-1 px-2 py-1 sm:gap-2 sm:p-3 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
            <BookmarkIcon className="w-5 h-5"/>
            <span className="hidden md:inline text-sm font-medium">Guardados</span>
          </button>

          {!profile?.is_pro && (
            <button onClick={handleGoPro} title="Hazte Pro" className="flex items-center gap-1 px-2 py-1 sm:gap-2 sm:p-3 rounded-md text-yellow-400 hover:bg-yellow-800 hover:text-white transition-colors">
              🚀 <span className="hidden md:inline text-sm font-medium">Hazte Pro</span>
            </button>
          )}

          <button onClick={handleLogout} title="Cerrar Sesión" className="flex items-center gap-1 px-2 py-1 sm:gap-2 sm:p-3 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
            <LogoutIcon className="w-5 h-5"/>
            <span className="hidden md:inline text-sm font-medium">Salir</span>
          </button>
        </div>
      </header>

      <p className="w-full max-w-5xl mx-auto text-center -mt-2 mb-8 text-lg text-gray-400 print:hidden">
        Crea tu cuestionario en minutos. Sube un PDF o una imagen y la IA generará un desafío para ti.
      </p>

      <main className="w-full max-w-4xl mx-auto flex-grow flex items-center justify-center print:block">
        <Suspense fallback={<Loader text="Cargando vista..." />}>{renderContent()}</Suspense>
      </main>

      <footer className="w-full max-w-4xl mx-auto mt-6 pt-4 text-center text-gray-500 text-sm border-t border-gray-700/50 print:hidden">
        <button onClick={handleShowPrivacy} className="hover:text-indigo-400 transition-colors mb-2">
          Política de Privacidad, Cookies y Contacto
        </button>
        <p>© 2024 J M GAMEZ</p>
      </footer>
    </div>
  );
};

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Eliminamos authEvent aquí porque App.tsx ya no lo gestionará para PASSWORD_RECOVERY
  // const [authEvent, setAuthEvent] = useState<AuthChangeEvent | null>(null); 

  useEffect(() => {
    const handleInitialSession = async () => {
      // Obtenemos la sesión inicial. No necesitamos 'event' aquí ya que la ruta /update-password lo maneja.
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setLoading(false);
    };

    handleInitialSession();

    // El onAuthStateChange sigue siendo importante para otros eventos (SIGNED_IN, SIGNED_OUT)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      console.log("Auth State Change detected in App.tsx:", _event, currentSession);
      setSession(currentSession);
      setLoading(false);
      // Opcional: Si por alguna razón el usuario llega a App.tsx con un evento PASSWORD_RECOVERY
      // y no ha pasado por la ruta dedicada, podrías forzar la redirección aquí.
      // Pero lo ideal es que el `redirectTo` en LoginView ya los dirija correctamente.
      // if (_event === 'PASSWORD_RECOVERY' && window.location.pathname !== '/update-password') {
      //   window.location.href = '/update-password';
      // }
    });

    return () => subscription.unsubscribe();
  }, []);

  const forceLogout = () => { 
    setSession(null); 
    // Al hacer logout, limpiamos el hash de la URL si existe (ej. #access_token=...)
    window.history.replaceState({}, document.title, window.location.pathname);
  };
  // handlePasswordUpdated ya no es necesario aquí, ya que UpdatePasswordView redirige directamente
  // const handlePasswordUpdated = () => forceLogout(); 

  if (loading) {
    return (<div className="min-h-screen bg-gray-900 flex items-center justify-center"><Loader text="Cargando sesión..." /></div>);
  }

  // Debugging log
  console.log("Rendering App with:", { session });

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center"><Loader text="Cargando..." /></div>}>
      {/* App.tsx ahora solo se encarga de mostrar la MainApp o AuthView */}
      {session ? (
        <MainApp session={session} forceLogout={forceLogout} />
      ) : (
        <AuthView />
      )}
    </Suspense>
  );
}