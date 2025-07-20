import { GoogleGenerativeAI } from "@google/generative-ai";
import { Question } from '../types.ts';

const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
  throw new Error("La clave de API no está configurada. Por favor, asegúrate de que la variable de entorno VITE_API_KEY esté establecida.");
}

const ai = new GoogleGenerativeAI(apiKey);
const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' }); // ✅ modelo actual válido

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const detectLanguage = async (files: File[]): Promise<string> => {
  const fileParts = await Promise.all(files.map(fileToGenerativePart));

  const prompt = `Analyze the language of the text in the provided file(s). Respond with only the name of the language in English, e.g., "Spanish", "English", "French".`;

  const textPart = { text: prompt };
  const allParts = [...fileParts, textPart];

  try {
    const response = await model.generateContent({
      contents: [{ parts: allParts }]
    });

    const language = await response.response.text();
    const trimmed = language?.trim();

    if (!trimmed) {
      console.warn("La detección de idioma no devolvió resultados. Se usará español por defecto.");
      return "Spanish";
    }
    console.log(`Idioma detectado: ${trimmed}`);
    return trimmed;
  } catch (error) {
    console.error("Error durante la detección de idioma:", error);
    return "Spanish";
  }
};

export const generateQuizFromImageAndText = async (files: File[], numQuestions: number): Promise<Question[]> => {
  const detectedLanguage = await detectLanguage(files);
  const fileParts = await Promise.all(files.map(fileToGenerativePart));

  const prompt = `You are an expert AI assistant specializing in creating educational quizzes from content.
Generate a multiple-choice quiz with ${numQuestions} questions in ${detectedLanguage}.
Each question must have four options and one correct answer.
Respond only with valid JSON. No markdown or explanation.

Format:
{
  "questions": [
    {
      "question": "Texto de la pregunta",
      "options": ["A", "B", "C", "D"],
      "answer": "Texto exacto de la respuesta correcta"
    }
  ]
}`;

  const textPart = { text: prompt };
  const allParts = [...fileParts, textPart];

  try {
    const response = await model.generateContent({
      contents: [{ parts: allParts }]
    });

    const raw = await response.response.text();
    const cleaned = raw?.match(/^```(?:json)?\s*([\s\S]+?)\s*```$/)?.[1]?.trim() || raw?.trim();

    if (!cleaned) throw new Error("La IA no devolvió ningún texto.");

    const parsed = JSON.parse(cleaned);
    if (parsed && Array.isArray(parsed.questions)) {
      return parsed.questions;
    } else {
      throw new Error("El formato de la respuesta no es válido.");
    }
  } catch (error) {
    console.error("Error al llamar a la API de Gemini:", error);
    throw new Error("No se pudo comunicar con la IA. Por favor, verifica tu clave de API e inténtalo de nuevo más tarde.");
  }
};
