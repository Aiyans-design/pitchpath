'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function SleepPage() {
  const [bedtime, setBedtime] = useState('22:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState('');
  const [userId, setUserId] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      setUserId(userData.user.id);
      const today = new Date().toISOString().slice(0, 10);
      const { data: log } = await supabase.from('sleep_logs').select('*').eq('user_id', userData.user.id).eq('date', today).maybeSingle();
      if (log) {
        setBedtime(log.bedtime || '22:00');
        setWakeTime(log.wake_time || '07:00');
        setQuality(log.quality || 3);
        setNotes(log.notes || '');
      }
    }
    load();
  }, []);

  async function save() {
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from('sleep_logs').upsert({
      user_id: userId, date: today, bedtime, wake_time: wakeTime, quality, notes,
    }, { onConflict: 'user_id,date' });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <main style={{ maxWidth: 480, margin: '40px auto', padding: 20 }}>
      <div className="card">
        <h2>Sleep</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--pine)' }}>Bedtime</label>
            <input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--pine)' }}>Wake time</label>
            <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} style={inputStyle} />
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--pine)' }}>Sleep quality</label>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setQuality(n)} style={{ width: 36, height: 36, borderRadius: '50%', background: quality === n ? 'var(--pine)' : 'var(--card)', color: quality === n ? '#fff' : 'var(--ink)', border: '1px solid var(--stone)' }}>{n}</button>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--pine)' }}>Notes (optional)</label>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
        <button className="btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={save}>
          {saved ? 'Saved ✓' : 'Save'}
        </button>
      </div>
    </main>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--stone)',
  background: 'var(--card)', fontSize: 14, fontFamily: 'inherit', color: 'var(--ink)', marginTop: 4,
};
