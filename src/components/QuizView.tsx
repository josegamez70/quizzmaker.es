import React, { useState, useEffect } from 'react';
import { Question } from '../types.ts';
import { CheckCircleIcon, XCircleIcon, HomeIcon } from './icons.tsx';

interface QuizViewProps {
  questions: Question[];
  onFinish: (score: number, answers: (string | null)[], quizId: string | null) => void;
  onRestart: () => void;
  onSaveInProgress: (quiz: Question[], userAnswers: (string | null)[], currentScore: number, quizIdToSave: string | null) => void;
  initialUserAnswers: (string | null)[];
  initialScore: number;
  currentQuizId: string | null;
  isPro: boolean;
  attempts: number;
}

const QuizView: React.FC<QuizViewProps> = ({
  questions,
  onFinish,
  onRestart,
  onSaveInProgress,
  initialUserAnswers,
  initialScore,
  currentQuizId: propCurrentQuizId, // Renombramos el prop para evitar conflicto con el estado local
  isPro,
  attempts,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(initialScore);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>(initialUserAnswers);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [localQuizId, setLocalQuizId] = useState<string | null>(propCurrentQuizId); // Estado local para el ID

  const currentQuestion = questions[currentQuestionIndex];

  // ✨ useEffect para inicializar localQuizId con el prop cuando cambia
  useEffect(() => {
    console.log("QuizView: propCurrentQuizId cambió:", propCurrentQuizId); // ✨ Log para depuración
    // Solo actualizar si el prop es diferente del estado local actual para evitar bucles.
    // También, importante, si el prop cambia de null a un ID, queremos que se actualice.
    if (propCurrentQuizId !== localQuizId) {
        setLocalQuizId(propCurrentQuizId);
        console.log("QuizView: localQuizId actualizado a:", propCurrentQuizId);
    }
  }, [propCurrentQuizId, localQuizId]); // localQuizId como dependencia aquí es para que se vuelva a ejecutar si lo cambiamos internamente

  // useEffect para inicializar userAnswers y score cuando las preguntas o props iniciales cambian
  useEffect(() => {
    setUserAnswers(initialUserAnswers);
    setScore(initialScore);

    const firstUnanswered = initialUserAnswers.findIndex(answer => answer === null);
    const startIndex = firstUnanswered !== -1 ? firstUnanswered : 0;

    setCurrentQuestionIndex(startIndex);
    setSelectedAnswer(initialUserAnswers[startIndex]);
    setIsAnswered(initialUserAnswers[startIndex] !== null);

  }, [questions, initialUserAnswers, initialScore]);


  // Tu useEffect original para la lógica de intentos Pro
  useEffect(() => {
    if (!isPro && attempts >= 4) {
      window.location.href = "/api/create-checkout-session";
      return;
    }
  }, [isPro, attempts]);

  // Tu useEffect original para la autoprogressión
  useEffect(() => {
    if (isAnswered) {
      const timer = setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setSelectedAnswer(null);
          setIsAnswered(false);
        } else {
          onFinish(score, userAnswers, localQuizId); // USAR localQuizId al finalizar
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAnswered, currentQuestionIndex, questions.length, score, onFinish, userAnswers, localQuizId]);

  const handleAnswerSelect = (option: string) => {
    if (isAnswered) return;

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = option;
    setUserAnswers(newAnswers);

    setSelectedAnswer(option);
    setIsAnswered(true);

    // COMPROBACIÓN DE RESPUESTA MÁS ROBUSTA
    const isOptionCorrect = option.trim().toLowerCase() === currentQuestion.answer.trim().toLowerCase();
    
    // AÑADE ESTOS CONSOLE.LOGS PARA DEPURACIÓN
    console.log("Opción seleccionada:", option);
    console.log("Respuesta correcta esperada (currentQuestion.answer):", currentQuestion.answer);
    console.log("¿Coinciden (estricto)?", option === currentQuestion.answer);
    console.log("¿Coinciden (trim y lowercase)?", isOptionCorrect);


    if (isOptionCorrect) {
      setScore(prev => prev + 1);
    }
  };

  const getButtonClass = (option: string) => {
    if (!isAnswered) {
      return 'bg-gray-700 hover:bg-gray-600';
    }
    // Usamos la comparación robusta para determinar la corrección
    const isCorrect = option.trim().toLowerCase() === currentQuestion.answer.trim().toLowerCase();
    const isSelected = option === selectedAnswer;

    if (isCorrect) return 'bg-green-600/80 ring-2 ring-green-400';
    if (isSelected && !isCorrect) return 'bg-red-600/80 ring-2 ring-red-400';

    return 'bg-gray-700 opacity-50';
  };

  const handleSaveClick = async () => {
    // Pasamos localQuizId a onSaveInProgress
    await onSaveInProgress(questions, userAnswers, score, localQuizId);
  };

  if (!currentQuestion) {
    return <div className="text-center text-red-500">Error: No se pudo cargar la pregunta.</div>;
  }

  return (
    <div className="w-full max-w-3xl p-6 sm:p-8 bg-gray-800 rounded-2xl shadow-2xl animate-fade-in relative">
      <button onClick={onRestart} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors" title="Volver al inicio">
        <HomeIcon className="w-7 h-7" />
      </button>
      <div className="mb-6">
        <p className="text-sm font-medium text-indigo-400">
          Pregunta {currentQuestionIndex + 1} de {questions.length}
        </p>
        <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-white pr-10">
          {currentQuestion.question}
        </h2>
      </div>
      <div className="space-y-4">
        {currentQuestion.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswerSelect(option)}
            disabled={isAnswered}
            className={`w-full text-left p-4 rounded-lg text-white font-medium transition-all duration-300 flex items-center justify-between ${getButtonClass(option)}`}
          >
            <span>{option}</span>
            {/* Usamos la comparación robusta para la visualización de iconos */}
            {isAnswered && option.trim().toLowerCase() === currentQuestion.answer.trim().toLowerCase() && <CheckCircleIcon className="w-6 h-6 text-white" />}
            {isAnswered && option === selectedAnswer && option.trim().toLowerCase() !== currentQuestion.answer.trim().toLowerCase() && <XCircleIcon className="w-6 h-6 text-white" />}
          </button>
        ))}
      </div>

      {isAnswered && selectedAnswer?.trim().toLowerCase() !== c