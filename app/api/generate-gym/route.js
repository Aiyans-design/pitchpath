import { NextResponse } from 'next/server';
import { askGemini } from '../../../lib/gemini';

export async function POST(request){
  const {profile,events,injuries}=await request.json();
  const prompt=`You are the strength-and-conditioning coach inside Pitchpath for a teenage football player balancing school and football.

PLAYER: ${JSON.stringify(profile)}
UPCOMING SCHOOL/FOOTBALL SCHEDULE: ${JSON.stringify(events||[])}
ACTIVE INJURIES/RESTRICTIONS: ${JSON.stringify(injuries||[])}

Build ONE demanding but age-appropriate academy-style gym session that should feel like real training, not a generic beginner workout. Personalize exercise selection, order, volume, rest and emphasis to the player's position, football schedule, school load, goals, weaknesses and recovery context. The player should finish feeling that they trained, but never use maximal testing, unsafe loading, punishment, failure training, supplements or restrictive dieting. Use controlled RPE/RIR guidance rather than arbitrary heavy loads. Protect match and team-training freshness.

Use the stored optional photo coaching context if present: ${profile?.photo_training_context || 'none'}. This context may only inform safe exercise setup/coaching cues; never judge appearance, body size, weight, body fat or development.

Periodize the wider plan: hard/moderate/easier weeks should change with match density and school load, and approximately every 4th week can be a lower-load recovery week when appropriate. If running/conditioning is needed, it belongs in the individual-training system rather than making this a bodybuilding split.

Return ONLY JSON: {"summary":"2-3 sentences","session_minutes":45,"effort":"RPE 7/10","week_focus":"...","exercises":[{"name":"...","sets":3,"reps":"6-10","rest_seconds":90,"effort":"RPE 7","purpose":"...","coaching":"..."}]}. Provide 6-8 football-relevant exercises with enough total work to be meaningful.`;
  try{
    const text=await askGemini(prompt);
    return NextResponse.json(JSON.parse(text.replace(/```json|```/g,'').trim()));
  }catch{
    return NextResponse.json({summary:'A controlled football-strength session focused on unilateral strength, posterior-chain capacity and trunk robustness.',session_minutes:45,effort:'RPE 7/10',week_focus:'Build strength without compromising football freshness.',exercises:[
      {name:'Split squat',sets:3,reps:'8 each leg',rest_seconds:75,effort:'RPE 7',purpose:'Unilateral leg strength',coaching:'Controlled descent and stable knee position.'},
      {name:'Single-leg hip hinge',sets:3,reps:'8 each leg',rest_seconds:60,effort:'RPE 7',purpose:'Posterior-chain control',coaching:'Move slowly and keep balance.'},
      {name:'Push-up',sets:3,reps:'8-12',rest_seconds:60,effort:'RPE 7',purpose:'Upper-body strength',coaching:'Leave 2-3 clean reps in reserve.'},
      {name:'Lateral lunge',sets:3,reps:'8 each side',rest_seconds:60,effort:'RPE 7',purpose:'Frontal-plane strength',coaching:'Own the change of direction.'},
      {name:'Calf raise',sets:3,reps:'12-15',rest_seconds:45,effort:'RPE 7',purpose:'Lower-leg robustness',coaching:'Pause briefly at the top.'},
      {name:'Side plank',sets:3,reps:'30-40s each side',rest_seconds:45,effort:'RPE 7',purpose:'Trunk control',coaching:'Keep hips stacked.'}
    ]});
  }
}
