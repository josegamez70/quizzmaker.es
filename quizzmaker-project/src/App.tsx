// src/App.tsx

import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { AppState, Question, SavedQuiz } from './types.ts';
import { generateQuizFromImageAndText } from './services/geminiService.ts';
import Loader from './components/Loader.tsx';
import { LightbulbIcon, BookmarkIcon, LogoutIcon } from './components/icons.tsx';
import { supabase } from './supabaseClient.ts';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

// --- NUEVA FUNCIÓN AUXILIAR: Para barajar las preguntas ---
const shuffleArray = (array: Question[]): Question[] => {
  const newArray = [...array]; // Copiamos para no modificar el original
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Lazy load components
const ImageUploader = lazy(() => import('./components/ImageUploader.tsx'));
const QuizView = lazy(() => import('./components/QuizView.tsx'));
const ResultsView = lazy(() => import('./components/ResultsView.tsx'));
const SavedQuizzesView = lazy(() => import('./components/SavedQuizzesView.tsx'));
const AuthView = lazy(() => import('./components/LoginView.tsx').then(module => ({ default: module.AuthView })));
const UpdatePasswordView = lazy(() => import('./components/UpdatePasswordView.tsx'));
const PrivacyPolicyView = lazy(() => import('./components/PrivacyPolicyView.tsx'));

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
  const [profile, setProfile] = useState<{ username: string } | null>(null);
  const userId = session.user.id;

  useEffect(() => {
    // ... (el código de useEffect sigue igual, no es necesario cambiarlo)
    const fetchProfile = async () => {
      if (!userId) return;
      try {
        const { data, error } = await supabase.from('profiles').select('username').eq('id', userId).maybeSingle();
        if (error) throw error;
        if (data) setProfile(data);
      } catch (caughtError: unknown) {
        const message = caughtError instanceof Error ? caughtError.message : 'Error desconocido';
        console.error("Error fetching profile:", message);
      }
    };
    fetchProfile();
  }, [userId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    forceLogout();
  };

  const handleQuizGeneration = useCallback(async () => {
    // ... (esta función sigue igual)
    if (files.length === 0) {
      setError('Por favor, sube un archivo (imagen o PDF).');
      setAppState(AppState.ERROR);
      return;
    }
    setError('');
    setAppState(AppState.GENERATING);
    try {
      const questions = await generateQuizFromImageAndText(files, numQuestions);
      if (questions && questions.length > 0) {
        setQuiz(shuffleArray(questions)); // Barajamos al generar
        setUserAnswers(Array(questions.length).fill(null));
        setScore(0);
        setAppState(AppState.QUIZ);
      } else {
        throw new Error('No se pudieron generar preguntas.');
      }
    } catch (caughtError: unknown) {
      const message = caughtError instanceof Error ? caughtError.message : 'Error desconocido.';
      console.error(caughtError);
      setError(message);
      setAppState(AppState.ERROR);
    }
  }, [files, numQuestions]);

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
  
  // --- FUNCIÓN RESTAURADA Y MEJORADA ---
  const handleReshuffle = () => {
    if (quiz.length > 0) {
      setQuiz(shuffleArray(quiz)); // Barajamos las preguntas existentes
      setUserAnswers(Array(quiz.length).fill(null)); // Reseteamos las respuestas
      setScore(0); // Reseteamos la puntuación
      setAppState(AppState.QUIZ); // Volvemos a la vista del quiz
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
      case AppState.QUIZ:
        return <QuizView questions={quiz} onFinish={handleQuizFinish} onRestart={handleRestart} />;
      case AppState.RESULTS:
        // --- AHORA SÍ LE PASAMOS LA FUNCIÓN onReshuffle ---
        return <ResultsView score={score} questions={quiz} userAnswers={userAnswers} onRestart={handleRestart} onReshuffle={handleReshuffle} user={session.user} />;
      // ... (el resto de los cases siguen igual)
      case AppState.GENERATING: return <Loader text="Generando tu cuestionario..." />;
      case AppState.ERROR: return ( <div className="text-center p-8 bg-gray-800 rounded-lg"><h2 className="text-2xl font-bold text-red-500 mb-4">¡Oops! Algo salió mal</h2><p className="text-gray-300 mb-6">{error}</p><button onClick={handleRestart} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700">Intentar de Nuevo</button></div>);
      case AppState.SAVED_QUIZZES: return <SavedQuizzesView onViewQuiz={handleViewSavedQuiz} onGoHome={handleRestart} />
      case AppState.PRIVACY: return <PrivacyPolicyView onGoBack={handleRestart} />;
      case AppState.IDLE:
      default:
        return (<ImageUploader onFilesSelect={setFiles} onSubmit={handleQuizGeneration} numQuestions={numQuestions} onNumQuestionsChange={setNumQuestions} />);
    }
  };

  // El resto del componente MainApp (header, main, footer) sigue igual
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8 print:bg-white">
      <header className="w-full max-w-5xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3"><LightbulbIcon className="w-10 h-10 text-yellow-300" /><h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-purple-400">QUIZZ MAKER</h1></div>
        <div className="flex items-center gap-4"><span className="text-sm text-gray-300 hidden sm:block" title={profile?.username || session.user.email}>Hola, <span className="font-semibold">{profile?.username || session.user.email?.split('@')[0]}</span></span><button onClick={handleShowSaved} title="Mis Cuestionarios" className="flex items-center gap-2 p-3 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"><BookmarkIcon className="w-5 h-5"/><span className="hidden md:inline text-sm font-medium">Guardados</span></button><button onClick={handleLogout} title="Cerrar Sesión" className="flex items-center gap-2 p-3 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"><LogoutIcon className="w-5 h-5"/><span className="hidden md:inline text-sm font-medium">Salir</span></button></div>
      </header>
      <p className="w-full max-w-5xl mx-auto text-center -mt-2 mb-8 text-lg text-gray-400 print:hidden">Crea tu cuestionario en minutos. Sube un PDF o una imagen y la IA generará un desafío para ti.</p>
      <main className="w-full max-w-4xl mx-auto flex-grow flex items-start sm:items-center justify-center print:block"><Suspense fallback={<Loader text="Cargando vista..." />}>{renderContent()}</Suspense></main>
      <footer className="w-full max-w-4xl mx-auto mt-6 pt-4 text-center text-gray-500 text-sm border-t border-gray-700/50 print:hidden"><button onClick={handleShowPrivacy} className="hover:text-indigo-400 transition-colors mb-2">Política de Privacidad y Cookies</button><p>© 2024 J M GAMEZ</p></footer>
    </div>
  );
}

// El componente App de abajo sigue exactamente igual
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
  if (loading) { return (<div className="min-h-screen bg-gray-900 flex items-center justify-center"><Loader text="Cargando sesión..." /></div>); }
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center"><Loader text="Cargando..." /></div>}>
      {session && authEvent === 'PASSWORD_RECOVERY' ? (<UpdatePasswordView onPasswordUpdated={handlePasswordUpdated} />) : session ? (<MainApp session={session} forceLogout={forceLogout} />) : (<AuthView />)}
    </Suspense>
  );
}