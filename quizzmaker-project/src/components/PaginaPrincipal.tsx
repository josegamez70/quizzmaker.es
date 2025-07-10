// src/components/PaginaPrincipal.tsx

import React, { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { Question } from '../types';

import ImageUploader from './ImageUploader';
// Asumo que tienes un componente para el quiz, si no, lo podemos crear
// import QuizView from './QuizView'; 
import ResultsView from './ResultsView';
import Loader from './Loader';
import { generateQuestions } from '../services/geminiService';

// Función para barajar un array (algoritmo Fisher-Yates)
const shuffleArray = (array: any[]) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

const PaginaPrincipal = () => {
  const [user, setUser] = useState<User | null>(null);
  const [quizState, setQuizState] = useState<'upload' | 'generating' | 'quiz' | 'results'>('upload');
  
  const [files, setFiles] = useState<File[]>([]);
  const [numQuestions, setNumQuestions] = useState(10);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleGenerateQuiz = async () => {
    if (files.length === 0) return;
    setQuizState('generating');
    try {
      const generatedQuestions = await generateQuestions(files, numQuestions);
      setQuestions(shuffleArray(generatedQuestions));
      setUserAnswers(new Array(generatedQuestions.length).fill(null));
      setQuizState('quiz');
    } catch (error) {
      console.error("Error al generar el cuestionario:", error);
      alert("Hubo un error generando el cuestionario. Por favor, inténtalo de nuevo.");
      setQuizState('upload'); // Vuelve al estado inicial si hay error
    }
  };
  
  // Esta función se pasa al componente QuizView cuando se completa
  const handleQuizComplete = (finalScore: number, finalAnswers: (string | null)[]) => {
      setScore(finalScore);
      setUserAnswers(finalAnswers);
      setQuizState('results');
  };

  // Esta función se pasa al ResultsView
  const handleReshuffle = (currentQuestions: Question[]) => {
      setQuestions(shuffleArray(currentQuestions));
      setUserAnswers(new Array(currentQuestions.length).fill(null));
      setScore(0);
      setQuizState('quiz'); // Volvemos al quiz con las preguntas barajadas
  };

  if (!user) {
    // Aquí podrías mostrar un loader o redirigir a una página de login
    return <Loader message="Cargando sesión..." />;
  }

  // Renderiza el componente adecuado según el estado actual del quiz
  switch (quizState) {
    case 'generating':
      return <Loader message="Generando preguntas con la IA..." />;
    
    case 'quiz':
      // Necesitarías tener un componente QuizView que reciba las preguntas
      // y llame a onComplete al finalizar.
      return (
        <div>
          <h2 className="text-2xl text-center">Componente QuizView iría aquí</h2>
          {/* <QuizView questions={questions} onComplete={handleQuizComplete} /> */}
          <button onClick={() => handleQuizComplete(8, [])}>Simular Fin del Quiz</button>
        </div>
      );

    case 'results':
      return (
        <ResultsView 
          score={score} 
          questions={questions}
          userAnswers={userAnswers}
          user={user}
          onReshuffle={handleReshuffle}
          // Fíjate que ya no pasamos onRestart
        />
      );

    case 'upload':
    default:
      return (
        <ImageUploader 
          onFilesSelect={setFiles}
          onSubmit={handleGenerateQuiz}
          numQuestions={numQuestions}
          onNumQuestionsChange={setNumQuestions}
        />
      );
  }
};

export default PaginaPrincipal;