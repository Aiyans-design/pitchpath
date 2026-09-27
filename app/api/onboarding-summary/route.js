import { NextResponse } from 'next/server';
import { askGemini } from '../../../lib/gemini';

export async function POST(request) {
  const profile = await request.json();

  const prompt = `You are the onboarding summary writer inside Pitchpath, an app for a teenage football player who also has school.

Player profile:
${JSON.stringify(profile, null, 2)}

Write a warm, specific, non-generic summary (5-6 sentences) covering:
- A read on their current profile (age, position, level)
- Main strengths and areas to improve based on their stated goals
- Top 2-3 priorities the app will focus on
- How the app will balance school and football for them

If they mentioned wanting to be taller, gently redirect to healthy sleep, nutrition, and posture without promising any height gain. Plain text only, no markdown headers, no bullet points.`;

  try {
    const text = await askGemini(prompt);
    return NextResponse.json({ summary: text });
  } catch (err) {
    // Fall back to a simple, still-personalized summary if Gemini fails
    const fallback = `You're a ${profile.age || ''} year old ${profile.position || 'player'} at ${profile.team || 'your club'}, playing at ${profile.league || 'your current level'}. We'll prioritize your stated goals while building training and recovery around your school week.`;
    return NextResponse.json({ summary: fallback });
  }
}
