// netlify/functions/generate-quiz.ts

import type { Handler, HandlerEvent } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';
import busboy from 'busboy';

const API_KEY = process.env.VITE_API_KEY;

// Función para parsear el cuerpo de la petición multipart/form-data
function parseMultipartForm(event: HandlerEvent): Promise<{ files: { fileBuffer: Buffer; mimeType: string }[], fields: { [key: string]: string } }> {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: event.headers });
    const files: { fileBuffer: Buffer; mimeType: string }[] = [];
    const fields: { [key: string]: string } = {};

    bb.on('file', (fieldname, file, info) => {
      const { mimeType } = info;
      const chunks: Buffer[] = [];
      file.on('data', (chunk) => chunks.push(chunk));
      file.on('end', () => {
        files.push({ fileBuffer: Buffer.concat(chunks), mimeType });
      });
    });

    bb.on('field', (fieldname, val) => {
      fields[fieldname] = val;
    });

    bb.on('close', () => {
      resolve({ files, fields });
    });
    
    bb.on('error', (err: Error) => {
      reject(new Error(`Error parsing form: ${err.message}`));
    });

    // Node.js en Netlify Functions espera el body como base64 si isBase64Encoded es true
    const bodyBuffer = Buffer.from(event.body || '', event.isBase64Encoded ? 'base64' : 'binary');
    bb.end(bodyBuffer);
  });
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'La clave de API de Gemini no está configurada.' }) };
  }

  try {
    const { files, fields } = await parseMultipartForm(event);
    const numQuestions = parseInt(fields.numQuestions || '10', 10);

    if (files.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No se ha subido ningún archivo.' }) };
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const fileParts = files.map(file => ({
      inlineData: { data: file.fileBuffer.toString('base64'), mimeType: file.mimeType },
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