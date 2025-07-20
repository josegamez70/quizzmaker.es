import { GoogleGenerativeAI, GenerateContentResponse } from "@google/generative-ai";
import { Question } from '../types.ts';

const apiKey = import.meta.env.VITE_API_KEY;

if (!apiKey) {
  throw new Error("La clave de API no está configurada. Por favor, asegúrate de que la variable de entorno VITE_API_KEY esté establecida.");
}

const ai = new GoogleGenerativeAI(apiKey);
const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash-preview-04-17' });

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

  const prompt = `Analyze the language of the text in the provided file(s). Respond with only the name of the language in English. For example: "Spanish", "English", "French". If multiple languages are present, identify the dominant one.`;

  const textPart = { text: prompt };
  const allParts = [...fileParts, textPart];

  try {
    const response: GenerateContentResponse = await model.generateContent({
      contents: { parts: allParts }
    });

    const language = response.text.trim();
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
Your task is to analyze the provided files and generate a multiple-choice quiz with ${numQuestions} questions in the following language: ${detectedLanguage}.
Each question, all its options, and the correct answer must be written entirely in ${detectedLanguage}.

IMPORTANT: Your response must be EXCLUSIVELY a valid JSON object, with no other text, explanations, or markdown.
The JSON must strictly adhere to the RFC 8259 standard. NO trailing commas are allowed.
The JSON object must have a single key "questions", which contains an array of question objects.

The format for each object in the "questions" array must be:
{
  "question": "The text of the question in ${detectedLanguage}. Any double quotes within the text must be properly escaped (e.g., \\"some text\\").",
  "options": ["Option A in ${detectedLanguage}", "Option B in ${detectedLanguage}", "Option C in ${detectedLanguage}", "Option D in ${detectedLanguage}"],
  "answer": "The text of the correct answer in ${detectedLanguage}, which must exactly match one of the options."
}`;

  const textPart = { text: prompt };
  const allParts = [...fileParts, textPart];

  try {
    const response: GenerateContentResponse = await model.generateContent({
      contents: { parts: allParts },
      config: {
        responseMimeType: "application/json",
        temperature: 0.5,
      }
    });

    let jsonStr = response.text.trim();

    // Limpiar posibles bloques de markdown
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    const parsedData = JSON.parse(jsonStr);

    if (parsedData && Array.isArray(parsedData.questions) && parsedData.questions.every(item => 'question' in item && 'options' in item && 'answer' in item)) {
      return parsedData.questions as Question[];
    } else {
      console.error("La respuesta de la API no tiene el formato esperado:", parsedData);
      throw new Error('La IA devolvió una respuesta con un formato inesperado.');
    }

  } catch (error) {
    console.error("Error al llamar a la API de Gemini:", error);
    throw new Error('No se pudo comunicar con la IA. Por favor, verifica tu clave de API e inténtalo de nuevo más tarde.');
  }
};
