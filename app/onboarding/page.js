'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [step, setStep] = useState('form');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [form, setForm] = useState({ name:'', country:'', age:'', position:'', height_cm:'', weight_kg:'', body_size:'', team:'', league:'', goals:'' });

  useEffect(() => { supabase.auth.getUser().then(({data}) => { if(!data.user) router.push('/login'); else setUserId(data.user.id); setCheckingAuth(false); }); }, [router]);
  const update = (field,value) => setForm(f=>({...f,[field]:value}));

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setStep('loading');
    try {
      const res = await fetch('/api/onboarding-summary',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || 'Could not build your profile.');
      const aiSummary = payload.summary || 'Your profile is ready.';
      let photoUrl = null;
      if(photoFile){
        const ext = photoFile.name.split('.').pop()?.toLowerCase() || 'jpg';
        const filePath = `${userId}/${crypto.randomUUID()}.${ext}`;
        const {error: uploadError}=await supabase.storage.from('avatars').upload(filePath,photoFile,{contentType:photoFile.type,upsert:false});
        if(uploadError) throw uploadError;
        photoUrl=filePath;
      }
      const {error:dbError}=await supabase.from('profiles').upsert({id:userId,name:form.name,country:form.country,age:form.age?Number(form.age):null,position:form.position,height_cm:form.height_cm?Number(form.height_cm):null,weight_kg:form.weight_kg?Number(form.weight_kg):null,body_size:form.body_size,team:form.team,league:form.league,goals:form.goals,personal_wish:form.goals,summary:aiSummary,photo_url:photoUrl});
      if(dbError) throw dbError;
      setSummary(aiSummary); setStep('summary');
    } catch(err){setError(err.message || 'Something went wrong.');setStep('form');}
  }

  if(checkingAuth) return null;
  return <main className="app-shell" style={{maxWidth:760}}>
    {step==='form' && <div className="card">
      <span className="pill">PITCHPATH · PLAYER SETUP</span><h1 className="page-title" style={{marginTop:12}}>Build your player profile.</h1><p className="page-subtitle" style={{marginBottom:24}}>Tell Pitchpath about football, school and your goals. The plan should fit your actual week — not the other way around.</p>
      <form onSubmit={handleSubmit}>
        <div style={grid}><Field label="Name"><input className="input-field" required value={form.name} onChange={e=>update('name',e.target.value)}/></Field><Field label="Country"><input className="input-field" placeholder="Sweden" value={form.country} onChange={e=>update('country',e.target.value)}/></Field></div>
        <div style={grid}><Field label="Age"><input className="input-field" type="number" min="10" max="25" required value={form.age} onChange={e=>update('age',e.target.value)}/></Field><Field label="Position"><input className="input-field" required placeholder="CDM, CB, winger…" value={form.position} onChange={e=>update('position',e.target.value)}/></Field></div>
        <div style={grid}><Field label="Height (cm)"><input className="input-field" type="number" value={form.height_cm} onChange={e=>update('height_cm',e.target.value)}/></Field><Field label="Weight (kg)"><input className="input-field" type="number" step="0.1" value={form.weight_kg} onChange={e=>update('weight_kg',e.target.value)}/></Field></div>
        <Field label="Body size / build"><input className="input-field" placeholder="Optional: small, medium, broad, etc." value={form.body_size} onChange={e=>update('body_size',e.target.value)}/></Field>
        <Field label="Team"><input className="input-field" value={form.team} onChange={e=>update('team',e.target.value)}/></Field>
        <Field label="League / competition"><input className="input-field" required placeholder="e.g. P16 Division 1 2016 B-Slutspel östra Götaland" value={form.league} onChange={e=>update('league',e.target.value)}/></Field>
        <Field label="Personal wishes / what you want to improve"><textarea className="input-field" rows={4} placeholder="Weaknesses, performance goals, school constraints, personal wishes…" value={form.goals} onChange={e=>update('goals',e.target.value)}/></Field>
        <Field label="Upper-body photo (optional)"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setPhotoFile(e.target.files?.[0] || null)}/></Field>
        {error && <p style={{color:'var(--danger)'}}>{error}</p>}
        <button type="submit" className="btn-primary" style={{width:'100%',marginTop:8}}>Build my Pitchpath ✦</button>
      </form>
    </div>}
    {step==='loading' && <div className="card" style={{minHeight:320,display:'grid',placeItems:'center',textAlign:'center'}}><div><div className="pill">ANALYZING</div><h2 style={{fontSize:32,marginTop:14}}>Connecting your football week…</h2><p style={{color:'var(--ink-soft)'}}>Your profile, school context and goals are being turned into one development system.</p></div></div>}
    {step==='summary' && <div className="card"><span className="pill">PROFILE READY</span><h1 className="page-title" style={{marginTop:12}}>Welcome, {form.name}.</h1><p style={{color:'var(--ink-soft)',fontSize:17,lineHeight:1.7,marginTop:16}}>{summary}</p><button className="btn-primary" style={{width:'100%',marginTop:18}} onClick={()=>router.push('/')}>Enter Pitchpath →</button></div>}
  </main>;
}
function Field({label,children}){return <div style={{marginBottom:16}}><label style={{display:'block',fontSize:12,fontWeight:800,color:'var(--pine)',marginBottom:7,textTransform:'uppercase',letterSpacing:'.04em'}}>{label}</label>{children}</div>}
const grid={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14};
