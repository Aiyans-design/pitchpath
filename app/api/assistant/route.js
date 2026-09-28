import { NextResponse } from 'next/server';
import { askGemini } from '../../../lib/gemini';

const dayMap={sunday:0,monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6,söndag:0,måndag:1,tisdag:2,onsdag:3,torsdag:4,fredag:5,lördag:6};
function detectRecurring(message,language){
  const m=message.toLowerCase().trim();
  const gym=/(gym|gymma|gymmet|styrketräning|styrka)/i.test(m);
  const every=/(every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)|each\s+week|weekly|varje\s+(måndag|tisdag|onsdag|torsdag|fredag|lördag|söndag)|varje\s+vecka)/i.exec(m);
  if(!gym||!every)return null;
  const dayMatch=every[2]||every[1]?.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i)?.[1]||every[1]?.match(/(måndag|tisdag|onsdag|torsdag|fredag|lördag|söndag)/i)?.[1];
  const weekday=dayMap[(dayMatch||'monday').toLowerCase()];
  const timeMatch=/(?:at|kl\.?|klockan)\s*(\d{1,2})(?::(\d{2}))?/i.exec(m);
  const start_time=timeMatch?`${String(Math.min(23,Number(timeMatch[1]))).padStart(2,'0')}:${String(Number(timeMatch[2]||0)).padStart(2,'0')}`:'17:00';
  const afterSchool=/(after school|after skolan|efter skolan)/i.test(m);
  return {reply:language==='Swedish'?`Jag tolkar det som gym varje ${dayMatch} i 8 veckor${afterSchool?' efter skolan':''}. Jag lägger in det som ett återkommande åtagande och bygger om träningsplanen runt det.`:`I understand this as gym every ${dayMatch} for 8 weeks${afterSchool?' after school':''}. I’ll add it as a recurring commitment and rebuild your training plan around it.`,action:{type:'add_recurring_event',title:'Gym',event_type:'gym',weekday,start_time,duration_minutes:75,weeks:8,notes:afterSchool?'After school · requested through Pitchpath AI':'Requested through Pitchpath AI'}};
}
export async function POST(request){
 const {message,context}=await request.json();
 const language=context?.profile?.language==='sv'?'Swedish':'English';
 const deterministic=detectRecurring(message,language);
 if(deterministic)return NextResponse.json(deterministic);
 const prompt=`You are Pitchpath's action-oriented performance AI for a teenage football player who also has school. You are not a generic chatbot. Inspect the complete player/calendar context and return an executable action when the user requests a change.
LANGUAGE: ${language}
CALENDAR IS THE SOURCE OF TRUTH. Never reinterpret existing times. School 08:10 means 08:10. Respect leave-home time ${context?.profile?.leave_home_time||'unknown'} and school start ${context?.profile?.school_start_time||'unknown'}.
PLAYER CONTEXT: ${JSON.stringify(context)}
USER REQUEST: ${message}
SUPPORTED ACTIONS:
add_calendar_event {type:'add_calendar_event',title,event_type,weekday,start_time,duration_minutes,notes}
add_recurring_event {type:'add_recurring_event',title,event_type,weekday:0-6,start_time:'HH:MM',duration_minutes,weeks,notes}
remove_recurring_event {type:'remove_recurring_event',title,weekday:0-6}
replace_recurring_event {type:'replace_recurring_event',old_title,old_weekday:0-6,title,event_type,weekday:0-6,start_time:'HH:MM',duration_minutes,weeks,notes}
update_weaknesses {type:'update_weaknesses',weaknesses}
update_profile {type:'update_profile',fields:{team,division,school_start_time,leave_home_time,language}}
rebuild_training {type:'rebuild_training'}
log_note {type:'log_note',note}
Use numeric weekday 0=Sunday through 6=Saturday. Use recurring action for every/each/weekly/varje requests. Never claim a change happened unless an action is returned. Treat school, matches, team training, study and personal events as hard commitments. Return ONLY valid JSON with reply and at most one action.`;
 try{const text=await askGemini(prompt);const parsed=JSON.parse(text.replace(/```json|```/g,'').trim());return NextResponse.json(parsed)}catch{return NextResponse.json({reply:language==='Swedish'?'Jag kunde inte behandla det just nu. Försök igen om en stund.':"I couldn't process that just now — try again in a moment.",action:null})}}
