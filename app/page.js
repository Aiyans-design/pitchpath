'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

const today = () => new Date().toISOString().slice(0,10);

export default function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ water: 0, waterGoal: 0, sleep: null, events: [], injuries: [], streak: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const [{ data: p }, { data: water }, { data: sleep }, { data: events }, { data: injuries }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('water_logs').select('*').eq('user_id', user.id).eq('date', today()).maybeSingle(),
        supabase.from('sleep_logs').select('*').eq('user_id', user.id).eq('date', today()).maybeSingle(),
        supabase.from('calendar_events').select('*').eq('user_id', user.id).gte('starts_at', new Date().toISOString()).order('starts_at').limit(4),
        supabase.from('injuries').select('*').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending:false }),
      ]);
      if (!p) { router.push('/onboarding'); return; }
      if (mounted) { setProfile(p); setStats({ water: water?.amount_ml || 0, waterGoal: water?.goal_ml || Math.round((Number(p.weight_kg)||60)*35/50)*50, sleep, events: events||[], injuries: injuries||[], streak: awaitStreak(user.id) }); setLoading(false); }
    }
    load();
    return () => { mounted = false; };
  }, [router]);

  if (loading) return <main className="app-shell"><div className="card" style={{minHeight:220,display:'grid',placeItems:'center'}}><div style={{animation:'pulse-soft 1.3s infinite'}}>Loading your Pitchpath…</div></div></main>;
  const waterPct = Math.min(100, Math.round((stats.water / Math.max(stats.waterGoal,1))*100));
  const health = stats.injuries.length ? 'Recovery focus' : 'Ready to train';
  const next = stats.events[0];

  return <main className="app-shell">
    <section style={{display:'flex',justifyContent:'space-between',gap:18,alignItems:'flex-end',marginBottom:22}}>
      <div><span className="pill">{profile.position?.toUpperCase() || 'PLAYER'} · {profile.league || 'Football'}</span><h1 className="page-title" style={{marginTop:10}}>Hey {profile.name}.</h1><p className="page-subtitle">Your football, school and recovery — one plan that adapts with you.</p></div>
      <div className="pill" style={{fontSize:14}}>🔥 {stats.streak} day streak</div>
    </section>

    <section className="card" style={{background:'linear-gradient(135deg,rgba(115,135,123,.96),rgba(131,151,136,.88))',color:'#fff'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:18,alignItems:'flex-start'}}><div><span style={{opacity:.75,fontSize:12,fontWeight:800}}>TODAY'S FOCUS</span><h2 style={{fontSize:28,marginTop:5}}>Build consistency, not overload.</h2><p style={{opacity:.86,maxWidth:650,marginBottom:0}}>{profile.summary || 'Your plan will update as you log school, training, nutrition, sleep and recovery.'}</p></div><button className="btn-secondary" style={{background:'rgba(255,255,255,.16)',color:'#fff',borderColor:'rgba(255,255,255,.2)'}} onClick={()=>router.push('/ai')}>Ask AI ✦</button></div>
    </section>

    <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14}}>
      <button className="card" style={{textAlign:'left',border:0,cursor:'pointer'}} onClick={()=>router.push('/water')}><span className="pill">Hydration</span><h3 style={{fontSize:24,marginTop:12}}>{stats.water.toLocaleString()} ml</h3><div className="progress-track" style={{marginTop:12}}><div className="progress-fill" style={{width:`${waterPct}%`}}/></div><p style={{fontSize:13,color:'var(--ink-soft)'}}>{stats.waterGoal.toLocaleString()} ml goal · {waterPct}% complete</p></button>
      <button className="card" style={{textAlign:'left',border:0,cursor:'pointer'}} onClick={()=>router.push('/sleep')}><span className="pill">Sleep</span><h3 style={{fontSize:24,marginTop:12}}>{stats.sleep?.quality ? `${stats.sleep.quality}/5 quality` : 'Not logged yet'}</h3><p style={{fontSize:13,color:'var(--ink-soft)'}}>{stats.sleep?.bedtime && stats.sleep?.wake_time ? `${stats.sleep.bedtime} → ${stats.sleep.wake_time}` : 'Log this morning to let your plan adapt.'}</p></button>
      <button className="card" style={{textAlign:'left',border:0,cursor:'pointer'}} onClick={()=>router.push('/injury')}><span className="pill">Health</span><h3 style={{fontSize:24,marginTop:12}}>{health}</h3><p style={{fontSize:13,color:'var(--ink-soft)'}}>{stats.injuries.length ? `${stats.injuries.length} active issue${stats.injuries.length>1?'s':''} affecting your plan.` : 'No active injury logged.'}</p></button>
    </section>

    <section className="card"><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><div><span className="pill">Next up</span><h2 style={{fontSize:25,marginTop:9}}>{next?.title || 'Plan your week'}</h2><p style={{color:'var(--ink-soft)',marginBottom:0}}>{next ? new Date(next.starts_at).toLocaleString([], {weekday:'long',hour:'2-digit',minute:'2-digit'}) : 'Add school, team training or a match to your calendar.'}</p></div><button className="btn-primary" onClick={()=>router.push('/calendar')}>Open calendar</button></div></section>

    <section className="card"><h2 style={{fontSize:24}}>Your development</h2><p style={{color:'var(--ink-soft)'}}>Pitchpath connects the pieces instead of treating them as separate plans.</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,marginTop:15}}>{[['⚽','Training','/individual'],['🏋','Gym','/gym'],['🥗','Nutrition','/nutrition'],['🧠','Theory','/theory']].map(([icon,label,path])=><button key={path} className="btn-secondary" style={{textAlign:'left'}} onClick={()=>router.push(path)}>{icon} <strong>{label}</strong><br/><small style={{color:'var(--ink-soft)'}}>Open plan →</small></button>)}</div></section>
  </main>;
}

async function awaitStreak(userId) {
  const { data } = await supabase.from('water_logs').select('date').eq('user_id', userId).order('date', {ascending:false}).limit(30);
  if (!data?.length) return 0;
  const dates = new Set(data.map(x=>x.date)); let d = new Date(); let streak = 0;
  for (let i=0;i<30;i++){ const key=d.toISOString().slice(0,10); if(!dates.has(key)) break; streak++; d.setDate(d.getDate()-1); }
  return streak;
}
