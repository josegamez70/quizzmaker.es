import React, { useState, useEffect } from 'react';
import { Question } from '../types.ts';
import { CheckCircleIcon, XCircleIcon, HomeIcon } from './icons.tsx';

interface QuizViewProps {
  questions: Question[];
  onFinish: (score: number, answers: (string | null)[]) => void;
  onRestart: () => void;
  onSaveInProgress: (quiz: Question[], userAnswers: (string | null)[], currentScore: number) => void; // ✨ NUEVO PROP
  initialUserAnswers: (string | null)[]; // ✨ NUEVO PROP para inicializar
  initialScore: number; // ✨ NUEVO PROP para inicializar
  isPro: boolean;
  attempts: number;
}

const QuizView: React.FC<QuizViewProps> = ({
  questions,
  onFinish,
  onRestart,
  onSaveInProgress, // ✨ Desestructuramos el nuevo prop
  initialUserAnswers, // ✨ Desestructuramos para inicializar
  initialScore, // ✨ Desestructuramos para inicializar
  isPro,
  attempts,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(initialScore); // ✨ Inicializa con initialScore
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>(initialUserAnswers); // ✨ Inicializa con initialUserAnswers
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  // ✨ useEffect para inicializar userAnswers y score cuando las preguntas o props iniciales cambian
  useEffect(() => {
    // Si las preguntas cambian (ej. se carga un quiz nuevo o guardado),
    // y los initialUserAnswers son diferentes (ej. no son todos null),
    // o si el número de preguntas es diferente.
    if (initialUserAnswers.length !== questions.length || initialUserAnswers.some(a => a !== null) || initialScore !== 0) {
        setUserAnswers(initialUserAnswers);
        setScore(initialScore);
        // Buscar la primera pregunta sin respuesta para establecer el índice
        const firstUnanswered = initialUserAnswers.findIndex(answer => answer === null);
        setCurrentQuestionIndex(firstUnanswered !== -1 ? firstUnanswered : questions.length - 1);
        setSelectedAnswer(initialUserAnswers[firstUnanswered !== -1 ? firstUnanswered : questions.length - 1]);
        setIsAnswered(initialUserAnswers[firstUnanswered !== -1 ? firstUnanswered : questions.length - 1] !== null);
    } else {
        // Para un quiz completamente nuevo, asegurar que los estados estén limpios
        setUserAnswers(Array(questions.length).fill(null));
        setScore(0);
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setIsAnswered(false);
    }
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
          onFinish(score, userAnswers);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAnswered, currentQuestionIndex, questions.length, score, onFinish, userAnswers]);

  const handleAnswerSelect = (option: string) => {
    if (isAnswered) return;

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = option;
    setUserAnswers(newAnswers);

    setSelectedAnswer(option);
    setIsAnswered(true);
    // ✨ Usamos currentQuestion.answer como estaba en tu código original
    if (option === currentQuestion.answer) {
      setScore(prev => prev + 1);
    }
  };

  const getButtonClass = (option: string) => {
    if (!isAnswered) {
      // ✨ Usamos currentQuestion.answer como estaba en tu código original
      return 'bg-gray-700 hover:bg-gray-600';
    }
    // ✨ Usamos currentQuestion.answer como estaba en tu código original
    const isCorrect = option === currentQuestion.answer;
    const isSelected = option === selectedAnswer;

    if (isCorrect) return 'bg-green-600/80 ring-2 ring-green-400';
    if (isSelected && !isCorrect) return 'bg-red-600/80 ring-2 ring-red-400';

    return 'bg-gray-700 opacity-50';
  };

  // ✨ NUEVA FUNCIÓN para el botón "Guardar"
  const handleSaveClick = () => {
    onSaveInProgress(questions, userAnswers, score); // Pasamos el quiz, respuestas y score actuales
  };


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
            {/* ✨ Usamos currentQuestion.answer como estaba en tu código original */}
            {isAnswered && option === currentQuestion.answer && <CheckCircleIcon className="w-6 h-6 text-white" />}
            {isAnswered && option === selectedAnswer && option !== currentQuestion.answer && <XCircleIcon className="w-6 h-6 text-white" />}
          </button>
        ))}
      </div>

      {isAnswered && selectedAnswer !== currentQuestion.answer && currentQuestion.context && (
        <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Fragmento del documento:</p>
          <p className="text-gray-200 text-sm italic">{currentQuestion.context}</p>
        </div>
      )}

      {/* ✨ Botones de Navegación + Guardar */}
      <div className="flex justify-between items-center mt-6">
        {/* Este es el botón "Anterior", pero tu diseño original no lo tenía. Si quieres mantener la autoprogressión sin navegación manual, puedes eliminarlo */}
        {/* <button
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button> */}

        <div className="flex-grow text-center"> {/* Centrar el botón Guardar si no hay "Anterior" o "Siguiente" */}
            <button
                onClick={handleSaveClick}
                className="px-6 py-3 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-colors shadow-lg"
                title="Guarda tu progreso para continuar más tarde"
            >
                Guardar
            </button>
        </div>

        {/* El botón "Siguiente" lo gestiona la autoprogressión, pero si quieres uno manual, aquí iría.
        Para mantener tu lógica de autoprogressión, no necesitas un botón "Siguiente" visible. */}
        {/* <button
          onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
          disabled={currentQuestionIndex === questions.length - 1}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente
        </button> */}
      </div>

      <div className="mt-6 h-1 w-full bg-gray-700 rounded-full">
        <div
          className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${((currentQuestionIndex + (isAnswered ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default QuizView;