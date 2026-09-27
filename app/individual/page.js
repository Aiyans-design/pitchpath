'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function IndividualPage() {
  const [uid, setUid] = useState(null);
  const [profile, setProfile] = useState(null);
  const [weaknesses, setWeaknesses] = useState('');
  const [sessions, setSessions] = useState([]);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUid(data.user.id);

      const [{ data: p }, { data: s }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', data.user.id).single(),
        supabase
          .from('training_sessions')
          .select('*')
          .eq('user_id', data.user.id)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      setProfile(p);
      setWeaknesses(p?.weaknesses || '');
      setSessions(s || []);
    });
  }, []);

  async function save() {
    if (!uid) return;
    await supabase.from('profiles').update({ weaknesses }).eq('id', uid);
  }

  async function build() {
    if (!uid || !profile) return;
    setLoading(true);

    try {
      const [{ data: events }, { data: injuries }] = await Promise.all([
        supabase
          .from('calendar_events')
          .select('*')
          .eq('user_id', uid)
          .gte('starts_at', new Date().toISOString())
          .order('starts_at')
          .limit(14),
        supabase
          .from('injuries')
          .select('*')
          .eq('user_id', uid)
          .eq('status', 'active'),
      ]);

      const res = await fetch('/api/individual-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, weaknesses, events: events || [], injuries: injuries || [] }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result?.error || 'Could not build the session.');
      setPlan(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function logRun() {
    if (!uid || !distance) return;

    const pace = duration
      ? `${(Number(duration) / Number(distance)).toFixed(2)} min/km`
      : null;

    await supabase.from('training_sessions').insert({
      user_id: uid,
      type: 'running',
      distance_km: Number(distance),
      duration_minutes: Number(duration) || null,
      pace,
      notes,
    });

    setDistance('');
    setDuration('');
    setNotes('');

    const { data } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(10);

    setSessions(data || []);
  }

  return (
    <main className="app-shell">
      <div style={{ marginBottom: 22 }}>
        <span className="pill">Individual development</span>
        <h1 className="page-title" style={{ marginTop: 10 }}>
          Your weakness becomes the session.
        </h1>
        <p className="page-subtitle">
          Tell Pitchpath what you struggle with. The session adapts around your position,
          school week, football schedule and recovery.
        </p>
      </div>

      <section className="card">
        <span className="pill">Player profile</span>
        <h2 style={{ fontSize: 27, marginTop: 9 }}>What should improve?</h2>
        <textarea
          className="input-field"
          rows={3}
          value={weaknesses}
          onChange={(e) => setWeaknesses(e.target.value)}
          placeholder="e.g. scanning, weak foot, first touch, acceleration, 1v1 defending"
          style={{ marginTop: 14, resize: 'vertical' }}
        />
        <div style={{ display: 'flex', gap: 9, marginTop: 10 }}>
          <button className="btn-secondary" onClick={save} disabled={!uid}>
            Save weakness
          </button>
          <button className="btn-primary" onClick={build} disabled={loading || !profile}>
            {loading ? 'Building…' : 'Build my session'}
          </button>
        </div>
      </section>

      {plan && (
        <>
          <section
            className="card"
            style={{
              background: 'linear-gradient(135deg,#202522,#3D4941)',
              color: '#fff',
            }}
          >
            <span style={{ fontSize: 11, opacity: 0.6, fontWeight: 800 }}>
              NEXT INDIVIDUAL SESSION
            </span>
            <h2 style={{ fontSize: 30, marginTop: 6 }}>{plan.title}</h2>
            <p style={{ opacity: 0.75 }}>{plan.summary}</p>

            {plan.drills?.map((drill, index) => (
              <div
                key={index}
                className="premium-tile"
                style={{ marginTop: 9, color: 'var(--ink)' }}
              >
                <strong>{drill.name}</strong>
                <div className="muted">
                  {drill.duration_minutes} min · {drill.focus} · {drill.difficulty || 'planned'}
                </div>
                <small className="muted">{drill.instructions}</small>
              </div>
            ))}

            {plan.run && (
              <div
                className="premium-tile"
                style={{ marginTop: 9, color: 'var(--ink)' }}
              >
                <strong>Run · {plan.run.distance_km} km</strong>
                <div className="muted">{plan.run.target}</div>
                {plan.run.notes && <small className="muted">{plan.run.notes}</small>}
              </div>
            )}
          </section>

          {plan.four_week_plan?.length > 0 && (
            <section className="card">
              <span className="pill">4-week block</span>
              <h2 style={{ fontSize: 25, marginTop: 9 }}>Periodized development</h2>
              <p className="muted">
                Pitchpath changes the emphasis instead of repeating the same session every week.
              </p>

              <div className="premium-grid">
                {plan.four_week_plan.map((week) => (
                  <div className="premium-tile" key={week.week}>
                    <span className="pill">Week {week.week}</span>
                    <h3 style={{ marginTop: 9 }}>{week.focus}</h3>
                    {week.run ? (
                      <p className="muted" style={{ marginBottom: 0 }}>
                        Run · {week.run.distance_km} km · {week.run.target}
                      </p>
                    ) : (
                      <p className="muted" style={{ marginBottom: 0 }}>
                        Football-focused week
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <section className="premium-grid">
        <div className="card">
          <span className="pill">Running</span>
          <h2 style={{ fontSize: 25, marginTop: 9 }}>Log a run</h2>
          <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
            <input
              className="input-field"
              type="number"
              min="0"
              step="0.1"
              placeholder="km"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
            />
            <input
              className="input-field"
              type="number"
              min="0"
              step="0.1"
              placeholder="minutes"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
          <input
            className="input-field"
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ marginTop: 9 }}
          />
          <button className="btn-primary" onClick={logRun} style={{ marginTop: 10 }} disabled={!distance}>
            Log run
          </button>
        </div>

        <div className="card">
          <span className="pill">History</span>
          <h2 style={{ fontSize: 25, marginTop: 9 }}>Recent work</h2>
          {sessions.length === 0 ? (
            <p className="muted">Nothing logged yet.</p>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="soft-divider">
                <strong>{session.type}</strong>
                {session.distance_km ? ` · ${session.distance_km} km` : ''}
                {session.duration_minutes ? ` · ${session.duration_minutes} min` : ''}
                {session.pace ? ` · ${session.pace}` : ''}
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
