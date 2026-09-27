import { NextResponse } from 'next/server';
import { askGemini } from '../../../lib/gemini';

export async function POST(request) {
  try {
    const { profile, events, injuries, recentLogs } = await request.json();
    const prompt = `You are a conservative performance-nutrition planner for a teenage football player. Do not recommend restrictive dieting, weight loss targets, supplements, or unsafe calorie restriction. Build a practical fueling plan around school and football.

PLAYER PROFILE
${JSON.stringify(profile)}

UPCOMING SCHEDULE
${JSON.stringify(events || [])}

ACTIVE INJURIES/ILLNESS
${JSON.stringify(injuries || [])}

RECENT FOOD LOGS
${JSON.stringify(recentLogs || [])}

Create a plan for today. Use age, body size, position, schedule, training load and personal wish only to improve fueling and recovery; for minors, prioritize regular meals, adequate energy, hydration and growth. If the profile contains a body-change wish, do not turn it into restriction.

Return ONLY valid JSON:
{"calories":number,"protein_g":number,"carbs_g":number,"fat_g":number,"rationale":"short explanation","meals":[{"meal_type":"breakfast|lunch|dinner|snack","time":"HH:MM","title":"short meal name","foods":["..."],"purpose":"why it fits today"}]}`;
    const text = await askGemini(prompt);
    const clean = text.replace(/```json|```/g, '').trim();
    return NextResponse.json({ plan: JSON.parse(clean) });
  } catch {
    return NextResponse.json({ error: 'Could not build the nutrition plan right now.' }, { status: 500 });
  }
}
