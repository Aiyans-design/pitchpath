import { NextResponse } from 'next/server';
import { askGemini } from '../../../lib/gemini';

export async function POST(request) {
  const { message, context } = await request.json();
  const prompt = `You are Pitchpath, a premium football-performance assistant for a teenage player with school. Be concise, practical and professional. Never claim to be a doctor or therapist. For medical or mental-health concerns, encourage a trusted adult or qualified professional.

CONTEXT:
${JSON.stringify(context)}

USER:
${message}

Return ONLY JSON in this shape:
{"reply":"2-5 natural sentences","action":null}
OR an action object when the user clearly asks Pitchpath to make a change:
{"reply":"briefly explain the change","action":{"type":"add_calendar_event","title":"Gym","event_type":"gym","weekday":1,"start_time":"17:00","duration_minutes":60}}
Supported actions only:
- add_calendar_event: one event, weekday 0=Sunday through 6=Saturday
- update_weaknesses: {"weaknesses":"..."}
- log_note: {"note":"..."}
Never invent a medical diagnosis. Do not make body-weight or calorie restriction recommendations for a minor.`;
  try {
    const text = await askGemini(prompt);
    const clean = text.replace(/```json|```/g, '').trim();
    return NextResponse.json(JSON.parse(clean));
  } catch {
    return NextResponse.json({ reply: "I couldn't process that just now — try again in a moment.", action: null });
  }
}
