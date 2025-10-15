// src/types.ts

export interface Question {
  question: string;
  options: string[];
  answer: string; // Mantenido como 'answer' según tu código original
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
  id: string; // ID único del cuestionario guardado
  user_id: string; // ID del usuario que guardó el cuestionario
  title: string; // Título del cuestionario (ej. "Cuestionario en progreso")
  score: number;
  questions: Question[];
  userAnswers: (string | null)[];
  created_at: string; // Timestamp de cuándo se guardó
  is_completed: boolean; // Para saber si está terminado o en progreso
}