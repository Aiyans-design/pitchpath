import { NextResponse } from 'next/server';
import { askGemini, askGeminiWithImage, askGeminiWithSearch } from '../../../lib/gemini';

export async function POST(request) {
  const body = await request.json();
  const { photoBase64, photoMimeType, ...profile } = body;
  let levelContext = '';
  let photoContext = '';

  if (profile.league) {
    try {
      const lookupPrompt = `Search the web to find real information about this youth football league/competition: "${profile.league}"${profile.team ? ` (team: ${profile.team})` : ''}. Explain in 2-3 sentences what level of competition this represents based on reliable information. If you cannot verify it, say so plainly.`;
      levelContext = await askGeminiWithSearch(lookupPrompt);
    } catch {}
  }

  if (photoBase64 && photoMimeType) {
    try {
      photoContext = await askGeminiWithImage(`This image is an optional upper-body photo supplied by a teenage football player. Use it only as additional coaching context. Do not judge attractiveness, body size, body fat, weight, development, or appearance, and do not make medical diagnoses. Do not estimate measurements. Identify only practical, non-sensitive visual context that could help a future coach give exercise setup or movement-quality cues. If there is not enough reliable information, say "No reliable visual training cue." Return 1-2 short sentences only.`, photoBase64, photoMimeType);
    } catch {}
  }

  const prompt = `You are the onboarding summary writer inside Pitchpath, an app for a teenage football player who also has school.

Player profile:
${JSON.stringify(profile, null, 2)}
${levelContext ? `\nVerified competition research:\n${levelContext}` : ''}
${photoContext ? `\nOptional photo coaching context (do not infer anything beyond this):\n${photoContext}` : ''}

Write a warm, specific, non-generic summary (5-6 sentences) covering:
- Current profile: age, position and competition level, with uncertainty stated when research is inconclusive
- Main strengths and areas to improve based on stated goals and football context
- Top 2-3 priorities
- How Pitchpath will balance school, football, recovery and personal goals
- Mention that future training can use the supplied photo only for safe coaching context, without judging appearance
If they mentioned wanting to be taller, redirect to healthy sleep, nutrition, posture and realistic expectations without promising height gain. Plain text only, no markdown.`;

  try {
    const text = await askGemini(prompt);
    return NextResponse.json({ summary: text, levelResearch: levelContext, photoContext });
  } catch {
    return NextResponse.json({ summary: `You're a ${profile.age || ''} year old ${profile.position || 'player'} at ${profile.team || 'your club'}, playing at ${profile.league || 'your current level'}. Pitchpath will prioritize your stated goals while building training and recovery around your school week.`, levelResearch: levelContext, photoContext });
  }
}
