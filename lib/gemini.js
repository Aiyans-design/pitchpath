import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL='gemini-3.8-flash';

export async function askGemini(prompt) {
  const model = genAI.getGenerativeModel({ model: MODEL });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function askGeminiWithImage(prompt, base64Image, mimeType) {
  const model = genAI.getGenerativeModel({ model: MODEL });
  const result = await model.generateContent([prompt,{inlineData:{data:base64Image,mimeType}}]);
  return result.response.text();
}

export async function askGeminiWithSearch(prompt) {
  const model = genAI.getGenerativeModel({ model: MODEL, tools:[{googleSearch:{}}] });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
