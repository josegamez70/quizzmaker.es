// src/components/QuizView.tsx
import React, { useState, useEffect } from 'react';
import { Question } from '../types'; // Asegúrate de que la ruta sea correcta

interface QuizViewProps {
  questions: Question[];
  onFinish: (score: number, userAnswers: (string | null)[]) => void;
  onRestart: () => void;
  onSaveInProgress: (quiz: Question[], userAnswers: (string | null)[]) => void; // NUEVO PROP
  userAnswers: (string | null)[]; // NUEVO PROP para inicializar y leer respuestas
  setUserAnswers: React.Dispatch<React.SetStateAction<(string | null)[]>>; // NUEVO PROP para actualizar respuestas
}

const QuizView: React.FC<QuizViewProps> = ({
  questions,
  onFinish,
  onRestart,
  onSaveInProgress, // Desestructuramos el nuevo prop
  userAnswers,     // Desestructuramos userAnswers
  setUserAnswers,  // Desestructuramos setUserAnswers
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  // Eliminamos el estado local `currentAnswers` porque ahora viene de `App.tsx`
  // const [currentAnswers, setCurrentAnswers] = useState<(string | null)[]>(
  //   Array(questions.length).fill(null)
  // );

  useEffect(() => {
    // Si la lista de preguntas cambia o userAnswers viene con datos,
    // asegúrate de que el tamaño de userAnswers coincida con las preguntas.
    // Esto es importante si se carga un cuestionario guardado con respuestas previas.
    if (userAnswers.length !== questions.length) {
      setUserAnswers(Array(questions.length).fill(null));
    }
    // Si se carga un cuestionario guardado, necesitamos restaurar el índice de la pregunta actual
    // a la primera pregunta sin responder, o a 0 si todas están respondidas.
    const firstUnansweredIndex = userAnswers.findIndex(answer => answer === null);
    setCurrentQuestionIndex(firstUnansweredIndex !== -1 ? firstUnansweredIndex : 0);
  }, [questions, userAnswers.length, setUserAnswers]);


  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers); // Usamos el setter pasado por props
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitQuiz = () => {
    let score = 0;
    questions.forEach((question, index) => {
      if (userAnswers[index] === question.correctAnswer) {
        score++;
      }
    });
    onFinish(score, userAnswers);
  };

  const handleSaveClick = () => {
    // Llama a la función onSaveInProgress del padre, pasándole el cuestionario y las respuestas actuales
    onSaveInProgress(questions, userAnswers);
  };

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) {
    return <div className="text-center text-red-500">Error: No se pudo cargar la pregunta.</div>;
  }

  return (
    <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-xl p-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-indigo-400 mb-6 text-center">
        Cuestionario
      </h2>
      <div className="text-sm text-gray-400 mb-4 text-center">
        Pregunta {currentQuestionIndex + 1} de {questions.length}
      </div>

      <div className="bg-gray-700 p-6 rounded-lg mb-6">
        <p className="text-lg font-medium mb-4 text-white">
          {currentQuestion.text}
        </p>
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              className={`w-full text-left p-3 rounded-md transition-all duration-200 ease-in-out
                ${userAnswers[currentQuestionIndex] === option
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-600 text-gray-200 hover:bg-gray-500 hover:text-white'
                }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center mt-6">
        <button
          onClick={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Anterior
        </button>

        {/* Botón de Guardar en Progreso */}
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
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 transition-colors"
          >
            Finalizar Cuestionario
          </button>
        ) : (
          <button
            onClick={goToNextQuestion}
            disabled={userAnswers[currentQuestionIndex] === null} // Deshabilita si no ha respondido
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
          </button>
        )}
      </div>

      <div className="flex justify-center mt-4">
        <button
          onClick={onRestart}
          className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
        >
          Reiniciar Cuestionario
        </button>
      </div>
    </div>
  );
};

export default QuizView;