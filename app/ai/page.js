'use client';
import { useEffect,useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const weekdayNames=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function nextWeekday(weekday){
  const now=new Date();
  const target=new Date(now);
  const delta=(Number(weekday)-target.getDay()+7)%7;
  target.setDate(target.getDate()+delta);
  if(delta===0) target.setDate(target.getDate()+7);
  return target;
}

function localISO(date){
  const p=n=>String(n).padStart(2,'0');
  return `${date.getFullYear()}-${p(date.getMonth()+1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}:00`;
}

function hasOverlap(start,end,events){
  return (events||[]).some(e=>{
    const a=new Date(e.starts_at).getTime();
    const b=new Date(e.ends_at||e.starts_at).getTime();
    return start.getTime()<b && end.getTime()>a;
  });
}

export default function AiPage(){
 const [messages,setMessages]=useState([]),[input,setInput]=useState(''),[context,setContext]=useState(null),[sending,setSending]=useState(false),[language,setLanguage]=useState('en');
 useEffect(()=>{(async()=>{const {data:u}=await supabase.auth.getUser();if(!u.user)return;const uid=u.user.id;const [{data:profile},{data:events},{data:injuries},{data:logs}]=await Promise.all([supabase.from('profiles').select('*').eq('id',uid).single(),supabase.from('calendar_events').select('*').eq('user_id',uid).order('starts_at').limit(100),supabase.from('injuries').select('*').eq('user_id',uid).eq('status','active'),supabase.from('nutrition_logs').select('*').eq('user_id',uid).order('created_at',{ascending:false}).limit(10)]);setContext({uid,profile,upcomingEvents:events||[],activeInjuries:injuries||[],recentNutrition:logs||[]});setLanguage(profile?.language||localStorage.getItem('pitchpath-language')||'en');setMessages([{role:'ai',text:profile?.language==='sv'?'Pitchpath är redo. Jag känner till din kalender, skola, träning och återhämtning. Be mig göra en konkret ändring så utför jag den och justerar planen.':'Pitchpath is ready. I know your calendar, school, training and recovery. Ask me for a concrete change and I will execute it and adjust the plan.'}])})()},[]);

 async function rebalance(){
  if(!context?.uid)return;
  const {data:allEvents,error:eventsError}=await supabase.from('calendar_events').select('*').eq('user_id',context.uid).gte('starts_at',new Date().toISOString()).order('starts_at').limit(120);
  const {data:injuries,error:injuryError}=await supabase.from('injuries').select('*').eq('user_id',context.uid).eq('status','active');
  if(eventsError||injuryError)throw new Error(eventsError?.message||injuryError?.message||'Could not read your schedule.');
  const fixed=(allEvents||[]).filter(e=>!e.notes?.startsWith('[AI PLAN]')&&!e.notes?.startsWith('[AI RECOVERY]'));
  const ids=(allEvents||[]).filter(e=>e.notes?.startsWith('[AI PLAN]')||e.notes?.startsWith('[AI RECOVERY]')).map(e=>e.id);
  if(ids.length){const {error}=await supabase.from('calendar_events').delete().in('id',ids);if(error)throw error}
  const localized=fixed.map(e=>({...e,local_start:new Date(e.starts_at).toLocaleString('sv-SE',{dateStyle:'short',timeStyle:'short'}),local_end:e.ends_at?new Date(e.ends_at).toLocaleString('sv-SE',{dateStyle:'short',timeStyle:'short'}):null}));
  const res=await fetch('/api/plan-training',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({profile:context.profile,events:localized,injuries:injuries||[],language:context.profile?.language||'en'})});
  const out=await res.json();if(!res.ok)throw new Error(out?.error||'Could not rebalance training.');
  const rows=(out.sessions||[]).filter(s=>s.day&&s.start_time&&s.type).map(s=>({user_id:context.uid,type:s.type,title:`${s.title||'Pitchpath session'} · AI`,starts_at:new Date(`${s.day}T${s.start_time}`).toISOString(),ends_at:s.end_time?new Date(`${s.day}T${s.end_time}`).toISOString():null,notes:`[AI PLAN] ${s.description||''}`}));
  if(rows.length){const {error}=await supabase.from('calendar_events').insert(rows);if(error)throw error}
  setContext(c=>c?{...c,upcomingEvents:[...fixed,...rows]}:c);
 }

 async function addRecurring(action){
  const weeks=Math.min(Math.max(Number(action.weeks)||8,1),16);
  const base=nextWeekday(action.weekday);
  const duration=Math.min(Math.max(Number(action.duration_minutes)||60,20),180);
  const rows=[];
  for(let i=0;i<weeks;i++){
    const start=new Date(base);start.setDate(base.getDate()+i*7);
    const [h,m]=(action.start_time||'17:00').split(':').map(Number);start.setHours(h||0,m||0,0,0);
    const end=new Date(start.getTime()+duration*60000);
    if(hasOverlap(start,end,context.upcomingEvents||[])){
      throw new Error(`${weekdayNames[start.getDay()]} ${action.start_time||'17:00'} conflicts with an existing calendar event.`);
    }
    rows.push({user_id:context.uid,type:action.event_type||'gym',title:action.title||'Gym',starts_at:localISO(start),ends_at:localISO(end),notes:`[PLAYER RECURRING] weekly · ${action.notes||''}`});
  }
  const {error}=await supabase.from('calendar_events').insert(rows);if(error)throw error;
  await rebalance();
  return language==='sv'?`Jag lade in ${action.title||'gym'} varje vecka i ${weeks} veckor och justerade resten av träningsplanen runt det.`:`I added ${action.title||'gym'} every week for ${weeks} weeks and rebuilt the rest of your training plan around it.`;
 }

 async function removeRecurring(action){
  let query=supabase.from('calendar_events').delete().eq('user_id',context.uid).like('notes','[PLAYER RECURRING]%');
  if(action.title)query=query.ilike('title',`%${action.title}%`);
  const {error}=await query.gte('starts_at',new Date().toISOString());if(error)throw error;
  await rebalance();
  return language==='sv'?'Den återkommande aktiviteten är borttagen och planen är ombyggd.':'The recurring activity was removed and the training plan was rebuilt.';
 }

 async function replaceRecurring(action){
  await removeRecurring({title:action.old_title||'Gym'});
  return addRecurring(action);
 }

 async function apply(action){
  if(!action||!context?.uid)return null;
  if(action.type==='add_recurring_event')return addRecurring(action);
  if(action.type==='remove_recurring_event')return removeRecurring(action);
  if(action.type==='replace_recurring_event')return replaceRecurring(action);
  if(action.type==='update_weaknesses'){const {error}=await supabase.from('profiles').update({weaknesses:action.weaknesses}).eq('id',context.uid);if(error)throw error;setContext(c=>c?{...c,profile:{...c.profile,weaknesses:action.weaknesses}}:c);await rebalance();return language==='sv'?'Svagheter uppdaterade och träningsplanen justerad.':'Weaknesses updated and the training plan was adjusted.'}
  if(action.type==='update_profile'){const {error}=await supabase.from('profiles').update(action.fields||{}).eq('id',context.uid);if(error)throw error;setContext(c=>c?{...c,profile:{...c.profile,...action.fields}}:c);return language==='sv'?'Profilen är uppdaterad.':'Profile updated.'}
  if(action.type==='add_calendar_event'){const now=new Date();const target=new Date(now);const delta=(Number(action.weekday)-target.getDay()+7)%7;target.setDate(target.getDate()+delta);const [h,m]=(action.start_time||'17:00').split(':').map(Number);target.setHours(h||0,m||0,0,0);if(delta===0&&target<now)target.setDate(target.getDate()+7);const end=new Date(target.getTime()+(Number(action.duration_minutes)||60)*60000);if(hasOverlap(target,end,context.upcomingEvents||[]))throw new Error('That time conflicts with an existing calendar event.');const {error}=await supabase.from('calendar_events').insert({user_id:context.uid,type:action.event_type||'personal',title:action.title||'Personal',starts_at:localISO(target),ends_at:localISO(end),notes:action.notes||'[AI ASSISTANT] Added at player request'});if(error)throw error;await rebalance();return language==='sv'?`La till ${action.title||'aktiviteten'} och justerade planen.`:`Added ${action.title||'event'} and rebalanced the plan.`}
  if(action.type==='rebuild_training'){await rebalance();return language==='sv'?'Träningskalendern är omplanerad.':'Training calendar rebuilt.'}
  if(action.type==='log_note')return language==='sv'?'Antecknat.':'Noted.';
  return null;
 }

 async function send(){
  if(!input.trim()||sending)return;const msg=input.trim();setInput('');setMessages(m=>[...m,{role:'user',text:msg}]);setSending(true);
  try{const res=await fetch('/api/assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg,context})});const out=await res.json();let suffix='';if(out.action){try{const result=await apply(out.action);suffix=result?` ${result}`:''}catch(e){suffix=` ${language==='sv'?`Ändringen misslyckades: ${e.message}`:`I couldn't apply that change: ${e.message}`}`}}setMessages(m=>[...m,{role:'ai',text:(out.reply||'Done.')+suffix}])}catch(e){setMessages(m=>[...m,{role:'ai',text:language==='sv'?'Något gick fel. Försök igen.':'Something went wrong. Please try again.'}])}finally{setSending(false)}
 }

 return <main className="app-shell"><div style={{marginBottom:22}}><span className="pill">Pitchpath AI</span><h1 className="page-title" style={{marginTop:10}}>{language==='sv'?'Ditt prestationssystem.':'Your performance brain.'}</h1><p className="page-subtitle">{language==='sv'?'Be mig ändra kalendern, träningsbelastningen eller din profil. Jag använder hela din vecka som kontext.':'Tell me what you want to change. I use your full week, school, football, recovery and profile as context.'}</p></div><section className="card" style={{minHeight:520,display:'flex',flexDirection:'column'}}><div style={{flex:1,display:'flex',flexDirection:'column',gap:12}}>{messages.map((m,i)=><div key={i} className="premium-tile" style={{alignSelf:m.role==='user'?'flex-end':'flex-start',maxWidth:'82%',background:m.role==='user'?'var(--pine)':'rgba(255,252,249,.7)',color:m.role==='user'?'#fff':'var(--ink)'}}>{m.text}</div>)}{sending&&<div className="muted">{language==='sv'?'Tänker…':'Thinking…'}</div>}</div><div style={{display:'flex',gap:9,marginTop:18}}><input className="input-field" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder={language==='sv'?'T.ex. Jag vill gymma varje måndag efter skolan':'e.g. I want gym every Monday after school'}/><button className="btn-primary" onClick={send} disabled={sending}>{language==='sv'?'Skicka':'Send'}</button></div></section></main>}
