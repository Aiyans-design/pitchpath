'use client';
import { useEffect,useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { localDateKey,localDateTime } from '../../lib/dateUtils';

function dayLoad(events){
 const match=events.filter(e=>e.type==='match').length;
 const training=events.filter(e=>['training','gym','individual'].includes(e.type)).length;
 const school=events.filter(e=>e.type==='school').length;
 const total=match*950+training*550;
 return {match,training,school,total,label:match?'match':training?'training':'rest'};
}

export default function WaterPage(){
 const [profile,setProfile]=useState(null),[amount,setAmount]=useState(0),[goal,setGoal]=useState(0),[reason,setReason]=useState(''),[saving,setSaving]=useState(false),[message,setMessage]=useState(''),[events,setEvents]=useState([]),[loadLabel,setLoadLabel]=useState('rest');
 useEffect(()=>{load()},[]);
 async function load(){
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){setMessage('Please log in to load your hydration plan.');return;}
  const today=localDateKey(); const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);const tomorrowKey=localDateKey(tomorrow);
  const start=localDateTime(today,'00:00').toISOString(); const finish=localDateTime(tomorrowKey,'00:00').toISOString();
  const [{data:p,error:profileError},{data:log,error:logError},{data:calendar,error:calendarError}]=await Promise.all([
   supabase.from('profiles').select('*').eq('id',user.id).maybeSingle(),
   supabase.from('water_logs').select('*').eq('user_id',user.id).eq('date',today).maybeSingle(),
   supabase.from('calendar_events').select('type,title,starts_at,ends_at').eq('user_id',user.id).gte('starts_at',start).lt('starts_at',finish).order('starts_at')
  ]);
  if(profileError||logError||calendarError){setMessage(profileError?.message||logError?.message||calendarError?.message||'Could not load hydration data.');}
  const ev=calendar||[];const load=dayLoad(ev);const g=calcGoal(p,load);
  setProfile(p||{});setEvents(ev);setLoadLabel(load.label);setGoal(g);setAmount(Number(log?.amount_ml)||0);
  setReason(buildReason(p,load,g));
  if(log?.goal_ml!==g && user){await supabase.from('water_logs').upsert({user_id:user.id,date:today,amount_ml:Number(log?.amount_ml)||0,day_type:load.label,goal_ml:g},{onConflict:'user_id,date'});}
 }
 function calcGoal(p,load){
  const weight=Number(p?.weight_kg)||60; const height=Number(p?.height_cm)||170; const age=Number(p?.age)||16;
  const base=weight*30 + Math.max(0,height-165)*2 + Math.max(0,18-age)*10;
  const calendarExtra=Math.min(1600,load.total);
  return Math.max(1800,Math.round((base+calendarExtra)/50)*50);
 }
 function buildReason(p,load,g){
  const identity=[p?.age?`${p.age} years`:null,p?.height_cm?`${p.height_cm} cm`:null,p?.weight_kg?`${p.weight_kg} kg`:null,p?.position,p?.division||p?.league_level].filter(Boolean).join(' · ');
  const eventText=load.match?`Today's calendar contains ${load.match} match${load.match>1?'es':''}, so the planning target is higher.`:load.training?`Today's calendar contains ${load.training} football/gym session${load.training>1?'s':''}, so the planning target is higher.`:'Your calendar currently has no match or training load, so the target starts from your player profile.';
  return `${identity?`Built from ${identity}. `:''}${eventText} The ${g.toLocaleString()} ml figure is a planning target, not a medical prescription; drink regularly and respond to thirst, heat and your actual conditions.`;
 }
 async function save(nextAmount,nextGoal=goal){setSaving(true);setMessage('');const {data:{user}}=await supabase.auth.getUser();if(user){const {error}=await supabase.from('water_logs').upsert({user_id:user.id,date:localDateKey(),amount_ml:Math.max(0,nextAmount),day_type:loadLabel,goal_ml:nextGoal},{onConflict:'user_id,date'});if(error)setMessage(error.message);}setSaving(false)}
 function add(ml){const n=Math.max(0,amount+ml);setAmount(n);save(n)}
 if(!profile)return <main className="app-shell"><div className="card"><span className="pill">Hydration</span><h2 style={{marginTop:10}}>Your water goal is loading.</h2><p className="muted">{message||'Connecting your player profile…'}</p></div></main>;
 const pct=Math.min(100,Math.round(amount/Math.max(goal,1)*100));
 return <main className="app-shell" style={{maxWidth:760}}><div className="card"><span className="pill">CALENDAR-AWARE HYDRATION</span><h1 className="page-title" style={{marginTop:10}}>Hydration.</h1><p className="page-subtitle">Pitchpath reads today's actual calendar before setting your target.</p><div style={{display:'flex',alignItems:'baseline',gap:8,marginTop:28}}><strong style={{fontSize:48}}>{amount.toLocaleString()}</strong><span style={{color:'var(--ink-soft)'}}>/ {goal.toLocaleString()} ml</span></div><div className="progress-track" style={{height:14,marginTop:14}}><div className="progress-fill" style={{width:`${pct}%`}}/></div><div className="premium-tile" style={{marginTop:18,marginBottom:0}}><strong>Today's plan: {loadLabel==='match'?'Match day':loadLabel==='training'?'Training load':'Lighter day'}</strong><p className="muted" style={{marginBottom:0,fontSize:14}}>{reason}</p></div><div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:14}}>{[250,500,750].map(x=><button key={x} className="btn-secondary" onClick={()=>add(x)} disabled={saving}>+{x} ml</button>)}<button className="btn-secondary" onClick={()=>add(-250)} disabled={saving}>−250 ml</button></div>{events.length>0&&<div style={{marginTop:14}}><span className="pill">FROM YOUR CALENDAR</span><div style={{marginTop:8,display:'grid',gap:7}}>{events.slice(0,5).map((e,i)=><div key={i} className="muted" style={{fontSize:13}}>{new Date(e.starts_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} · {e.title}</div>)}</div></div>}{message&&<p className="muted" style={{marginBottom:0,marginTop:12}}>{message}</p>}</div></main>
}
