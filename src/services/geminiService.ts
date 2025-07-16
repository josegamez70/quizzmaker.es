// src/services/geminiService.ts

import type { Question } from '../types';

// --- CAMBIO CLAVE: NO HAY IMPORT DE @google/generative-ai ---
// La librería se carga desde la CDN en index.html y se accede a través del objeto 'window'.

// 1. Obtenemos las herramientas de la librería desde el objeto global 'window'.
// Usamos 'any' para evitar problemas de tipos, ya que no estamos importando los tipos directamente.
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = (window as any).google.generativeai;

// 2. Leemos la clave de API desde las variables de entorno.
const API_KEY = import.meta.env.VITE_API_KEY;

// 3. Comprobamos que todo está en su sitio.
if (!API_KEY) {
  throw new Error('La clave de API no está configurada. Por favor, asegúrate de que la variable de entorno VITE_API_KEY esté establecida.');
}
if (!GoogleGenerativeAI) {
  throw new Error('La librería de Google AI no se ha cargado correctamente desde la CDN. Revisa el script en index.html.');
}

// 4. Inicializamos el cliente de Google AI con nuestra clave.
const genAI = new GoogleGenerativeAI(API_KEY);

// 5. La función principal que se comunica con la IA.
export async function generateQuizFromImageAndText(files: File[], numQuestions: number): Promise<Question[]> {
  try {
    // Obtenemos el modelo correcto
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash-latest"
    });

    // Convertimos los archivos
    const fileParts = await Promise.all(files.map(fileToGenerativePart));

    // Creamos el prompt (las instrucciones para la IA)
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

    // Hacemos la llamada a la IA
    const result = await model.generateContent([prompt, ...fileParts]);
    const response = result.response;
    const text = response.text();

    // Limpiamos la respuesta para asegurarnos de que es un JSON válido
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.substring(7, cleanedText.length - 3).trim();
    }

    const questions = JSON.parse(cleanedText);
    return questions;

  } catch (error) {
    console.error("Error en generateQuizFromImageAndText:", error);
    throw new Error("No se pudo comunicar con la IA. Por favor, verifica tu clave de API e inténtalo de nuevo más tarde.");
  }
}

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