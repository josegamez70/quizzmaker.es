// src/views/QuizView.tsx
import React, { useEffect, useState } from "react";
import { getQuizFromPDF } from "../services/geminiService";
import { Quiz, QuizQuestion } from "../types";
import QuizComponent from "../components/QuizComponent";
import { supabase } from "../supabaseClient";
import { createCheckoutSession } from "../services/stripeService";
import { useSession } from "@supabase/auth-helpers-react";

interface QuizViewProps {
  pdfText: string;
  onReset: () => void;
}

const QuizView: React.FC<QuizViewProps> = ({ pdfText, onReset }) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const session = useSession();

  useEffect(() => {
    const fetchQuiz = async () => {
      const generatedQuiz = await getQuizFromPDF(pdfText);
      setQuiz(generatedQuiz);
      setUserAnswers(Array(generatedQuiz.questions.length).fill(null));
    };

    fetchQuiz();
  }, [pdfText]);

  useEffect(() => {
    const checkUserPro = async () => {
      if (!session?.user) return;
      const { data, error } = await supabase
        .from("users")
        .select("is_pro")
        .eq("id", session.user.id)
        .single();

      if (data?.is_pro) {
        setIsPro(true);
      }
    };

    checkUserPro();
  }, [session]);

  const handleAnswer = (answer: string) => {
    if (!quiz) return;
    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentQuestionIndex] = answer;
    setUserAnswers(updatedAnswers);

    const isCorrect = answer === quiz.questions[currentQuestionIndex].correctAnswer;
    if (!isCorrect) {
      setAttempts((prev) => {
        const newAttempts = prev + 1;
        if (newAttempts >= 4 && !isPro) {
          alert("Has alcanzado el límite de intentos. Redirigiendo a la compra Pro...");
          createCheckoutSession();
        }
        return newAttempts;
      });
    }

    setTimeout(() => {
      setCurrentQuestionIndex((prev) => prev + 1);
    }, 1000);
  };

  if (!quiz) return <p className="text-white">Cargando cuestionario...</p>;
  if (currentQuestionIndex >= quiz.questions.length)
    return (
      <div className="text-white text-center">
        <h2 className="text-xl font-bold mb-4">¡Has completado el cuestionario!</h2>
        <button
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded"
          onClick={onReset}
        >
          Volver
        </button>
      </div>
    );

  return (
    <div className="p-4">
      <QuizComponent
        question={quiz.questions[currentQuestionIndex]}
        onAnswer={handleAnswer}
        selectedAnswer={userAnswers[currentQuestionIndex]}
      />
    </div>
  );
};

export default QuizView;
