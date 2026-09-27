'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function WaterPage() {
  const [profile, setProfile] = useState(null);
  const [dayType, setDayType] = useState('training');
  const [amount, setAmount] = useState(0);
  const [goal, setGoal] = useState(0);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const { data: p } = await supabase.from('profiles').select('*').eq('id', userData.user.id).single();
      setProfile(p);
      const today = new Date().toISOString().slice(0, 10);
      const { data: log } = await supabase.from('water_logs').select('*').eq('user_id', userData.user.id).eq('date', today).maybeSingle();
      if (log) { setAmount(log.amount_ml); setDayType(log.day_type); setGoal(log.goal_ml); }
      else { calcGoal(p, dayType); }
    }
    load();
  }, []);

  function calcGoal(p, type) {
    const base = (p.weight_kg || 60) * 35 + (type === 'training' ? 500 : type === 'match' ? 800 : 0);
    setGoal(Math.round(base / 50) * 50);
  }

  async function save(newAmount, newDayType) {
    const { data: userData } = await supabase.auth.getUser();
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from('water_logs').upsert({
      user_id: userData.user.id, date: today, amount_ml: newAmount, day_type: newDayType, goal_ml: goal,
    }, { onConflict: 'user_id,date' });
  }

  function addWater(ml) {
    const next = Math.max(0, amount + ml);
    setAmount(next);
    save(next, dayType);
  }

  function changeDayType(type) {
    setDayType(type);
    calcGoal(profile, type);
    save(amount, type);
  }

  if (!profile) return null;

  return (
    <main style={{ maxWidth: 480, margin: '40px auto', padding: 20 }}>
      <div className="card">
        <h2>Hydration</h2>
        <p style={{ fontSize: 26, fontWeight: 800 }}>{amount} / {goal} ml</p>
        <div style={{ height: 20, background: 'rgba(131,151,136,0.18)', borderRadius: 100, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(100, 100 * amount / (goal || 1))}%`, background: 'var(--pine)', transition: 'width .4s' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button className="btn-primary" onClick={() => addWater(250)}>+250ml</button>
          <button className="btn-primary" onClick={() => addWater(-250)}>-250ml</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {['rest', 'training', 'match'].map((t) => (
            <button key={t} onClick={() => changeDayType(t)} style={{ padding: '8px 14px', borderRadius: 100, background: dayType === t ? 'var(--pine)' : 'var(--card)', color: dayType === t ? '#fff' : 'var(--ink)', border: '1px solid var(--stone)' }}>{t}</button>
          ))}
        </div>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 12 }}>
          Estimated from your weight and today's {dayType} day — a starting guideline, not a medical figure.
        </p>
      </div>
    </main>
  );
}
