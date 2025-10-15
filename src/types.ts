export interface Question {
  question: string;
  options: string[];
  answer: string;
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
  score: number;
  questions: Question[];
  userAnswers: (string | null)[];
}
