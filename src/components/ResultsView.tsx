import React, { useState, useEffect } from 'react'; // ✨ Añadimos useEffect
import type { User } from '@supabase/supabase-js';
import { Question } from '../types.ts';
import { CheckCircleIcon, XCircleIcon, PrinterIcon, SaveIcon, RetryIcon } from './icons.tsx';
import { supabase } from '../supabaseClient.ts';

interface ResultsViewProps {
  score: number;
  questions: Question[];
  userAnswers: (string | null)[];
  onRestart: () => void;
  onReshuffle: () => void;
  user: User | null; // El usuario de la sesión (puede ser null)
  // ✨ NUEVOS PROPS
  currentQuizId: string | null; // El ID del quiz si existe
  isSavedAsCompleted: boolean; // Si el quiz ya fue guardado como completado
  onSaveResults: (score: number, answers: (string | null)[], quizId: string | null) => void; // Función para guardar resultados
}

const ResultsView: React.FC<ResultsViewProps> = ({
  score,
  questions,
  userAnswers,
  onRestart,
  onReshuffle,
  user,
  currentQuizId,
  isSavedAsCompleted: propIsSavedAsCompleted, // Renombramos el prop
  onSaveResults,
}) => {
  // ✨ Estado local para controlar el botón de guardar en ResultsView
  // Se inicializa con el prop, pero puede cambiar si el usuario pulsa "Guardar" aquí.
  const [isSavedLocally, setIsSavedLocally] = useState(propIsSavedAsCompleted);
  const [isSaving, setIsSaving] = useState(false);

  // ✨ Sincronizar el estado local con el prop si el prop cambia
  useEffect(() => {
    setIsSavedLocally(propIsSavedAsCompleted);
  }, [propIsSavedAsCompleted]);


  const totalQuestions = questions.length;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const getResultMessage = () => {
    if (percentage === 100) return "¡Felicidades! ¡Puntuación perfecta!";
    if (percentage >= 80) return "¡Excelente trabajo!";
    if (percentage >= 60) return "¡Buen trabajo! Sigue practicando.";
    if (percentage >= 40) return "No está mal, pero puedes mejorar.";
    return "Sigue estudiando y vuelve a intentarlo.";
  };
  
  const handlePrint = () => window.print();

  // ✨ Función para manejar el guardado desde ResultsView
  const handleSave = async () => {
     if (!user) {
         alert("Debes iniciar sesión para guardar tus resultados.");
         return;
     }
     if (isSavedLocally) {
         alert("Este cuestionario ya ha sido guardado como completado.");
         return;
     }

     setIsSaving(true);
     try {
        // Llamar a la función onSaveResults de App.tsx para guardar/actualizar el estado final
        // onSaveResults es handleQuizFinish en App.tsx.
        // Después de que se complete, App.tsx establecerá isCurrentQuizSavedAsCompleted a true.
        await onSaveResults(score, userAnswers, currentQuizId);
        setIsSavedLocally(true); // Actualizamos el estado local del botón
    } catch (error: any) {
        console.error("Error al guardar el cuestionario desde ResultsView:", error);
        alert(`Hubo un error al guardar el cuestionario: ${error.message}`);
    } finally {
        setIsSaving(false);
    }
  };

  // Determinar si el botón "Guardar" debe estar deshabilitado
  // Estará deshabilitado si ya fue guardado como completado (según estado local), o si no hay user loggeado
  const isSaveButtonDisabled = isSavedLocally || isSaving || !user;
  const saveButtonTitle = isSaving
    ? "Guardando..."
    : isSavedLocally
    ? "Este cuestionario ya está guardado"
    : !user
    ? "Inicia sesión para guardar tus resultados"
    : "Guardar resultados de este cuestionario";

  return (
    <div className="w-full max-w-4xl p-6 sm:p-8 bg-gray-800 rounded-2xl shadow-2xl animate-fade-in print:bg-white print:text-black print:shadow-none print:p-0">
      <div className="text-center border-b border-gray-700 pb-6 mb-6 print:border-b-2 print:border-black">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white print:text-black">Resultados del Cuestionario</h2>
        <p className="mt-2 text-lg text-gray-400 print:text-gray-600">{getResultMessage()}</p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
          <div className="flex flex-col items-center">
            <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 print:text-black">{score}/{totalQuestions}</span>
            <span className="text-sm font-medium text-gray-300 print:text-gray-700">Respuestas Correctas</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 print:text-black">{percentage}%</span>
            <span className="text-sm font-medium text-gray-300 print:text-gray-700">Puntuación</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center flex-wrap gap-4 my-6 print:hidden">
        <button onClick={onRestart} className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
          Volver a Empezar
        </button>
        <button onClick={onReshuffle} className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 flex items-center gap-2">
          <RetryIcon className="w-5 h-5" />
          Reintentar
        </button>
        <button
          onClick={handleSave}
          disabled={isSaveButtonDisabled}
          title={saveButtonTitle}
          className={`px-6 py-3 font-semibold rounded-lg transition-colors flex items-center gap-2
            ${isSaveButtonDisabled ? 'bg-gray-500 text-gray-300 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
        >
          <SaveIcon className="w-5 h-5" />
          {isSaving ? 'Guardando...' : isSavedLocally ? 'Guardado' : 'Guardar'}
        </button>
        <button onClick={handlePrint} className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 flex items-center gap-2">
          <PrinterIcon className="w-5 h-5" />
          Imprimir
        </button>
      </div>

      <div className="space-y-6 print:space-y-4">
        <h3 className="text-2xl font-bold text-white mb-4 print:text-black">Revisión de Respuestas</h3>
        {questions.map((q, index) => {
          const userAnswer = userAnswers[index];
          const isCorrect = userAnswer?.trim().toLowerCase() === q.answer.trim().toLowerCase();
          return (
            <div key={index} className="bg-gray-900 p-4 rounded-lg border border-gray-700 print:border-gray-300 print:bg-white">
              <p className="font-semibold text-white print:text-black">{index + 1}. {q.question}</p>
              <div className={`mt-3 flex items-start gap-3 p-3 rounded-md ${isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                {isCorrect ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                ) : (
                    <XCircleIcon className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                )}
                <div className="flex-grow">
                   <p className="text-sm text-gray-400 print:text-gray-600">Tu respuesta:</p>
                   <p className={`font-medium ${isCorrect ? 'text-green-400' : 'text-red-400'} print:text-black`}>
                     {userAnswer ?? <span className="italic">No respondida</span>}
                   </p>
                   {!isCorrect && (
                     <div className="mt-2 pt-2 border-t border-gray-700/50">
                       <p className="text-sm text-gray-400 print:text-gray-600">Respuesta correcta:</p>
                       <p className="font-medium text-green-400 print:text-green-600">{q.answer}</p>

                       {q.context && (
                         <div className="mt-2">
                           <p className="text-sm text-gray-400 print:text-gray-600">Fragmento del documento:</p>
                           <p className="text-gray-200 text-sm italic print:text-black">{q.context}</p>
                         </div>
                       )}
                     </div>
                   )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResultsView;