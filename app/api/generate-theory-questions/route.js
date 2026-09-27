import { NextResponse } from 'next/server';
import { askGemini } from '../../../lib/gemini';

export async function POST(request){
 const {profile,language='en',unit='scanning & space'}=await request.json().catch(()=>({}));
 const prompt=`You are Pitchpath's elite football-IQ coach. Create 8 hard but teachable match-decision questions for a teenage player. This is a gamified learning lesson, not trivia.
PLAYER: ${JSON.stringify(profile||{})}
LANGUAGE: ${language==='sv'?'Swedish':'English'}
LESSON: ${unit}
Make situations position-relevant, realistic and professional-level: scanning, body orientation, pressing triggers, third-player actions, rest defence, transitions, manipulating opponents, receiving under pressure, tempo and space. Avoid generic rules questions. Difficulty 4-5/5. Every question must have one best answer and a short explanation teaching the principle.
Return ONLY compact JSON array: [{"topic":"...","difficulty":5,"question":"...","options":["...","...","...","..."],"correct_index":0,"explanation":"..."}]`;
 try{const text=await askGemini(prompt);return NextResponse.json({questions:JSON.parse(text.replace(/```json|```/g,'').trim())})}catch{return NextResponse.json({questions:[]})}
}
