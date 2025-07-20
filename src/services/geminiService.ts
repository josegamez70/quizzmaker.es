import { GoogleGenerativeAI, GenerateContentResponse } from "@google/generative-ai";
import { Question } from '../types.ts';

const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
  throw new Error("La clave de API no está configurada. Por favor, asegúrate de que la variable de entorno VITE_API_KEY esté establecida.");
}

const ai = new GoogleGenerativeAI(apiKey);

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
    const response = await ai.generateContent({
      model: 'gemini-pro-vision',
      contents: [{ parts: allParts }]
    });

    const language = response?.text?.trim();
    if (!language) {
      console.warn("La detección de idioma no devolvió resultados. Se usará español por defecto.");
      return "Spanish";
    }
    console.log(`Idioma detectado: ${language}`);
    return language;
  } catch (error) {
    console.error("Error durante la detección de idioma:", error);
    console.warn("Se usará español por defecto debido a un error en la detección.");
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
    const response = await ai.generateContent({
      model: 'gemini-pro-vision',
      contents: [{ parts: allParts }]
    });

    const jsonStr = response?.text?.trim();
    if (!jsonStr) {
      console.error("La IA no devolvió ningún texto.");
      throw new Error("La IA no respondió correctamente. Verifica tu clave de API o el contenido del archivo.");
    }

    // Limpiar posibles bloques de Markdown
    const fenceRegex = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/;
    const match = jsonStr.match(fenceRegex);
    const cleanedJson = match ? match[1].trim() : jsonStr;

    const parsed = JSON.parse(cleanedJson);

    if (parsed && Array.isArray(parsed.questions)) {
      return parsed.questions as Question[];
    } else {
      throw new Error("El formato de la respuesta no es válido.");
    }
  } catch (error) {
    console.error("Error al llamar a la API de Gemini:", error);
    throw new Error("No se pudo comunicar con la IA. Por favor, verifica tu clave de API e inténtalo de nuevo más tarde.");
  }
};
