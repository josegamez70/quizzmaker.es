// src/services/geminiService.ts

import type { Question } from '../types';

// Función auxiliar para convertir un archivo a una cadena base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]); // Quitamos el prefijo 'data:...'
    reader.onerror = error => reject(error);
  });
};

export async function generateQuizFromImageAndText(files: File[], numQuestions: number): Promise<Question[]> {
  try {
    // 1. Convertimos todos los archivos a base64
    const filePayloads = await Promise.all(
      files.map(async (file) => ({
        base64Data: await fileToBase64(file),
        mimeType: file.type,
      }))
    );
    
    // 2. Preparamos el cuerpo de la petición como un objeto JSON
    const requestBody = {
      files: filePayloads,
      numQuestions: numQuestions,
    };

    // 3. Hacemos la llamada a nuestra API de Netlify
    const response = await fetch('/.netlify/functions/generate-quiz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `El servidor respondió con el estado: ${response.status}`);
    }
    
    const data: Question[] = await response.json();
    return data;

  } catch (error) {
    console.error("Error al generar el cuestionario desde nuestra API:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Ocurrió un error desconocido al comunicarse con el servidor.");
  }
};