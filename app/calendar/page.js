'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [userId, setUserId] = useState(null);
  const [type, setType] = useState('school');
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');

  async function load(uid) {
    const { data } = await supabase.from('calendar_events').select('*').eq('user_id', uid).order('starts_at', { ascending: true });
    setEvents(data || []);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user.id);
      load(data.user.id);
    });
  }, []);

  async function addEvent() {
    if (!title || !startsAt) return;
    await supabase.from('calendar_events').insert({
      user_id: userId, type, title, starts_at: new Date(startsAt).toISOString(),
    });
    setTitle(''); setStartsAt('');
    load(userId);
  }

  return (
    <main style={{ maxWidth: 480, margin: '40px auto', padding: 20 }}>
      <div className="card">
        <h2>Your week</h2>
        {events.length === 0 && <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>No events yet — add your school, training and matches below.</p>}
        {events.map((e) => (
          <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(189,187,182,0.4)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{e.title}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{new Date(e.starts_at).toLocaleString()}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 100, background: 'var(--sage)', color: '#fff', height: 'fit-content' }}>{e.type}</span>
          </div>
        ))}
      </div>
      <div className="card">
        <h2>Add event</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
            <option value="school">School</option>
            <option value="training">Team training</option>
            <option value="gym">Gym</option>
            <option value="match">Match</option>
            <option value="individual">Individual session</option>
          </select>
          <input placeholder="Title / notes" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
          <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} style={inputStyle} />
          <button className="btn-primary" onClick={addEvent}>Add</button>
        </div>
      </div>
    </main>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--stone)',
  background: 'var(--card)', fontSize: 14, fontFamily: 'inherit', color: 'var(--ink)',
};
