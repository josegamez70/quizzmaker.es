import React, { useState, useEffect } from 'react';
import { Question } from '../types.ts';
import { CheckCircleIcon, XCircleIcon, HomeIcon } from './icons.tsx';

interface QuizViewProps {
  questions: Question[];
  onFinish: (score: number, answers: (string | null)[]) => void;
  onRestart: () => void;
}

const QuizView: React.FC<QuizViewProps> = ({ questions, onFinish, onRestart }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>(Array(questions.length).fill(null));
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

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
    if (option === currentQuestion.answer) {
      setScore(prev => prev + 1);
    }
  };

  const getButtonClass = (option: string) => {
    if (!isAnswered) {
      return 'bg-gray-700 hover:bg-gray-600';
    }
    const isCorrect = option === currentQuestion.answer;
    const isSelected = option === selectedAnswer;

    if (isCorrect) return 'bg-green-600/80 ring-2 ring-green-400';
    if (isSelected && !isCorrect) return 'bg-red-600/80 ring-2 ring-red-400';
    
    return 'bg-gray-700 opacity-50';
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
            {isAnswered && option === currentQuestion.answer && <CheckCircleIcon className="w-6 h-6 text-white"/>}
            {isAnswered && option === selectedAnswer && option !== currentQuestion.answer && <XCircleIcon className="w-6 h-6 text-white"/>}
          </button>
        ))}
      </div>

      {/* 🔹 Mostrar contexto si la respuesta fue incorrecta */}
      {isAnswered && selectedAnswer !== currentQuestion.answer && currentQuestion.context && (
        <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Fragmento del documento:</p>
          <p className="text-gray-200 text-sm italic">{currentQuestion.context}</p>
        </div>
      )}

      <div className="mt-6 h-1 w-full bg-gray-700 rounded-full">
        <div 
            className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{width: `${((currentQuestionIndex + (isAnswered ? 1 : 0)) / questions.length) * 100}%`}}
        />
      </div>
    </div>
  );
};

export default QuizView;
