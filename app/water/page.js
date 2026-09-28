'use client';
import { useEffect,useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { localDateKey } from '../../lib/dateUtils';

export default function WaterPage(){
 const [profile,setProfile]=useState(null),[dayType,setDayType]=useState('training'),[amount,setAmount]=useState(0),[goal,setGoal]=useState(0),[reason,setReason]=useState(''),[saving,setSaving]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{load()},[]);
 async function load(){
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){setMessage('Please log in to load your hydration plan.');return;}
  const today=localDateKey();
  const [{data:p,error:profileError},{data:log,error:logError}]=await Promise.all([
   supabase.from('profiles').select('*').eq('id',user.id).maybeSingle(),
   supabase.from('water_logs').select('*').eq('user_id',user.id).eq('date',today).maybeSingle()
  ]);
  if(profileError||logError){setMessage(profileError?.message||logError?.message||'Could not load hydration data.');}
  setProfile(p||{});
  const t=log?.day_type||inferDayType();
  const g=log?.goal_ml||calcGoal(p,t);
  setDayType(t);setGoal(g);setAmount(Number(log?.amount_ml)||0);
  setReason(`Your target starts from your current player profile and today's ${t} load. Pitchpath increases the target on football days and keeps a clear daily target even before an AI plan is generated.`);
 }
 function inferDayType(){return 'training'}
 function calcGoal(p,type){
  const weight=Number(p?.weight_kg)||60;
  const height=Number(p?.height_cm)||170;
  const age=Number(p?.age)||16;
  const base=weight*32 + Math.max(0,height-165)*3 + Math.max(0,18-age)*15;
  const extra=type==='match'?900:type==='training'?550:0;
  return Math.max(1800,Math.round((base+extra)/50)*50);
 }
 async function save(nextAmount,nextType=dayType,nextGoal=goal){
  setSaving(true);setMessage('');
  const {data:{user}}=await supabase.auth.getUser();
  if(user){const {error}=await supabase.from('water_logs').upsert({user_id:user.id,date:localDateKey(),amount_ml:Math.max(0,nextAmount),day_type:nextType,goal_ml:nextGoal},{onConflict:'user_id,date'});if(error)setMessage(error.message);}
  setSaving(false);
 }
 function add(ml){const n=Math.max(0,amount+ml);setAmount(n);save(n)}
 function changeType(t){const g=calcGoal(profile,t);setDayType(t);setGoal(g);save(amount,t,g)}
 if(!profile)return <main className="app-shell"><div className="card"><span className="pill">Hydration</span><h2 style={{marginTop:10}}>Your water goal is loading.</h2><p className="muted">{message||'Connecting your player profile…'}</p></div></main>;
 const pct=Math.min(100,Math.round(amount/Math.max(goal,1)*100));
 return <main className="app-shell" style={{maxWidth:760}}><div className="card"><span className="pill">DAILY RECOVERY</span><h1 className="page-title" style={{marginTop:10}}>Hydration.</h1><p className="page-subtitle">Your daily target is always visible and adapts to your football day.</p><div style={{display:'flex',alignItems:'baseline',gap:8,marginTop:28}}><strong style={{fontSize:48}}>{amount.toLocaleString()}</strong><span style={{color:'var(--ink-soft)'}}>/ {goal.toLocaleString()} ml</span></div><div className="progress-track" style={{height:14,marginTop:14}}><div className="progress-fill" style={{width:`${pct}%`}}/></div><div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:18}}>{['rest','training','match'].map(t=><button key={t} className={dayType===t?'btn-primary':'btn-secondary'} onClick={()=>changeType(t)} disabled={saving}>{t}</button>)}</div><div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}>{[250,500,750].map(x=><button key={x} className="btn-secondary" onClick={()=>add(x)} disabled={saving}>+{x} ml</button>)}<button className="btn-secondary" onClick={()=>add(-250)} disabled={saving}>−250 ml</button></div><div className="card" style={{marginTop:20,marginBottom:0,background:'rgba(131,151,136,.08)'}}><strong>Why this goal?</strong><p style={{marginBottom:0,color:'var(--ink-soft)',fontSize:14}}>{reason}</p></div>{message&&<p className="muted" style={{marginBottom:0,marginTop:12}}>{message}</p>}</div></main>
}
