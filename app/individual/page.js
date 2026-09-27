'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function IndividualPage() {
  const [userId, setUserId] = useState(null);
  const [weaknesses, setWeaknesses] = useState('');
  const [sessions, setSessions] = useState([]);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');

  async function load(uid) {
    const { data: profile } = await supabase.from('profiles').select('weaknesses').eq('id', uid).single();
    setWeaknesses(profile?.weaknesses || '');
    const { data } = await supabase.from('training_sessions').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(10);
    setSessions(data || []);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { setUserId(data.user.id); load(data.user.id); });
  }, []);

  async function saveWeaknesses() {
    await supabase.from('profiles').update({ weaknesses }).eq('id', userId);
  }

  async function logRun() {
    if (!distance) return;
    const pace = duration && distance ? (Number(duration) / Number(distance)).toFixed(1) + ' min/km' : null;
    await supabase.from('training_sessions').insert({
      user_id: userId, type: 'running', distance_km: Number(distance), duration_minutes: Number(duration) || null, pace, notes,
    });
    setDistance(''); setDuration(''); setNotes('');
    load(userId);
  }

  return (
    <main style={{ maxWidth: 480, margin: '40px auto', padding: 20 }}>
      <div className="card">
        <h2>Weaknesses to work on</h2>
        <textarea rows={2} value={weaknesses} onChange={(e) => setWeaknesses(e.target.value)}
          placeholder="e.g. weak foot, first touch, decision-making"
          style={{ width: '100%', padding: 10, borderRadius: 12, border: '1.5px solid var(--stone)', fontFamily: 'inherit' }} />
        <button className="btn-primary" style={{ marginTop: 8 }} onClick={saveWeaknesses}>Save</button>
      </div>

      <div className="card">
        <h2>Log a run</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Distance (km)" type="number" value={distance} onChange={(e) => setDistance(e.target.value)} style={inputStyle} />
          <input placeholder="Duration (min)" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} style={inputStyle} />
        </div>
        <input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...inputStyle, marginTop: 8 }} />
        <button className="btn-primary" style={{ marginTop: 8 }} onClick={logRun}>Log run</button>
      </div>

      <div className="card">
        <h2>Recent sessions</h2>
        {sessions.length === 0 && <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>Nothing logged yet.</p>}
        {sessions.map((s) => (
          <div key={s.id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(189,187,182,0.4)', fontSize: 14 }}>
            {s.type === 'running' ? `Run: ${s.distance_km}km in ${s.duration_minutes}min (${s.pace})` : s.type}
          </div>
        ))}
      </div>
    </main>
  );
}

const inputStyle = {
  flex: 1, padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--stone)',
  background: 'var(--card)', fontSize: 14, fontFamily: 'inherit', color: 'var(--ink)',
};
