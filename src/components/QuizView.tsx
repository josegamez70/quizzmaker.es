import React, { useState, useEffect, useCallback } from 'react';
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
  currentQuizId,
  isPro,
  attempts,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(initialScore);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>(initialUserAnswers);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  
  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    console.log("QuizView: Prop 'currentQuizId' recibido:", currentQuizId);
  }, [currentQuizId]);

  useEffect(() => {
    setUserAnswers(initialUserAnswers);
    setScore(initialScore);

    const firstUnanswered = initialUserAnswers.findIndex(answer => answer === null);
    const startIndex = firstUnanswered !== -1 ? firstUnanswered : 0;

    setCurrentQuestionIndex(startIndex);
    setSelectedAnswer(initialUserAnswers[startIndex]);
    setIsAnswered(initialUserAnswers[startIndex] !== null);

  }, [questions, initialUserAnswers, initialScore]);

  useEffect(() => {
    if (!isPro && attempts >= 4) {
      window.location.href = "/api/create-checkout-session";
      return;
    }
  }, [isPro, attempts]);

  useEffect(() => {
    if (isAnswered) {
      const timer = setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setSelectedAnswer(null);
          setIsAnswered(false);
        } else {
          onFinish(score, userAnswers, currentQuizId);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAnswered, currentQuestionIndex, questions.length, score, onFinish, userAnswers, currentQuizId]);

  const handleAnswerSelect = (option: string) => {
    if (isAnswered) return;

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = option;
    setUserAnswers(newAnswers);

    setSelectedAnswer(option);
    setIsAnswered(true);

    const isOptionCorrect = option.trim().toLowerCase() === currentQuestion.answer.trim().toLowerCase();
    
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
    const isCorrect = option.trim().toLowerCase() === currentQuestion.answer.trim().toLowerCase();
    const isSelected = option === selectedAnswer;

    if (isCorrect) return 'bg-green-600/80 ring-2 ring-green-400';
    if (isSelected && !isCorrect) return 'bg-red-600/80 ring-2 ring-red-400';

    return 'bg-gray-700 opacity-50';
  };

  const handleSaveClick = useCallback(async () => {
    console.log("QuizView: Llamando onSaveInProgress con prop 'currentQuizId':", currentQuizId);
    await onSaveInProgress(questions, userAnswers, score, currentQuizId);
  }, [onSaveInProgress, questions, userAnswers, score, currentQuizId]);


  // ✨ NUEVA LÓGICA: Deshabilitar el botón "Guardar" si es la última pregunta y ya ha sido respondida
  const isLastQuestionAnswered = currentQuestionIndex === questions.length - 1 && isAnswered;

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
            {isAnswered && option.trim().toLowerCase() === currentQuestion.answer.trim().toLowerCase() && <CheckCircleIcon className="w-6 h-6 text-white" />}
            {isAnswered && option === selectedAnswer && option.trim().toLowerCase() !== currentQuestion.answer.trim().toLowerCase() && <XCircleIcon className="w-6 h-6 text-white" />}
          </button>
        ))}
      </div>

      {isAnswered && selectedAnswer?.trim().toLowerCase() !== currentQuestion.answer.trim().toLowerCase() && currentQuestion.context && (
        <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Fragmento del documento:</p>
          <p className="text-gray-200 text-sm italic">{currentQuestion.context}</p>
        </div>
      )}

      <div className="flex justify-center items-center mt-6">
          <button
              onClick={handleSaveClick}
              // ✨ NUEVO: Deshabilitar el botón si es la última pregunta y ya se ha respondido
              disabled={isLastQuestionAnswered}
              className={`px-6 py-3 font-semibold rounded-lg transition-colors shadow-lg
                ${isLastQuestionAnswered ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-yellow-600 text-white hover:bg-yellow-700'}`}
              title={isLastQuestionAnswered ? "El cuestionario está a punto de finalizar. Se guardará automáticamente." : "Guarda tu progreso para continuar más tarde"}
          >
              Guardar
          </button>
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