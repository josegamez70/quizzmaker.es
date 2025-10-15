// src/types.ts

export interface Question {
  question: string;
  options: string[];
  answer: string; // ✨ Mantenemos 'answer' como estaba en tu código original
  context?: string; // 🔹 Nuevo campo con fragmento del PDF relacionado
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
  id: string; // ✨ AÑADIDO: El ID único del cuestionario guardado
  user_id: string; // ✨ AÑADIDO: El ID del usuario que guardó el cuestionario
  title: string; // ✨ AÑADIDO: Título del cuestionario (ej. "Cuestionario en progreso")
  score: number;
  questions: Question[];
  userAnswers: (string | null)[];
  created_at: string; // ✨ AÑADIDO: Timestamp de cuándo se guardó
  is_completed: boolean; // ✨ AÑADIDO: Para saber si está terminado o en progreso
  // total_questions: number; // No lo incluimos aquí porque tu SavedQuiz original no lo tenía.
                          // Tu tabla de Supabase sí lo tiene, se enviará/recuperará pero no estará tipado aquí.
}