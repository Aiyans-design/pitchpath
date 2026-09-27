import { NextResponse } from 'next/server';
import { askGemini } from '../../../lib/gemini';

export async function POST(request) {
  const { message, context } = await request.json();
  const prompt = `You are Pitchpath's assistant for a teenage football player who also has school. Here is their full context: ${JSON.stringify(context)}.

Their message: "${message}"

Reply naturally in 2-5 sentences, referencing their actual data when relevant (calendar, water, sleep, injuries, goals). If they ask to change their schedule or plans, describe exactly what you would change and ask them to confirm before it happens — never claim you already applied it. Never claim to be a doctor or therapist; for medical or mental-health concerns, encourage involving a trusted adult or professional.`;

  try {
    const text = await askGemini(prompt);
    return NextResponse.json({ reply: text });
  } catch (err) {
    return NextResponse.json({ reply: "I couldn't process that just now — try again in a moment." });
  }
}
