import { NextResponse } from 'next/server';
import { askGemini } from '../../../lib/gemini';
export async function POST(request){const {profile,weaknesses,events,injuries}=await request.json();const language=profile?.language==='sv'?'Swedish':'English';const prompt=`You are Pitchpath's individual football-development coach for a teenage player who also has school. Write all natural-language fields in ${language}.
PROFILE: ${JSON.stringify(profile)}
WEAKNESSES: ${weaknesses}
FIXED SCHEDULE: ${JSON.stringify(events||[])}
RECOVERY LIMITS: ${JSON.stringify(injuries||[])}
Create the next individualized session AND a short 4-week microcycle. Respond to actual position, weaknesses, schedule, recovery and goals. It can include technical football work, speed/conditioning or running. Some weeks may include a 2.5km or 5km run when aerobic work genuinely fits; other weeks should emphasize football-specific work when match/training density is high. Do not add running as punishment or generic volume. Keep training demanding but age-appropriate and avoid unsafe overload. Never diagnose injuries or override a clinician/coach restriction.
Return ONLY JSON: {"title":"...","summary":"...","week_number":1,"week_focus":"...","drills":[{"name":"...","duration_minutes":10,"instructions":"...","focus":"...","difficulty":"hard|moderate|easy"}],"run":null,"four_week_plan":[{"week":1,"focus":"...","run":{"distance_km":5,"target":"..."}|null},{"week":2,"focus":"...","run":null},{"week":3,"focus":"...","run":null},{"week":4,"focus":"recovery","run":null}]}.`;
try{const text=await askGemini(prompt);return NextResponse.json(JSON.parse(text.replace(/```json|```/g,'').trim()))}catch{return NextResponse.json({title:'Weakness-focused football session',summary:'A focused session built around the current weakness and weekly football load.',week_number:1,week_focus:'Technical quality with controlled conditioning.',drills:[],run:null,four_week_plan:[]})}}
