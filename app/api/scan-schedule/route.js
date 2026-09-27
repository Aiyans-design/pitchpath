import { NextResponse } from 'next/server';
import { askGeminiWithImage } from '../../../lib/gemini';

export async function POST(request) {
  const { base64Image, mimeType } = await request.json();
  const prompt = `This is a photo of a school timetable, football training schedule, or match schedule. Extract every event you can read. Respond with ONLY valid JSON, no markdown, no extra text, in this exact shape: [{"title": "...", "day": "e.g. Monday or a date if visible", "time": "e.g. 14:00", "type": "school | training | match | gym | individual"}]. If you can't read something clearly, make your best guess and note low confidence in the title, don't skip it.`;

  try {
    const text = await askGeminiWithImage(prompt, base64Image, mimeType);
    const clean = text.replace(/```json|```/g, '').trim();
    const events = JSON.parse(clean);
    return NextResponse.json({ events });
  } catch (err) {
    return NextResponse.json({ events: [], error: "Couldn't read that image clearly. Try a clearer photo or add events manually." });
  }
}
