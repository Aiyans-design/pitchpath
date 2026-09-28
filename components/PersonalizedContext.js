'use client';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { localDateKey } from '../lib/dateUtils';

export default function PersonalizedContext(){
 const pathname=usePathname(); const router=useRouter();
 const [profile,setProfile]=useState(null); const [events,setEvents]=useState([]); const [open,setOpen]=useState(false);
 useEffect(()=>{
  if(!pathname || pathname==='/login' || pathname.startsWith('/onboarding')) return;
  let alive=true;
  (async()=>{
   const {data:{user}}=await supabase.auth.getUser();
   if(!user || !alive) return;
   const tomorrow=new Date(); tomorrow.setDate(tomorrow.getDate()+1);
   const [{data:p},{data:e}]=await Promise.all([
    supabase.from('profiles').select('name,age,height_cm,weight_kg,position,division,team,upper_body_photo_url,league_level,language').eq('id',user.id).maybeSingle(),
    supabase.from('calendar_events').select('type,title,starts_at,ends_at').eq('user_id',user.id).gte('starts_at',`${localDateKey()}T00:00:00`).lt('starts_at',`${localDateKey(tomorrow)}T00:00:00`).order('starts_at').limit(12)
   ]);
   if(alive){setProfile(p||null);setEvents(e||[])}
  })();
  return()=>{alive=false}
 },[pathname]);
 const today=useMemo(()=>{
  const matches=events.filter(e=>e.type==='match'); const trainings=events.filter(e=>['training','gym','individual'].includes(e.type));
  if(matches.length) return `Today includes ${matches.length>1?'match commitments':'a match'}${trainings.length?` and ${trainings.length} training session${trainings.length>1?'s':''}`:''}.`;
  if(trainings.length) return `Today includes ${trainings.length} training block${trainings.length>1?'s':''}.`;
  return 'Today is currently a lighter schedule. Pitchpath can build around school and personal plans.';
 },[events]);
 if(!profile) return null;
 const lang=profile.language==='sv';
 const identity=[profile.age?`${profile.age} ${lang?'år':'yo'}`:null,profile.height_cm?`${profile.height_cm} cm`:null,profile.weight_kg?`${profile.weight_kg} kg`:null,profile.position,profile.division||profile.league_level].filter(Boolean);
 return <div className="personalized-context">
   <div className="personalized-context-main">
    <div className="personalized-context-copy">
      <span className="pill">{lang?'PERSONLIGT FÖR DIG':'BUILT AROUND YOU'}</span>
      <strong>{lang?'Din plan använder din spelarprofil.':'Your plan uses your player profile.'}</strong>
      <span className="muted">{identity.join(' · ')}{profile.upper_body_photo_url?' · '+(lang?'referensbild sparad':'upper-body reference on file'):''}</span>
    </div>
    <button className="personalized-context-toggle" onClick={()=>setOpen(v=>!v)}>{open?(lang?'Stäng':'Close'):(lang?'Varför?':'Why?')}</button>
   </div>
   {open&&<div className="personalized-context-detail">
     <p>{lang?`Pitchpath väger ihop din ålder, längd, vikt, position och division med dagens kalender. ${today} Det gör att träning, gym, återhämtning, sömn, vätska och teori kan anpassas efter din faktiska vecka i stället för en standardplan.`:`Pitchpath combines your age, height, weight, position and division with today's calendar. ${today} That lets training, gym, recovery, sleep, hydration and theory adapt to your actual week instead of a generic plan.`}</p>
     <p className="muted">{lang?'Din uppladdade överkroppsbild kan sparas som visuell referens för coachningskontext. Pitchpath använder den inte för att betygsätta utseende eller kropp.':'Your uploaded upper-body photo can be kept as visual coaching context. Pitchpath does not use it to score appearance or body shape.'}</p>
     <button className="btn-secondary" onClick={()=>router.push('/settings')}>{lang?'Uppdatera profil':'Update profile'}</button>
   </div>}
 </div>
}