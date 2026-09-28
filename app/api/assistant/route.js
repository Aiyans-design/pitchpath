import { NextResponse } from 'next/server';
import { askGemini } from '../../../lib/gemini';

const dayMap={sunday:0,monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6,söndag:0,måndag:1,tisdag:2,onsdag:3,torsdag:4,fredag:5,lördag:6};
const dayNames=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
function detectRecurring(message,language,profile){
 const m=message.toLowerCase().trim();
 const every=/\b(?:every|each|weekly|varje)\s+(?:(?:week|vecka)\b|monday|tuesday|wednesday|thursday|friday|saturday|sunday|måndag|tisdag|onsdag|torsdag|fredag|lördag|söndag)/i.exec(m);
 if(!every)return null;
 const dayToken=Object.keys(dayMap).find(d=>m.includes(d));
 const weekday=dayToken==null?1:dayMap[dayToken];
 const activity=/(gym|gymma|gymmet|styrketräning|styrka)/i.test(m)?{title:'Gym',event_type:'gym',duration_minutes:75}:{/(individual|individuell|football session|fotbollspass|extra pass)/i.test(m)?{title:'Individual training',event_type:'individual',duration_minutes:60}:{/(run|running|löpning|springa|5k|5 km|2.5k|2,5 km)/i.test(m)?{title:'Running',event_type:'individual',duration_minutes:45}:{/(training|träning|team training|lagträning)/i.test(m)?{title:'Team training',event_type:'training',duration_minutes:90}:null};
 if(!activity)return null;
 const timeMatch=/(?:at|kl\.?|klockan)\s*(\d{1,2})(?::(\d{2}))?/i.exec(m);
 const start_time=timeMatch?`${String(Math.min(23,Number(timeMatch[1]))).padStart(2,'0')}:${String(Number(timeMatch[2]||0)).padStart(2,'0')}`:'17:00';
 const afterSchool=/(after school|after skolan|efter skolan)/i.test(m);
 const weeksMatch=/(\d+)\s*(?:weeks?|veckor)/i.exec(m);const weeks=Math.min(Math.max(Number(weeksMatch?.[1]||8),1),16);
 const name=dayNames[weekday];
 const reply=language==='Swedish'?`Jag tolkar det som ${activity.title.toLowerCase()} varje ${name} i ${weeks} veckor${afterSchool?' efter skolan':''}. Jag kontrollerar konflikter och bygger om träningsplanen efter att kalendern är uppdaterad.`:`I understand this as ${activity.title.toLowerCase()} every ${name} for ${weeks} weeks${afterSchool?' after school':''}. I’ll check conflicts and rebuild the training plan after updating the calendar.`;
 return {reply,action:{type:'add_recurring_event',title:activity.title,event_type:activity.event_type,weekday,start_time,duration_minutes:activity.duration_minutes,weeks,after_school:afterSchool,notes:afterSchool?'After school · requested through Pitchpath AI':'Requested through Pitchpath AI'}};
}
export async function POST(request){
 try{
  const body=await request.json();const {message,context}=body;const language=context?.profile?.language==='sv'?'Swedish':'English';
  if(!message||typeof message!=='string')return NextResponse.json({reply:language==='Swedish'?'Skriv vad du vill ändra.':'Tell me what you want to change.',action:null},{status:400});
  const deterministic=detectRecurring(message,language,context?.profile);if(deterministic)return NextResponse.json(deterministic);
  const prompt=`You are Pitchpath's action-oriented performance AI for a teenage football player who also has school. Write in ${language}. You are an execution planner, not a generic chatbot. Inspect the complete player/calendar context and return an executable action when the user requests a change. CALENDAR IS THE SOURCE OF TRUTH. Never reinterpret existing times. School 08:10 means 08:10. Respect leave-home time ${context?.profile?.leave_home_time||'unknown'} and school start ${context?.profile?.school_start_time||'unknown'}. PLAYER CONTEXT: ${JSON.stringify(context)} USER REQUEST: ${message} SUPPORTED ACTIONS: add_calendar_event {type:'add_calendar_event',title,event_type,weekday,start_time:'HH:MM',duration_minutes,notes,after_school?:boolean}; add_recurring_event {type:'add_recurring_event',title,event_type,weekday:0-6,start_time:'HH:MM',duration_minutes,weeks,notes,after_school?:boolean}; remove_recurring_event {type:'remove_recurring_event',title,weekday:0-6}; replace_recurring_event {type:'replace_recurring_event',old_title,old_weekday:0-6,title,event_type,weekday:0-6,start_time:'HH:MM',duration_minutes,weeks,notes,after_school?:boolean}; update_weaknesses {type:'update_weaknesses',weaknesses}; update_profile {type:'update_profile',fields:{team,division,school_start_time,leave_home_time,language}}; rebuild_training {type:'rebuild_training'}; log_note {type:'log_note',note}. Use numeric weekday 0=Sunday through 6=Saturday. Use recurring action for every/each/weekly/varje requests. Never claim a change happened unless an action is returned. Treat school, matches, team training, study and personal events as hard commitments. Return ONLY valid JSON with reply and at most one action.`;
  const text=await askGemini(prompt);const cleaned=text.replace(/```json|```/g,'').trim();const parsed=JSON.parse(cleaned);return NextResponse.json(parsed&&typeof parsed==='object'?parsed:{reply:'I could not determine a safe action.',action:null});
 }catch(error){return NextResponse.json({reply:'I could not process that request safely right now. No changes were made.',action:null,error:String(error?.message||error)},{status:200});}
}
