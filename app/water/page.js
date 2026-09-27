'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function WaterPage(){
 const [profile,setProfile]=useState(null),[dayType,setDayType]=useState('training'),[amount,setAmount]=useState(0),[goal,setGoal]=useState(0),[reason,setReason]=useState(''),[saving,setSaving]=useState(false);
 useEffect(()=>{load()},[]);
 async function load(){const {data:{user}}=await supabase.auth.getUser();if(!user)return;const {data:p}=await supabase.from('profiles').select('*').eq('id',user.id).single();setProfile(p);const today=new Date().toISOString().slice(0,10);const {data:log}=await supabase.from('water_logs').select('*').eq('user_id',user.id).eq('date',today).maybeSingle();const t=log?.day_type||inferDayType();setDayType(t);const g=calcGoal(p,t);setGoal(log?.goal_ml||g);setAmount(log?.amount_ml||0);setReason(`Your starting goal uses your body mass and today's ${t} load. Training and match days need more fluid than a rest day. Pitchpath adjusts the target when your schedule changes.`)}
 function inferDayType(){return 'training'}
 function calcGoal(p,type){const weight=Number(p?.weight_kg)||60;const base=weight*35;const extra=type==='match'?800:type==='training'?500:0;return Math.round((base+extra)/50)*50}
 async function save(nextAmount,nextType=dayType,nextGoal=goal){setSaving(true);const {data:{user}}=await supabase.auth.getUser();if(user)await supabase.from('water_logs').upsert({user_id:user.id,date:new Date().toISOString().slice(0,10),amount_ml:Math.max(0,nextAmount),day_type:nextType,goal_ml:nextGoal},{onConflict:'user_id,date'});setSaving(false)}
 function add(ml){const n=Math.max(0,amount+ml);setAmount(n);save(n)}
 function changeType(t){const g=calcGoal(profile,t);setDayType(t);setGoal(g);save(amount,t,g)}
 if(!profile)return <main className="app-shell"><div className="card">Loading hydration plan…</div></main>;
 const pct=Math.min(100,Math.round(amount/Math.max(goal,1)*100));
 return <main className="app-shell" style={{maxWidth:760}}><div className="card"><span className="pill">DAILY RECOVERY</span><h1 className="page-title" style={{marginTop:10}}>Hydration.</h1><p className="page-subtitle">A simple target that follows your football day.</p><div style={{display:'flex',alignItems:'baseline',gap:8,marginTop:28}}><strong style={{fontSize:48}}>{amount.toLocaleString()}</strong><span style={{color:'var(--ink-soft)'}}>/ {goal.toLocaleString()} ml</span></div><div className="progress-track" style={{height:14,marginTop:14}}><div className="progress-fill" style={{width:`${pct}%`}}/></div><div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:18}}>{['rest','training','match'].map(t=><button key={t} className={dayType===t?'btn-primary':'btn-secondary'} onClick={()=>changeType(t)}>{t}</button>)}</div><div style={{display:'flex',gap:8,marginTop:12}}>{[250,500,750].map(x=><button key={x} className="btn-secondary" onClick={()=>add(x)} disabled={saving}>+{x} ml</button>)}<button className="btn-secondary" onClick={()=>add(-250)} disabled={saving}>−250 ml</button></div><div className="card" style={{marginTop:20,marginBottom:0,background:'rgba(131,151,136,.08)'}}><strong>Why this goal?</strong><p style={{marginBottom:0,color:'var(--ink-soft)',fontSize:14}}>{reason}</p></div></div></main>
}
