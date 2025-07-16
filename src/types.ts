// src/types.ts

export enum AppState {
  IDLE,
  GENERATING,
  QUIZ,
  RESULTS,
  ERROR,
  SAVED_QUIZZES,
  PRIVACY,
  LIMIT_REACHED, // <-- AÑADE ESTA LÍNEA
}

// ... el resto de tus tipos (Question, SavedQuiz, etc.) sigue igual