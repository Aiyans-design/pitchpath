import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Text chat - used by the AI assistant
export async function askGemini(prompt) {
  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// Image + text - used for food photo recognition and schedule OCR
export async function askGeminiWithImage(prompt, base64Image, mimeType) {
  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64Image, mimeType } },
  ]);
  return result.response.text();
}
