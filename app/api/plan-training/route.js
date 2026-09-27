import { NextResponse } from 'next/server';
import { askGemini } from '../../../lib/gemini';
export async function POST(request){
 const {profile,events,injuries,language='en'}=await request.json();
 const fixed=(events||[]).map(e=>({type:e.type,title:e.title,local_start:e.local_start||e.starts_at,local_end:e.local_end||e.ends_at||null,notes:e.notes||''}));
 const prompt=`You are Pitchpath's scheduling engine for a teenage football player with school. The calendar is the source of truth.
PLAYER: ${JSON.stringify(profile||{})}
SCHOOL START: ${profile?.school_start_time||'unknown'}
LEAVE HOME FOR SCHOOL: ${profile?.leave_home_time||'unknown'}
LANGUAGE: ${language==='sv'?'Swedish':'English'}
FIXED CALENDAR EVENTS (LOCAL PLAYER TIMES): ${JSON.stringify(fixed)}
ACTIVE RECOVERY LIMITS: ${JSON.stringify(injuries||[])}

Generate 2-4 additional gym/individual sessions only in genuinely free gaps. Never move, overwrite, duplicate or overlap fixed events. Never schedule gym on a match day. Protect the evening before matches and the morning after late matches. Treat study, hangouts and personal events as real commitments. School departure time is a hard constraint: do not schedule anything that requires the player to be at home during a school commute window. If school starts at 08:10, do not reinterpret it as 06:10. Use the exact local times supplied.

Return ONLY JSON: {"sessions":[{"type":"gym|individual","title":"...","day":"YYYY-MM-DD","start_time":"HH:MM","end_time":"HH:MM","description":"..."}]}`;
 try{const text=await askGemini(prompt);const clean=text.replace(/```json|```/g,'').trim();const parsed=JSON.parse(clean);return NextResponse.json({sessions:Array.isArray(parsed)?parsed:(parsed.sessions||[])});}catch{return NextResponse.json({sessions:[],error:'Could not generate a plan right now.'})}
}
