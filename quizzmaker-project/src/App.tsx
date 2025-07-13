// src/App.tsx

import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { AppState, Question, SavedQuiz } from './types.ts';
import { generateQuizFromImageAndText } from './services/geminiService.ts';
import Loader from './components/Loader.tsx';
import { LightbulbIcon, BookmarkIcon, LogoutIcon } from './components/icons.tsx';
import { supabase } from './supabaseClient.ts';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

// --- VOLVEMOS A USAR LAZY LOADING (AHORA SABEMOS QUE FUNCIONA) ---
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
    const fetchProfile = async () => {
      if (!userId) return;
      try {
        const { data, error } = await supabase.from('profiles').select('username').eq('id', userId).maybeSingle();
        if (error) throw error;
        if (data) setProfile(data);
      } catch (caughtError: unknown) {
        const message = caughtError instanceof Error ? caughtError.message : 'Error desconocido.';
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
    if (files.length === 0) {
      setError('Por favor, sube un archivo.');
      setAppState(AppState.ERROR);
      return;
    }
    setError('');

    try {
      const { data: profileData, error: profileError } = await supabase.from('profiles').select('quiz_attempts, is_pro').eq('id', userId).single();
      if (profileError) throw profileError;

      const attempts = profileData.quiz_attempts || 0;
      const isPro = profileData.is_pro || false;

      if (isPro || attempts¡YA < 5) {
        if (!isPro) {
          await supabase.from('profiles').update({ quiz_attempts: attempts + 1 }).eq('id', userId);
        }
        setAppState(AppState.GENERATING);
        const questions = await generateQuizFromImageAndText(files, numQuestions);
         VEO! ¡Excelente! Esta imagen es increíblemente reveladora.

La aplicación **SÍ CARGA**, pero no se ve completa. Faltan el `Header` y el `Footer`, yif (questions && questions.length > 0) {
          setQuiz(questions);
          setUserAnswers(Array(questions.length).fill(null));
          setScore(0);
          setAppState(AppState. al darle a "Generar Cuestionario" seguramente da un error.

Esto nos dice algo muy importante:
1.  **El problema SÍ era el `lazy loading`**. Al quitarlo, la aplicación al menos ha podido renderQUIZ);
        } else {
          throw new Error('No se pudieron generar preguntas.');
        }
      } else {
        setAppState(AppState.LIMIT_REACHED);
      }
    } catch (caughtError: unknown) {
      const message = caughtError instanceof Error ? caughtError.message : 'Error desconocido.';
      console.error(caughtError);
      setError(message);
      setAppState(AppState.ERROR);
    }
  }, [files, numQuestions, userId]);

  const handleQuizFinish = (izar algo.
2.  El hecho de que falten partes (Header/Footer) y que la lógica falle, pero no haya un pantallazo blanco, apunta a un **error de lógica o de estado dentro del componente `AppfinalScore: number, finalAnswers: (string | null)[]) => {
    setScore(finalScore);
    setUserAnswers(finalAnswers);
    setAppState(AppState.RESULTS);
  };

  const handleRestart = () => {
    setAppState(AppState.IDLE);
    setFiles([]);
    setQuiz([]);.tsx`**.

---

### El Diagnóstico Final (Ahora sí)

He revisado de nuevo el código que te pasé para desactivar el `lazy loading`, comparándolo con el original que me diste, y **he encontrado mi propio error**. Mis más sinceras disculpas.

Al reescribir el componente `MainApp` en mi
    setScore(0);
    setUserAnswers([]);
    setError('');
    setNumQuestions(10);
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
    switch (appState) última respuesta, **eliminé sin querer el `Header` y el `Footer` de la estructura del `return` {
      case AppState.GENERATING: return <Loader text="Generando tu cuestionario..." />;
      case AppState.QUIZ: return <QuizView questions={quiz} onFinish={handleQuizFinish} onRestart={handleRestart} />;
      case AppState.RESULTS: return <ResultsView score={score} questions={quiz} userAnswers={userAnswers} onRestart={handleRestart} user={session.user} />;
      case AppState.ERROR: return (<div className="text-center p-8 bg-gray-800 rounded-lg"><h2 className="text-2xl font-bold text-red-500 mb-4">**. También simplifiqué en exceso el `return` de la función `App` principal, lo que rompía la lógica de `Suspense` que sí es necesaria para el cambio de sesión.

**El culpable soy yo.** Pero la buena noticia es que ahora sabemos exactamente qué arreglar.

---

### La Solución Definitiva (Uniendo lo mejor de ambos¡Oops! Algo salió mal</h2><p className="text-gray-300 mb-6">{error}</p><button onClick={handleRestart} className="px-6 py-2 bg-indigo-600">Intentar de Nuevo</button></div>);
      case AppState.LIMIT_REACHED: return (<div className="text-center p-8 bg-gray-800 rounded-2xl shadow-2xl"><h2 className="text-3xl font-bold text-yellow-400 mb-4">Límite Alcanzado</h2><p className="text-gray-300 text-lg mb-6">Has utilizado mundos)

Vamos a usar el código que **SÍ FUNCIONA** (el que me pasaste tú originalmente) y le haremos los cambios mínimos y necesarios para implementar el límite de intentos, pero sin romper nada más.

**Acción: Reemplaza el contenido COMPLETO de tu `src/App.tsx` con este código. Este SÍ es el bueno.**

```tsx
// src/App.tsx

import React, { useState, useCallback, tus 5 intentos gratuitos.</p><p className="text-gray-400 mb-8">Próximamente podrás ser Pro para uso ilimitado.</p><button onClick={handleLogout} className="px-6 py-2 bg-indigo-600">Cerrar Sesión</button></div>);
      case AppState.SAVED_QUIZZES: return <SavedQuizzesView onViewQuiz={handleViewSavedQuiz} onGoHome={handleRestart} />;
      case AppState.PRIVACY: return <PrivacyPolicyView onGoBack={handleRestart} useEffect, lazy, Suspense } from 'react';
import { AppState, Question, SavedQuiz } from './types.ts';
import { generateQuizFromImageAndText } from './services/geminiService.ts';
import Loader from './components/Loader.tsx';
import { LightbulbIcon, BookmarkIcon, LogoutIcon } from './components/icons.tsx';
import { supabase } from './supabaseClient.ts';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

// Mantenemos el lazy loading original porque sabemos que funcionaba
const ImageUploader = lazy(() => import('./components/ImageUploader.tsx'));
const QuizView = lazy(() => />;
      case AppState.IDLE: default: return (<ImageUploader onFilesSelect={setFiles} onSubmit={handleQuizGeneration} numQuestions={numQuestions} onNumQuestionsChange={setNumQuestions} />);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
      <header className="w-full max-w-5xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3"><LightbulbIcon className="w-10 h-10 text-yellow-300" /><h1 className="text-3xl font-extrabold tracking-tight text- import('./components/QuizView.tsx'));
const ResultsView = lazy(() => import('./components/ResultsView.tsx'));
const SavedQuizzesView = lazy(() => import('./components/SavedQuizzesView.tsx'));
const AuthView = lazy(() => import('./components/LoginView.tsx').then(module => ({ default: module.AuthView })));
const UpdatePasswordView = lazy(() => import('./components/UpdatePasswordView.tsx'));
const PrivacyPolicyView = lazy(() => import('./components/PrivacyPolicyView.tsx'));


interface MainAppProps {
  session: Session;
  forceLogout: () => void;
}

const MainApp = ({transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-purple-400">QUIZZ MAKER</h1></div>
        <div className="flex items-center gap-4"><span className="text-sm text-gray-300 hidden sm:block" title={profile?.username || session.user.email}>Hola, <span className="font-semibold">{profile?.username || session.user.email?.split('@')[0]}</span></span><button onClick={handleShowSaved} title="Mis Cuestionarios" className="flex items-center gap-2 p-3 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"><BookmarkIcon className="w-5 h-5"/><span className="hidden md:inline text-sm font-medium">Guardados</span></button><button onClick={handle session, forceLogout }: MainAppProps) => {
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
    const fetchProfile = async () => {
      if (!userId) return;
      try {
        const { data, error } = await supabase.from('profiles').select('username').eq('id', userId).maybeSingle();
        ifLogout} title="Cerrar Sesión" className="flex items-center gap-2 p-3 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"><LogoutIcon className="w-5 h-5"/><span className="hidden md:inline text-sm font-medium">Salir</span></button></div>
      </header>
      <p className="w-full max-w-5xl mx-auto text-center -mt-2 mb-8 text-lg text-gray-400 print:hidden">
        Crea tu cuestionario en minutos. Sube un PDF o una imagen y la IA generará un desafío para ti.
      </p>
      <main className="w-full max-w-4xl mx-auto flex-grow flex items-center justify-center print:block"><Suspense fallback={<Loader text="Cargando vista..." />}>{renderContent()}</Suspense></main>
      <footer className="w-full max-w-4xl mx-auto mt-6 pt-4 text-center text-gray-5 (error) throw error;
        if (data) setProfile(data);
      } catch (caughtError: unknown) {
        const message = caughtError instanceof Error ? caughtError.message : 'Ocurrió un error desconocido al buscar el perfil.';
        console.error("Error fetching profile:", message);
      }
    };
    fetchProfile();
  }, [userId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    forceLogout();
  };

  // --- ÚNICO CAMBIO IMPORTANTE: La lógica del guardián está aquí ---
  const handleQuizGeneration = useCallback(async () => {
    if (files.length === 0) {
      setError('Por favor, sube un archivo (imagen o PDF).');
      setAppState(AppState.ERROR);
      return;
    }
    setError('');

    try {
      // 1. Consultar el estado del usuario
      const { data: profileData, error: profileError } = await supabase00 text-sm border-t border-gray-700/50 print:hidden"><button onClick={handleShowPrivacy} className="hover:text-indigo-400 transition-colors mb-2">Política de Privacidad y Cookies</button><p>© 2024 J M GAMEZ</p></footer>
    </div>
  );
};

// --- ESTRUCTURA RESTAURADA Y CORRECTA ---
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
  const handlePasswordUpdated = () => forceLogout();.from('profiles').select('quiz_attempts, is_pro').eq('id', userId).single();
      if (profileError) throw profileError;
      
      const attempts = profileData.quiz_attempts || 0;
      const isPro = profileData.is_pro || false;

      // 2. Comprobar si tiene permiso
      if (isPro || attempts < 5) {
        // Sí tiene permiso. Primero le contamos el intento si no es pro.
        if (!isPro) {
          await supabase.from('profiles').update({ quiz_attempts: attempts + 1 }).eq('id', userId);
        }

        // Y ahora procedemos con la generación normal
        setAppState(AppState.GENERATING);
        const questions = await generateQuizFromImageAndText(files, numQuestions);
        if (questions && questions.length > 0) {
          setQuiz(questions);
          setUserAnswers(Array(questions.length).fill(null));
          setScore(0);
          setAppState(AppState.QUIZ);
        } else {
          throw new Error('No se pudieron generar preguntas. Intenta con un archivo diferente.');
        }
      } else {
        

  if (loading) { return (<div className="min-h-screen bg-gray-900 flex items-center justify-center"><Loader text="Cargando sesión..." /></div>); }

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center"><Loader text="Cargando..." /></div>}>
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