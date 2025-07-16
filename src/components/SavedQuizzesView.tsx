
import React, { useState, useEffect } from 'react';
import { SavedQuiz, Question } from '../types.ts';
import { HomeIcon } from './icons.tsx';
import { supabase } from '../supabaseClient.ts';
import Loader from './Loader.tsx';

interface SavedQuizzesViewProps {
  onViewQuiz: (quiz: SavedQuiz) => void;
  onGoHome: () => void;
}

const SavedQuizzesView: React.FC<SavedQuizzesViewProps> = ({ onViewQuiz, onGoHome }) => {
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else if (data) {
        const formattedQuizzes: SavedQuiz[] = data.map(q => ({
          id: q.id,
          date: q.created_at,
          score: q.score,
          totalQuestions: q.total_questions,
          questions: q.questions_data as unknown as Question[],
          userAnswers: q.user_answers_data as unknown as (string | null)[],
        }));
        setSavedQuizzes(formattedQuizzes);
      }
      setLoading(false);
    };

    fetchQuizzes();
  }, []);

  const renderContent = () => {
    if (loading) {
      return <div className="flex justify-center py-12"><Loader text="Cargando tus cuestionarios..." /></div>;
    }

    if (error) {
      return <div className="text-center py-12 text-red-500">Error al cargar: {error}</div>;
    }

    if (savedQuizzes.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No tienes cuestionarios guardados todavía.</p>
                <p className="text-gray-500 mt-2">Crea un cuestionario y guárdalo para verlo aquí.</p>
            </div>
        );
    }
    
    return (
        <ul className="space-y-4">
            {savedQuizzes.map((quiz) => (
                <li key={quiz.id} className="bg-gray-900 p-4 rounded-lg border border-gray-700/50 hover:border-indigo-500 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-grow">
                        <p className="font-semibold text-white">Cuestionario del {new Date(quiz.date).toLocaleString()}</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Puntuación: <span className="font-bold text-indigo-400">{quiz.score} / {quiz.totalQuestions}</span>
                        </p>
                    </div>
                    <button
                        onClick={() => onViewQuiz(quiz)}
                        className="px-4 py-2 w-full sm:w-auto bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors text-sm flex-shrink-0"
                    >
                        Ver Resultados
                    </button>
                </li>
            ))}
        </ul>
    );
  };

  return (
    <div className="w-full max-w-4xl p-6 sm:p-8 bg-gray-800 rounded-2xl shadow-2xl animate-fade-in">
        <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
            <h2 className="text-3xl font-bold text-white">Mis Cuestionarios</h2>
            <button onClick={onGoHome} className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" title="Volver al inicio">
                <HomeIcon className="w-7 h-7" />
            </button>
        </div>
        {renderContent()}
    </div>
  );
};

export default SavedQuizzesView;
