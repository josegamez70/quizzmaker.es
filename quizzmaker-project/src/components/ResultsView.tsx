

import React, { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { Question } from '../types.ts';
import { Json } from '../database.types.ts';
import { CheckCircleIcon, XCircleIcon, PrinterIcon, SaveIcon } from './icons.tsx';
import { supabase } from '../supabaseClient.ts';

interface ResultsViewProps {
  score: number;
  questions: Question[];
  userAnswers: (string | null)[];
  onRestart: () => void;
  user: User;
}

const ResultsView: React.FC<ResultsViewProps> = ({ score, questions, userAnswers, onRestart, user }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const totalQuestions = questions.length;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  const getResultMessage = () => {
    if (percentage === 100) return "¡Felicidades! ¡Puntuación perfecta!";
    if (percentage >= 80) return "¡Excelente trabajo!";
    if (percentage >= 60) return "¡Buen trabajo! Sigue practicando.";
    if (percentage >= 40) return "No está mal, pero puedes mejorar.";
    return "Sigue estudiando y vuelve a intentarlo.";
  };
  
  const handlePrint = () => {
    window.print();
  };

  const handleSave = async () => {
     if (!user) return;
     setIsSaving(true);
     try {
        const { error } = await supabase.from('quizzes').insert([{
            user_id: user.id,
            score,
            total_questions: totalQuestions,
            questions_data: questions as unknown as Json,
            user_answers_data: userAnswers as unknown as Json,
        }]);

        if (error) throw error;
        
        setIsSaved(true);
    } catch (error: any) {
        console.error("Error al guardar el cuestionario:", error);
        alert(`Hubo un error al guardar el cuestionario: ${error.message}`);
    } finally {
        setIsSaving(false);
    }
  };

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
        <button
          onClick={onRestart}
          className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors"
        >
          Volver a Empezar
        </button>
        <button
          onClick={handleSave}
          disabled={isSaved || isSaving}
          className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 transition-colors flex items-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          <SaveIcon className="w-5 h-5" />
          {isSaving ? 'Guardando...' : isSaved ? 'Guardado' : 'Guardar'}
        </button>
        <button
          onClick={handlePrint}
          className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-400 transition-colors flex items-center gap-2"
        >
          <PrinterIcon className="w-5 h-5" />
          Imprimir
        </button>
      </div>

      <div className="space-y-6 print:space-y-4">
        <h3 className="text-2xl font-bold text-white mb-4 print:text-black">Revisión de Respuestas</h3>
        {questions.map((q, index) => {
          const userAnswer = userAnswers[index];
          const isCorrect = userAnswer === q.answer;
          return (
            <div key={index} className="bg-gray-900 p-4 rounded-lg border border-gray-700 print:border-gray-300 print:bg-white print:p-2 print:my-4">
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
                     <div className="mt-2 pt-2 border-t border-gray-700/50 print:border-gray-400">
                       <p className="text-sm text-gray-400 print:text-gray-600">Respuesta correcta:</p>
                       <p className="font-medium text-green-400 print:text-green-600">{q.answer}</p>
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