import { NextResponse } from 'next/server';
import { askGemini } from '../../../lib/gemini';

export async function POST(request) {
  const { profile, events, injuries } = await request.json();

  const prompt = `You are scheduling gym and individual football training sessions for a teenage player, around their REAL, already-fixed schedule. Never propose anything that overlaps an existing event below.

Player: age ${profile.age}, position ${profile.position}, goals: "${profile.goals}".
Active injuries/restrictions: ${JSON.stringify(injuries || [])}.

Their fixed schedule for the next 7 days (school, personal, team training, matches — do not touch or duplicate these):
${JSON.stringify(events)}

Task: propose 2-4 new sessions (a mix of "gym" and "individual" type) that fit in the free gaps in this schedule. Rules:
- Never schedule anything the same evening right before a match, or the morning after a late match.
- Never schedule gym on a day already containing a match.
- Respect injuries: if there's an active injury, keep sessions light or skip that body area.
- Leave real rest days if the week is already heavy.

Respond with ONLY valid JSON, no markdown: [{"type": "gym" or "individual", "title": "short label", "day": "YYYY-MM-DD", "start_time": "HH:MM", "end_time": "HH:MM", "description": "one sentence on what this session focuses on and why it's placed here"}]`;

  try {
    const text = await askGemini(prompt);
    const clean = text.replace(/```json|```/g, '').trim();
    const sessions = JSON.parse(clean);
    return NextResponse.json({ sessions });
  } catch (err) {
    return NextResponse.json({ sessions: [], error: 'Could not generate a plan right now. Try again in a moment.' });
  }
}
