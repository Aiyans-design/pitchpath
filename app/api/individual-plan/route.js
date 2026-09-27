import { NextResponse } from 'next/server';
import { askGemini } from '../../../lib/gemini';

export async function POST(request){
  const {profile,weaknesses,events,injuries}=await request.json();
  const prompt=`You are Pitchpath's individual football-development coach for a teenage player who also has school.

PROFILE: ${JSON.stringify(profile)}
WEAKNESSES: ${weaknesses}
FIXED SCHOOL/FOOTBALL SCHEDULE: ${JSON.stringify(events||[])}
INJURIES/RECOVERY LIMITS: ${JSON.stringify(injuries||[])}

Create the next individualized session AND a short 4-week microcycle. It must respond to the player's actual position, weaknesses, schedule, recovery and goals. It can include technical football work, speed/conditioning, or running. Some weeks should deliberately include a 2.5km or 5km run when aerobic work fits the schedule; other weeks should emphasize football-specific work when match/training density is high. Do not add running simply for punishment or because it is generic. Make sessions demanding enough to create meaningful training stimulus while remaining age-appropriate and avoiding unsafe overload.

Return ONLY JSON: {"title":"...","summary":"...","week_number":1,"week_focus":"...","drills":[{"name":"...","duration_minutes":10,"instructions":"...","focus":"...","difficulty":"hard|moderate|easy"}],"run":null,"four_week_plan":[{"week":1,"focus":"...","run":{"distance_km":5,"target":"..."}|null},{"week":2,"focus":"...","run":null},{"week":3,"focus":"...","run":null},{"week":4,"focus":"recovery","run":null}]}. Only use a run when it genuinely fits the schedule and recovery. Never diagnose injuries or override a clinician/coach restriction.`;
  try{
    const text=await askGemini(prompt);
    return NextResponse.json(JSON.parse(text.replace(/```json|```/g,'').trim()));
  }catch{
    return NextResponse.json({title:'Weakness-focused football session',summary:'A focused session built around the current weakness and weekly football load.',week_number:1,week_focus:'Technical quality with controlled conditioning.',drills:[{name:'Scanning + first touch',duration_minutes:15,instructions:'Scan before receiving, open your body and play forward when possible.',focus:'Awareness',difficulty:'hard'},{name:'Weak-foot passing',duration_minutes:15,instructions:'Use the weaker foot for controlled passes while changing angles between repetitions.',focus:'Technique',difficulty:'moderate'},{name:'Change-of-direction ball work',duration_minutes:12,instructions:'Accelerate, brake under control and execute the final action cleanly.',focus:'Acceleration',difficulty:'hard'}],run:null,four_week_plan:[{week:1,focus:'Technical quality',run:null},{week:2,focus:'Aerobic development',run:{distance_km:2.5,target:'comfortable controlled pace'}},{week:3,focus:'Football-specific intensity',run:null},{week:4,focus:'Recovery and quality',run:null}]});
  }
}
