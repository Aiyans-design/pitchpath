'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function InjuryPage() {
  const [userId, setUserId] = useState(null);
  const [injuries, setInjuries] = useState([]);
  const [bodyArea, setBodyArea] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [severity, setSeverity] = useState(3);
  const [notes, setNotes] = useState('');

  async function load(uid) {
    const { data } = await supabase.from('injuries').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    setInjuries(data || []);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { setUserId(data.user.id); load(data.user.id); });
  }, []);

  async function addInjury() {
    if (!bodyArea) return;
    await supabase.from('injuries').insert({
      user_id: userId, body_area: bodyArea, symptoms, severity, notes, occurred_at: new Date().toISOString().slice(0, 10),
    });
    setBodyArea(''); setSymptoms(''); setNotes(''); setSeverity(3);
    load(userId);
  }

  const seriousSeverity = severity >= 4;

  return (
    <main style={{ maxWidth: 480, margin: '40px auto', padding: 20 }}>
      <div className="card">
        <h2>Log an injury or illness</h2>
        <input placeholder="Body area (e.g. left ankle)" value={bodyArea} onChange={(e) => setBodyArea(e.target.value)} style={inputStyle} />
        <textarea rows={2} placeholder="Symptoms" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} style={{ ...inputStyle, marginTop: 8, resize: 'vertical' }} />
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--pine)', display: 'block', marginTop: 8 }}>Severity (1-5)</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setSeverity(n)} style={{ width: 34, height: 34, borderRadius: '50%', background: severity === n ? 'var(--pine)' : 'var(--card)', color: severity === n ? '#fff' : 'var(--ink)', border: '1px solid var(--stone)' }}>{n}</button>
          ))}
        </div>
        <textarea rows={2} placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...inputStyle, marginTop: 8, resize: 'vertical' }} />
        {seriousSeverity && (
          <p style={{ fontSize: 13, color: '#b3423a', marginTop: 8 }}>
            This sounds serious — please involve a parent/guardian and a healthcare professional. This app can't diagnose injuries.
          </p>
        )}
        <button className="btn-primary" style={{ marginTop: 10 }} onClick={addInjury}>Log it</button>
      </div>

      <div className="card">
        <h2>History</h2>
        {injuries.length === 0 && <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>Nothing logged.</p>}
        {injuries.map((i) => (
          <div key={i.id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(189,187,182,0.4)', fontSize: 14 }}>
            <strong>{i.body_area}</strong> — severity {i.severity}/5 — {i.status}
          </div>
        ))}
      </div>
    </main>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--stone)',
  background: 'var(--card)', fontSize: 14, fontFamily: 'inherit', color: 'var(--ink)',
};
