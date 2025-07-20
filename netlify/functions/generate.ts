// netlify/functions/generate.ts

import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.VITE_API_KEY;
const modelName = 'models/gemini-1.5-flash';

const handler: Handler = async (event) => {
  try {
    if (!apiKey) throw new Error('Falta la clave API de Gemini');

    const genAI = new GoogleGenerativeAI(apiKey);
    const body = JSON.parse(event.body || '{}');

    const { files, numQuestions } = body;
    if (!files || !numQuestions) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Faltan archivos o número de preguntas' }),
      };
    }

    const parts = files.map((file: { base64: string; mimeType: string }) => ({
      inlineData: {
        data: file.base64,
        mimeType: file.mimeType,
      },
    }));

    const prompt = `You are an expert AI assistant specializing in creating educational quizzes from content.
Your task is to analyze the provided files and generate a multiple-choice quiz with ${numQuestions} questions in Spanish.
Each question, all its options, and the correct answer must be written entirely in Spanish.

IMPORTANT: Your response must be EXCLUSIVELY a valid JSON object, with no other text, explanations, or markdown.
The JSON must strictly adhere to the RFC 8259 standard. NO trailing commas are allowed.
The JSON object must have a single key "questions", which contains an array of question objects.

The format for each object in the "questions" array must be:
{
  "question": "Texto de la pregunta en español. Escapa comillas dobles si las hay (ejemplo: \"texto\").",
  "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
  "answer": "Texto exacto de la respuesta correcta, que debe coincidir con una de las opciones."
}`;

    const result = await genAI.getGenerativeModel({ model: modelName }).generateContent({
      contents: [{ parts: [...parts, { text: prompt }] }],
    });

    const responseText = result.response.text();
    const match = responseText.match(/^```(?:json)?\s*([\s\S]*)\s*```$/);
    const jsonStr = match ? match[1].trim() : responseText.trim();

    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed.questions)) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Formato inválido en la respuesta de la IA' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ questions: parsed.questions }),
    };

  } catch (err) {
    console.error('Error en función generate:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error al generar cuestionario con Gemini' }),
    };
  }
};

export { handler };