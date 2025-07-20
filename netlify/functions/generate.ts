// netlify/functions/generate.ts

import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido' }),
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GEMINI_API_KEY no está definida en el entorno' }),
    };
  }

  try {
    const { files, numQuestions } = JSON.parse(event.body || '{}');

    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const parts = files.map((file: { base64: string; mimeType: string }) => ({
      inlineData: {
        data: file.base64,
        mimeType: file.mimeType,
      },
    }));

    parts.push({
      text: `
Eres un asistente experto en educación. Genera un cuestionario tipo test con ${numQuestions} preguntas en español.

Cada pregunta debe tener 4 opciones y una única respuesta correcta.

Devuelve SOLO el JSON con este formato:
{
  "questions": [
    {
      "question": "Texto de la pregunta",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "answer": "Texto exacto de la respuesta correcta"
    }
  ]
}
      `.trim(),
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
    });

    const raw = await result.response.text();
    const jsonClean = raw.match(/^```(?:json)?\s*([\s\S]+?)\s*```$/)?.[1]?.trim() || raw.trim();

    const parsed = JSON.parse(jsonClean);
    if (!parsed || !Array.isArray(parsed.questions)) {
      throw new Error('Formato de respuesta inválido');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ questions: parsed.questions }),
    };
  } catch (error) {
    console.error('Error al generar cuestionario:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
    };
  }
};

export { handler };
