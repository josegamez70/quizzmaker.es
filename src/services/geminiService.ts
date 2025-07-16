// src/services/geminiService.ts
import type { Question } from '../types';

const { GoogleGenerativeAI } = (window as any).google.generativeai;
const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) throw new Error('API Key no configurada.');
if (!GoogleGenerativeAI) throw new Error('Librería de Google AI no cargada.');

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

async function fileToGenerativePart(file: File) {
  const base64 = await new Promise<string>((r) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => r((reader.result as string).split(',')[1]);
  });
  return { inlineData: { data: base64, mimeType: file.type } };
}

export async function generateQuizFromImageAndText(files: File[], numQuestions: number): Promise<Question[]> {
  try {
    const fileParts = await Promise.all(files.map(fileToGenerativePart));
    const prompt = `Analiza... (tu prompt completo va aquí)`;
    const result = await model.generateContent([prompt, ...fileParts]);
    const text = result.response.text();
    let cleanedText = text.trim().replace(/^```json|```$/g, '');
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error en Gemini Service:", error);
    throw new Error("No se pudo comunicar con la IA.");
  }
}