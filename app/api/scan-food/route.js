import { NextResponse } from 'next/server';
import { askGeminiWithImage } from '../../../lib/gemini';

export async function POST(request) {
  const { base64Image, mimeType } = await request.json();
  const prompt = `Identify the food in this photo and estimate nutrition for a typical serving. Respond with ONLY valid JSON, no markdown, no extra text, in this exact shape: {"food_name": "...", "estimated_calories": 000, "estimated_protein_g": 00, "estimated_carbs_g": 00, "estimated_fat_g": 00, "confidence_note": "one short sentence noting this is an estimate"}`;

  try {
    const text = await askGeminiWithImage(prompt, base64Image, mimeType);
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json({ error: 'Could not analyze the photo. Try again or enter it manually.' }, { status: 200 });
  }
}
