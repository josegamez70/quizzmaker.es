// netlify/functions/generate-quiz.ts

import type { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.VITE_API_KEY;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'La clave de API de Gemini no está configurada.' }) };
  }

  try {
    const { files, numQuestions } = JSON.parse(event.body || '{}');

    if (!files || !Array.isArray(files) || files.length === 0 || !numQuestions) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Faltan datos en la petición.' }) };
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const fileParts = files.map(file => ({
      inlineData: { data: file.base64Data, mimeType: file.mimeType },
    }));

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
    
    // Devolvemos el JSON limpio directamente al frontend
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: cleanedText,
    };

  } catch (error) {
    console.error("Error en la función de Netlify:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'Error interno al procesar con la IA.' }),
    };
  }
};