// src/services/geminiService.ts
import type { Question } from '../types';

export async function generateQuizFromImageAndText(files: File[], numQuestions: number): Promise<Question[]> {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  formData.append('numQuestions', numQuestions.toString());
  
  const response = await fetch('/.netlify/functions/generate-quiz', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }
  return await response.json();
}