// src/services/geminiService.ts

import {
  GoogleGenerativeAI,
  GenerationConfig,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import type { Question } from '../types';

// 1. Leemos la clave de API desde las variables de entorno.
const API_KEY = import.meta.env.VITE_API_KEY;

// 2. Comprobamos que la clave existe.
if (!API_KEY) {
  throw new Error('La clave de API no está configurada. Revisa tu archivo .env o las variables de entorno de Netlify.');
}

// 3. Inicializamos el cliente de Google AI con nuestra clave.
const genAI = new GoogleGenerativeAI(API_KEY);

// 4. Definimos la configuración para la generación de contenido.
const generationConfig: GenerationConfig = {
  temperature: 0.4,
  topK: 32,
  topP: 1,
  maxOutputTokens: 8192,
};

// 5. Definimos los ajustes de seguridad.
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// 6. Función auxiliar para convertir un archivo a un formato que la IA entiende.
async function fileToGenerativePart(file: File) {
  const base64EncodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: base64EncodedData, mimeType: file.type },
  };
}

// 7. La función principal que se comunica con la IA.
export async function generateQuizFromImageAndText(files: File[], numQuestions: number): Promise<Question[]> {
  try {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash-latest", // El modelo más reciente y estable
        generationConfig,
        safetySettings
    });

    const fileParts = await Promise.all(files.map(fileToGenerativePart));

    const prompt = `
      Analiza la siguiente imagen o documento. Genera un cuestionario de ${numQuestions} preguntas de opción múltiple con 4 opciones (A, B, C, D) basadas en el contenido.
      Formatea la salida estrictamente como un array de objetos JSON, sin ninguna otra explicación o texto introductorio. Cada objeto debe tener los siguientes campos: "question" (string), "options" (array de 4 strings), y "answer" (string que coincida exactamente con una de las opciones).
      Ejemplo de formato de salida:
      [
        {
          "question": "¿Cuál es la capital de Francia?",
          "options": ["Berlín", "Madrid", "París", "Roma"],
          "answer": "París"
        }
      ]
    `;

    const result = await model.generateContent([prompt, ...fileParts]);
    const response = result.response;
    const text = response.text();

    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.substring(7, cleanedText.length - 3).trim();
    }
    
    const questions = JSON.parse(cleanedText);
    return questions;

  } catch (error) {
    console.error("Error completo de Gemini:", error);
    throw new Error("No se pudo comunicar con la IA. Por favor, verifica que tu clave de API sea correcta y que el modelo 'gemini-1.5-flash-latest' esté disponible.");
  }
}