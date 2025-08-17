import { Question } from '../types.ts';

const GEMINI_API_KEY = import.meta.env.VITE_API_KEY;
// 🔹 Usamos el modelo rápido y actual
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

/**
 * Genera un cuestionario a partir de un PDF o imagen usando Gemini.
 * @param files Archivos PDF o imágenes.
 * @param numQuestions Número de preguntas a generar.
 * @returns Array de preguntas con question, options, answer y context.
 */
export async function generateQuizFromImageAndText(
  files: File[],
  numQuestions: number
): Promise<Question[]> {
  try {
    // 🔹 Validar y forzar MIME válido
    const base64Files = await Promise.all(
      files.map(async (file) => {
        let mime = file.type;
        if (!mime) {
          if (file.name.endsWith(".pdf")) mime = "application/pdf";
          else if (file.name.match(/\.(jpg|jpeg)$/i)) mime = "image/jpeg";
          else if (file.name.endsWith(".png")) mime = "image/png";
          else {
            console.warn(
              `⚠ No se pudo detectar MIME para ${file.name}, usando 'application/octet-stream'`
            );
            mime = "application/octet-stream";
          }
        }
        return { base64: await fileToBase64(file), mime, name: file.name };
      })
    );

    const prompt = `
Genera exactamente ${numQuestions} preguntas tipo test a partir del contenido del documento proporcionado.
Cada pregunta debe ser un objeto JSON con las siguientes propiedades:
- "question": string — texto de la pregunta en español.
- "options": array de 4 strings — opciones posibles.
- "answer": string — respuesta correcta exacta.
- "context": string — fragmento de 2 a 3 frases del documento que justifique la respuesta correcta.

⚠ IMPORTANTE:
- Devuelve ÚNICAMENTE un array JSON válido, sin explicaciones ni texto adicional.
- El resultado debe ser estrictamente: [{"question": "...", "options": ["..."], "answer": "...", "context": "..."}]
- No incluyas texto fuera del JSON, ni comentarios, ni formato markdown.
`;

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            ...base64Files.map((f) => ({
              inlineData: {
                mimeType: f.mime,
                data: f.base64,
              },
            })),
          ],
        },
      ],
    };

    console.log(
      "📤 Enviando a Gemini:",
      base64Files.map((f) => ({ name: f.name, mime: f.mime }))
    );

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "❌ Error de Gemini:",
        response.status,
        response.statusText,
        errorText
      );
      throw new Error(
        `Error en la API de Gemini: ${response.status} ${response.statusText} — ${errorText}`
      );
    }

    const data = await response.json();
    console.log("✅ Respuesta de Gemini:", data);

    const textOutput =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    let parsed: Question[] = [];
    try {
      // 🔹 Limpiar posibles envoltorios tipo markdown ```json ... ```
      const cleanOutput = textOutput
        .replace(/```json\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();

      parsed = JSON.parse(cleanOutput);
    } catch (err) {
      console.error(
        "❌ Error al parsear JSON devuelto por Gemini:",
        err,
        textOutput
      );
      throw new Error(
        "La IA no devolvió un JSON válido. Revisa la consola para ver el texto recibido."
      );
    }

    return parsed.map((q) => ({
      question: q.question,
      options: q.options,
      answer: q.answer,
      context: q.context || "",
    }));
  } catch (err) {
    console.error("❌ Error en generateQuizFromImageAndText:", err);
    throw err;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
