// src/services/geminiService.ts

import { Question } from '../types';

/**
 * Envia archivos (imagen o PDF) al backend para que la IA genere preguntas.
 * @param files Archivos subidos por el usuario
 * @param numQuestions Número de preguntas que se desean generar
 * @returns Lista de preguntas generadas por la IA
 */
export const generateQuizFromImageAndText = async (files: File[], numQuestions: number): Promise<Question[]> => {
  const base64Files = await Promise.all(
    files.map(file => {
      return new Promise<{ base64: string; mimeType: string }>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve({ base64, mimeType: file.type });
        };
        reader.readAsDataURL(file);
      });
    })
  );

  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: base64Files, numQuestions }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Error al generar cuestionario');
  }

  const data = await response.json();
  return data.questions;
};
