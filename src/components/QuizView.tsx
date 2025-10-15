import React, { useState, useEffect } from 'react';
import { Question } from '../types.ts';
import { CheckCircleIcon, XCircleIcon, HomeIcon } from './icons.tsx';

interface QuizViewProps {
  questions: Question[];
  onFinish: (score: number, userAnswers: (string | null)[]) => void;
  onRestart: () => void;
  onSaveInProgress: (quiz: Question[], userAnswers: (string | null)[]) => void; // ✨ NUEVO PROP
  userAnswers: (string | null)[]; // ✨ PASAMOS EL ESTADO DE RESPUESTAS DESDE App.tsx
  setUserAnswers: React.Dispatch<React.SetStateAction<(string | null)[]>>; // ✨ PASAMOS EL SETTER DESDE App.tsx
  // Eliminados isPro y attempts, ya que la lógica de redirección se gestiona en App.tsx
}

const QuizView: React.FC<QuizViewProps> = ({
  questions,
  onFinish,
  onRestart,
  onSaveInProgress,
  userAnswers,
  setUserAnswers,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false); // Indica si la pregunta actual ha sido respondida

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    // Si se carga un cuestionario guardado, restaurar el índice a la primera pregunta sin responder
    // o al final si todas están respondidas.
    const firstUnansweredIndex = userAnswers.findIndex(answer => answer === null);
    if (firstUnansweredIndex !== -1 && currentQuestionIndex !== firstUnansweredIndex) {
      setCurrentQuestionIndex(firstUnansweredIndex);
    } else if (firstUnansweredIndex === -1 && currentQuestionIndex !== questions.length - 1) {
      // Si todas están respondidas, ir a la última o manejar según se prefiera
      setCurrentQuestionIndex(questions.length - 1);
    }

    // Asegurarse de que el selectedAnswer refleje la respuesta guardada si existe
    setSelectedAnswer(userAnswers[currentQuestionIndex]);
    setIsAnswered(userAnswers[currentQuestionIndex] !== null);

  }, [questions, userAnswers, currentQuestionIndex]); // Dependencias para re-ejecutar el efecto


  const handleAnswerSelect = (option: string) => {
    // Permitir cambiar la respuesta si la pregunta no está "finalizada" (no hay autoprogressión)
    // o si aún no se ha marcado como respondida
    if (isAnswered && userAnswers[currentQuestionIndex] === option) return; // Si ya está respondida con la misma opción, no hacer nada

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = option;
    setUserAnswers(newAnswers); // Actualizamos el estado en App.tsx

    setSelectedAnswer(option);
    setIsAnswered(true); // Marca la pregunta como respondida (visualización de colores)
  };

  const calculateCurrentScore = (): number => {
    return questions.reduce((acc, question, index) => {
      // ✨ CAMBIO AQUÍ: Usar question.correctAnswer
      return acc + (userAnswers[index] === question.correctAnswer ? 1 : 0);
    }, 0);
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(userAnswers[currentQuestionIndex + 1]); // Restaurar la respuesta si ya existía
      setIsAnswered(userAnswers[currentQuestionIndex + 1] !== null);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswer(userAnswers[currentQuestionIndex - 1]); // Restaurar la respuesta si ya existía
      setIsAnswered(userAnswers[currentQuestionIndex - 1] !== null);
    }
  };

  const handleSubmitQuiz = () => {
    const finalScore = calculateCurrentScore();
    onFinish(finalScore, userAnswers); // Notifica a App.tsx con el score final y todas las respuestas
  };

  const handleSaveClick = () => {
    onSaveInProgress(questions, userAnswers); // Llama a la función del padre
  };

  const getButtonClass = (option: string) => {
    const isCorrect = option === currentQuestion.correctAnswer; // ✨ CAMBIO AQUÍ: Usar question.correctAnswer
    const isSelected = option === userAnswers[currentQuestionIndex]; // Usar userAnswers del estado principal

    if (!isAnswered && isSelected) { // Si aún no se ha "confirmado" la respuesta pero está seleccionada
      return 'bg-indigo-600 text-white';
    }
    
    // Si la pregunta ya ha sido respondida (isAnswered es true)
    if (isAnswered) {
      if (isCorrect) return 'bg-green-600/80 ring-2 ring-green-400';
      if (isSelected && !isCorrect) return 'bg-red-600/80 ring-2 ring-red-400';
      
      return 'bg-gray-700 opacity-50'; // Opciones no seleccionadas o incorrectas
    }

    // Si la pregunta no ha sido respondida y no hay autoprogressión
    return 'bg-gray-700 hover:bg-gray-600';
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
            // Ya no deshabilitamos si está respondida, permitimos cambiar la respuesta antes de pasar a la siguiente
            // disabled={isAnswered} // Eliminar o ajustar esta línea
            className={`w-full text-left p-4 rounded-lg text-white font-medium transition-all duration-300 flex items-center justify-between ${getButtonClass(option)}`}
          >
            <span>{option}</span>
            {/* Solo muestra iconos si la pregunta actual ha sido marcada como respondida */}
            {isAnswered && option === currentQuestion.correctAnswer && <CheckCircleIcon className="w-6 h-6 text-white" />}
            {isAnswered && option === userAnswers[currentQuestionIndex] && option !== currentQuestion.correctAnswer && <XCircleIcon className="w-6 h-6 text-white" />}
          </button>
        ))}
      </div>

      {/* Mostrar contexto solo si la pregunta ha sido respondida y la respuesta fue incorrecta */}
      {isAnswered && userAnswers[currentQuestionIndex] !== currentQuestion.correctAnswer && currentQuestion.context && (
        <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Fragmento del documento:</p>
          <p className="text-gray-200 text-sm italic">{currentQuestion.context}</p>
        </div>
      )}

      <div className="mt-6 flex justify-between items-center">
        <button
          onClick={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>

        <button
          onClick={handleSaveClick}
          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-500 transition-colors"
          title="Guarda tu progreso para continuar más tarde"
        >
          Guardar
        </button>

        {currentQuestionIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmitQuiz}
            disabled={userAnswers[currentQuestionIndex] === null} // Deshabilita si no ha respondido la última pregunta
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Finalizar Cuestionario
          </button>
        ) : (
          <button
            onClick={goToNextQuestion}
            disabled={userAnswers[currentQuestionIndex] === null} // Deshabilita si no ha respondido la pregunta actual
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
          </button>
        )}
      </div>

      <div className="mt-6 h-1 w-full bg-gray-700 rounded-full">
        <div
          className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${((currentQuestionIndex + (userAnswers[currentQuestionIndex] !== null ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default QuizView;