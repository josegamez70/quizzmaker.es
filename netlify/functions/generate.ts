import { Handler } from '@netlify/functions';
import { GoogleGenAI, Type } from '@google/genai';

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido' }),
    };
  }

  if (!process.env.GEMINI_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Falta la clave de API en el entorno del servidor' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { files, numQuestions } = body;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const schema = {
      type: Type.OBJECT,
      properties: {
        questions: {
          type: Type.ARRAY,
          description: "Lista de preguntas generadas",
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              answer: { type: Type.STRING },
            },
            required: ['question', 'options', 'answer'],
          },
        },
      },
      required: ['questions'],
    };

    const parts = files.map((file: any) => ({
      inlineData: {
        data: file.base64,
        mimeType: file.mimeType,
      },
    }));

    parts.push({
      text: `Generate a quiz with ${numQuestions} multiple-choice questions in English. Each question should have 4 options and one correct answer. Return ONLY valid JSON (no markdown or explanation). Format:
{
  "questions": [
    {
      "question": "Pregunta",
      "options": ["A", "B", "C", "D"],
      "answer": "Respuesta correcta"
    }
  ]
}`
    });

    const result = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ parts }],
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const data = JSON.parse(result.text);

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };

  } catch (err: any) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Error interno al generar cuestionario' }),
    };
  }
};

export { handler };
