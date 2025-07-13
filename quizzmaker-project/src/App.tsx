// src/App.tsx

import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { AppState, Question, SavedQuiz } from './types.ts';
import { generateQuizFromImageAndText } from './services/geminiService.ts';
import Loader from './components/Loader.tsx';
import { LightbulbIcon, BookmarkIcon, LogoutIcon } from './components/icons.tsx';
import { supabase } from './supabaseClient.ts';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

// Lazy load components... (esto sigue igual)
const ImageUploader = lazy(() => import('./components/ImageUploader.tsx'));
const QuizView = lazy(() => import('./components/QuizView.tsx'));
// ... y el resto de tus lazy loads

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

  // El useEffect para buscar el perfil sigue igual...
  useEffect(() => {
    // ...
  }, [userId]);

  const handleLogout = async () => { /* ... */ };

  // --- CAMBIO 1: La función de generación de quiz ahora es el "guardián" ---
  const handleQuizGeneration = useCallback(async () => {
    if (files.length === 0) {
      setError('Por favor, sube un archivo.');
      setAppState(AppState.ERROR);
      return;
    }
    setError('');

    try {
      // Paso A: Consultar el estado actual del usuario en la base de datos
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('quiz_attempts, is_pro') // Asumiendo que tendrás una columna is_pro en el futuro
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;

      const attempts = profileData.quiz_attempts || 0;
      const isPro = profileData.is_pro || false;

      // Paso B: Comprobar si el usuario tiene permiso
      if (isPro || attempts < 5) {
        // ¡Sí tiene permiso!
        
        // Primero, si no es pro, le contamos el intento
        if (!isPro) {
          await supabase
            .from('profiles')
            .update({ quiz_attempts: attempts + 1 })
            .eq('id', userId);
        }

        // Ahora, procedemos con la generación del quiz como antes
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
        // ¡No tiene permiso! Límite alcanzado.
        setAppState(AppState.LIMIT_REACHED);
      }

    } catch (caughtError: unknown) {
      const message = caughtError instanceof Error ? caughtError.message : 'Ocurrió un error desconocido.';
      console.error(caughtError);
      setError(message);
      setAppState(AppState.ERROR);
    }
  }, [files, numQuestions, userId]);

  // El resto de las funciones (handleQuizFinish, handleRestart, etc.) siguen igual...
  const handleQuizFinish = (/*...*/) => { /*...*/ };
  const handleRestart = () => { /*...*/ };
  // ...

  // --- CAMBIO 2: Añadimos un nuevo caso a nuestro renderizador de contenido ---
  const renderContent = () => {
    switch (appState) {
      // ... (todos tus otros 'case' van aquí)

      case AppState.LIMIT_REACHED:
        return (
          <div className="text-center p-8 bg-gray-800 rounded-2xl shadow-2xl animate-fade-in">
            <h2 className="text-3xl font-bold text-yellow-400 mb-4">Límite de Intentos Alcanzado</h2>
            <p className="text-gray-300 text-lg mb-6">
              Has utilizado tus 5 generaciones de cuestionarios gratuitos.
            </p>
            <p className="text-gray-400 mb-8">
              ¡Próximamente podrás convertirte en **Quizz Maker Pro** por un pago único de 5€ y disfrutar de generaciones ilimitadas!
            </p>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700"
            >
              Cerrar Sesión
            </button>
          </div>
        );
      
      // ... (el resto de los 'case' van aquí)
      default:
        return ( <ImageUploader /* ... */ /> );
    }
  };

  // El return de MainApp (header, main, footer) sigue igual...
  return ( <div className="min-h-screen ..."> ... </div> );
}

// La función App de abajo sigue igual...
export function App() {
  // ...
}