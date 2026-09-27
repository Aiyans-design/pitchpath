'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function GymPage() {
  const [userId, setUserId] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUserId(data.user.id);
      const today = new Date().toISOString().slice(0, 10);
      const { data: existing } = await supabase.from('gym_sessions').select('*').eq('user_id', data.user.id).eq('scheduled_for', today).maybeSingle();
      if (existing) setSession(existing);
    });
  }, []);

  async function generate() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userData.user.id).single();
    const res = await fetch('/api/generate-gym', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile }) });
    const { summary, exercises } = await res.json();
    const withCompletion = exercises.map((ex) => ({ ...ex, completed: false }));
    const today = new Date().toISOString().slice(0, 10);
    const { data: saved } = await supabase.from('gym_sessions').insert({ user_id: userId, scheduled_for: today, exercises: withCompletion, summary }).select().single();
    setSession(saved);
    setLoading(false);
  }

  async function toggleExercise(i) {
    const updated = [...session.exercises];
    updated[i].completed = !updated[i].completed;
    setSession({ ...session, exercises: updated });
    await supabase.from('gym_sessions').update({ exercises: updated }).eq('id', session.id);
  }

  return (
    <main style={{ maxWidth: 480, margin: '40px auto', padding: 20 }}>
      <div className="card">
        <h2>Gym</h2>
        {!session && (
          <>
            <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 12 }}>No session generated for today yet.</p>
            <button className="btn-primary" onClick={generate} disabled={loading}>{loading ? 'Building your session…' : "Generate today's gym session"}</button>
          </>
        )}
        {session && (
          <>
            <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 12 }}>{session.summary}</p>
            {session.exercises.map((ex, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(189,187,182,0.4)' }}>
                <input type="checkbox" checked={ex.completed} onChange={() => toggleExercise(i)} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, textDecoration: ex.completed ? 'line-through' : 'none' }}>{ex.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{ex.sets} sets × {ex.reps} · rest {ex.rest_seconds}s · {ex.purpose}</div>
                </div>
              </label>
            ))}
          </>
        )}
      </div>
    </main>
  );
}
