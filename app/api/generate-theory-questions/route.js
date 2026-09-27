import { NextResponse } from 'next/server';
import { askGemini } from '../../../lib/gemini';

export async function POST() {
  const topics = ['scanning', 'pressing', 'positional play', 'transitions', 'creating space'];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  const prompt = `Write 5 challenging multiple-choice football-IQ questions about "${topic}" for a serious teenage academy player — not trivia, real tactical decision-making ("what would you do?" situational questions). Respond with ONLY valid JSON array, no markdown: [{"topic": "${topic}", "difficulty": 1-5, "question": "...", "options": ["a","b","c","d"], "correct_index": 0, "explanation": "..."}]`;

  try {
    const text = await askGemini(prompt);
    const clean = text.replace(/```json|```/g, '').trim();
    const questions = JSON.parse(clean);
    return NextResponse.json({ questions });
  } catch (err) {
    return NextResponse.json({ questions: [] });
  }
}
