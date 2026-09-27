import { NextResponse } from 'next/server';
import { askGemini } from '../../../lib/gemini';

export async function POST(request) {
  const { profile } = await request.json();
  const prompt = `You design safe, age-appropriate gym sessions for a teenage football player. Player: age ${profile.age}, position ${profile.position}, goals: "${profile.goals}". Avoid maximal lifting or unsafe loads for a teenager. Respond with ONLY valid JSON, no markdown: {"summary": "2 sentences on what this session works toward and why", "exercises": [{"name": "...", "sets": 3, "reps": "10-12", "rest_seconds": 60, "purpose": "short reason"}]} with 5-6 exercises.`;

  try {
    const text = await askGemini(prompt);
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json(parsed);
  } catch (err) {
    return NextResponse.json({
      summary: 'A general football-conditioning session focused on core stability and lower-body strength.',
      exercises: [
        { name: 'Bodyweight squats', sets: 3, reps: '12', rest_seconds: 60, purpose: 'Leg strength' },
        { name: 'Plank', sets: 3, reps: '30-45s', rest_seconds: 45, purpose: 'Core stability' },
        { name: 'Lunges', sets: 3, reps: '10 each leg', rest_seconds: 60, purpose: 'Single-leg strength' },
        { name: 'Glute bridges', sets: 3, reps: '15', rest_seconds: 45, purpose: 'Posterior chain' },
        { name: 'Mountain climbers', sets: 3, reps: '20', rest_seconds: 45, purpose: 'Conditioning' },
      ],
    });
  }
}
