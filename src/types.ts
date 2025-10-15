// src/types.ts

export interface Question {
  question: string;
  options: string[];
  correctAnswer: string; // ✨ CAMBIO: De 'answer' a 'correctAnswer' para consistencia con la lógica.
  context?: string;
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  QUIZ = 'QUIZ',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR',
  LIMIT_REACHED = 'LIMIT_REACHED',
  SAVED_QUIZZES = 'SAVED_QUIZZES',
  PRIVACY = 'PRIVACY'
}

export interface SavedQuiz {
  id: string; // ✨ AÑADIDO: UUID del cuestionario guardado
  user_id: string; // ✨ AÑADIDO: ID del usuario
  title: string; // ✨ AÑADIDO: Título del cuestionario
  score: number;
  questions: Question[];
  userAnswers: (string | null)[];
  created_at: string; // ✨ AÑADIDO: Fecha y hora de guardado
  is_completed: boolean; // ✨ AÑADIDO: Para indicar si está completo o en progreso
  // total_questions: number; // No es estrictamente necesario en SavedQuiz si ya tienes questions.length
}