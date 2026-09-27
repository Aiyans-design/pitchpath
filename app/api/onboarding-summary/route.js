import { NextResponse } from 'next/server';
import { askGemini, askGeminiWithSearch } from '../../../lib/gemini';

export async function POST(request) {
  const profile = await request.json();
  let levelContext = '';

  // Step 1: look up the actual competition level using real web search,
  // instead of guessing from the league text alone.
  if (profile.league) {
    try {
      const lookupPrompt = `Search the web to find real information about this youth football league/competition: "${profile.league}"${profile.team ? ` (team: ${profile.team})` : ''}. Explain in 2-3 sentences what level of competition this represents (e.g. regional, district, elite academy, recreational) based on what you find. If you can't find reliable information, say so plainly instead of guessing.`;
      levelContext = await askGeminiWithSearch(lookupPrompt);
    } catch (err) {
      levelContext = '';
    }
  }

  const prompt = `You are the onboarding summary writer inside Pitchpath, an app for a teenage football player who also has school.

Player profile:
${JSON.stringify(profile, null, 2)}

${levelContext ? `Real research on their competition level:\n${levelContext}\n` : ''}
Write a warm, specific, non-generic summary (5-6 sentences) covering:
- A read on their current profile (age, position, level) — use the research above if it was provided, and don't claim certainty if the research was inconclusive
- Main strengths and areas to improve based on their stated goals
- Top 2-3 priorities the app will focus on
- How the app will balance school and football for them

If they mentioned wanting to be taller, gently redirect to healthy sleep, nutrition, and posture without promising any height gain. Plain text only, no markdown headers, no bullet points.`;

  try {
    const text = await askGemini(prompt);
    return NextResponse.json({ summary: text, levelResearch: levelContext });
  } catch (err) {
    // Fall back to a simple, still-personalized summary if Gemini fails
    const fallback = `You're a ${profile.age || ''} year old ${profile.position || 'player'} at ${profile.team || 'your club'}, playing at ${profile.league || 'your current level'}. We'll prioritize your stated goals while building training and recovery around your school week.`;
    return NextResponse.json({ summary: fallback });
  }
}
