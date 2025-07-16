// src/services/geminiService.ts
import type { Question } from '../types';

const { GoogleGenerativeAI } = (window as any).google.generativeai;
const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) throw new Error('API Key no configurada.');
if (!GoogleGenerativeAI) throw new Error('Librería de Google AI no cargada.');

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// ... (El resto de la función generateQuizFromImageAndText y fileToGenerativePart son las mismas que te pasé antes)
// ...