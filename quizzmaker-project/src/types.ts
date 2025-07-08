
export enum AppState {
  IDLE,
  GENERATING,
  QUIZ,
  RESULTS,
  ERROR,
  SAVED_QUIZZES,
}

export interface Question {
  question: string;
  options: string[];
  answer: string;
}

export interface SavedQuiz {
  id: string;
  date: string;
  score: number;
  totalQuestions: number;
  questions: Question[];
  userAnswers: (string | null)[];
}
