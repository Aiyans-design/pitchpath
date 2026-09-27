'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

const TYPE_COLORS = {
  school: 'var(--stone)', training: 'var(--sage)', gym: 'var(--pine)',
  match: '#b3423a', individual: '#8a7ea8',
};

function startOfWeek(offset = 0) {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday + offset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function CalendarPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [activeDay, setActiveDay] = useState(0); // 0-6, Mon-Sun

  const [type, setType] = useState('school');
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const [scanning, setScanning] = useState(false);
  const [scanPreview, setScanPreview] = useState(null);
  const [scanError, setScanError] = useState('');

  const [planning, setPlanning] = useState(false);
  const [planPreview, setPlanPreview] = useState(null);
  const [planError, setPlanError] = useState('');

  const weekStart = startOfWeek(weekOffset);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const selectedDate = days[activeDay];

  async function load(uid) {
    const rangeStart = startOfWeek(weekOffset);
    const rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeEnd.getDate() + 7);
    const { data } = await supabase.from('calendar_events').select('*')
      .eq('user_id', uid)
      .gte('starts_at', rangeStart.toISOString())
      .lt('starts_at', rangeEnd.toISOString())
      .order('starts_at');
    setEvents(data || []);
  }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUserId(data.user.id);
      const { data: p } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      setProfile(p);
      load(data.user.id);
    });
  }, [weekOffset]);

  function eventsForDay(date) {
    return events.filter((e) => new Date(e.starts_at).toDateString() === date.toDateString())
      .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  }

  function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  async function addEvent() {
    if (!title || !startTime) return;
    const dateStr = selectedDate.toISOString().slice(0, 10);
    const startsAt = new Date(`${dateStr}T${startTime}`);
    const endsAt = endTime ? new Date(`${dateStr}T${endTime}`) : null;
    await supabase.from('calendar_events').insert({
      user_id: userId, type, title, starts_at: startsAt.toISOString(), ends_at: endsAt ? endsAt.toISOString() : null,
    });
    setTitle(''); setStartTime(''); setEndTime('');
    load(userId);
  }

  function handleEventClick(e) {
    if (e.type === 'gym') router.push('/gym');
    if (e.type === 'individual') router.push('/individual');
  }

  // --- photo schedule scan ---
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setScanning(true); setScanError(''); setScanPreview(null);
    const base64Image = await fileToBase64(file);
    const res = await fetch('/api/scan-schedule', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image, mimeType: file.type }),
    });
    const data = await res.json();
    setScanning(false);
    if (data.error || !data.events || data.events.length === 0) setScanError(data.error || "Couldn't find events in that photo.");
    else setScanPreview(data.events.map((ev) => ({ ...ev, include: true })));
  }

  async function confirmScan() {
    const rows = scanPreview.filter((e) => e.include).map((e) => ({
      user_id: userId, type: e.type || 'school', title: e.title,
      starts_at: new Date().toISOString(), notes: `${e.day || ''} ${e.time || ''}`.trim(),
    }));
    if (rows.length > 0) await supabase.from('calendar_events').insert(rows);
    setScanPreview(null);
    load(userId);
  }

  // --- AI training planning ---
  async function planTraining() {
    setPlanning(true); setPlanError(''); setPlanPreview(null);
    const { data: injuries } = await supabase.from('injuries').select('*').eq('user_id', userId).eq('status', 'active');
    const res = await fetch('/api/plan-training', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, events, injuries }),
    });
    const data = await res.json();
    setPlanning(false);
    if (data.error || !data.sessions || data.sessions.length === 0) setPlanError(data.error || 'No sessions proposed.');
    else setPlanPreview(data.sessions.map((s) => ({ ...s, include: true })));
  }

  async function confirmPlan() {
    const rows = planPreview.filter((s) => s.include).map((s) => ({
      user_id: userId, type: s.type, title: s.title,
      starts_at: new Date(`${s.day}T${s.start_time}`).toISOString(),
      ends_at: s.end_time ? new Date(`${s.day}T${s.end_time}`).toISOString() : null,
      notes: s.description,
    }));
    if (rows.length > 0) await supabase.from('calendar_events').insert(rows);
    setPlanPreview(null);
    load(userId);
  }

  if (!profile) return null;

  return (
    <main style={{ maxWidth: 520, margin: '30px auto', padding: 20 }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <button onClick={() => setWeekOffset((w) => w - 1)} style={navBtn}>←</button>
          <h2 style={{ fontSize: 16 }}>
            {weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {days[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </h2>
          <button onClick={() => setWeekOffset((w) => w + 1)} style={navBtn}>→</button>
        </div>

        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', marginBottom: 14 }}>
          {days.map((d, i) => (
            <button key={i} onClick={() => setActiveDay(i)} style={{
              flex: '0 0 auto', padding: '8px 10px', borderRadius: 12, textAlign: 'center', minWidth: 44,
              background: i === activeDay ? 'var(--pine)' : 'var(--card)', color: i === activeDay ? '#fff' : 'var(--ink)',
              border: '1px solid var(--stone)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700 }}>{d.toLocaleDateString(undefined, { weekday: 'short' })}</div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{d.getDate()}</div>
            </button>
          ))}
        </div>

        {eventsForDay(selectedDate).length === 0 && (
          <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>Nothing on this day.</p>
        )}
        {eventsForDay(selectedDate).map((e) => (
          <div key={e.id} onClick={() => handleEventClick(e)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', marginBottom: 6,
              borderRadius: 12, background: 'var(--cream)', borderLeft: `4px solid ${TYPE_COLORS[e.type] || 'var(--stone)'}`,
              cursor: (e.type === 'gym' || e.type === 'individual') ? 'pointer' : 'default',
            }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{e.title}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                {e.notes ? e.notes : e.ends_at ? `${fmtTime(e.starts_at)} – ${fmtTime(e.ends_at)}` : fmtTime(e.starts_at)}
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 100, background: TYPE_COLORS[e.type], color: '#fff' }}>{e.type}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Add to {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
            <option value="school">School</option>
            <option value="training">Team training</option>
            <option value="match">Match</option>
          </select>
          <input placeholder="Title / notes" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="end (optional)" />
          </div>
          <button className="btn-primary" onClick={addEvent}>Add</button>
        </div>
      </div>

      <div className="card">
        <h2>Scan a schedule photo</h2>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 10 }}>Photo of school or football schedule — review before it's added.</p>
        <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} />
        {scanning && <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginTop: 8 }}>Reading the photo…</p>}
        {scanError && <p style={{ color: '#b3423a', fontSize: 13, marginTop: 8 }}>{scanError}</p>}
        {scanPreview && (
          <div style={{ marginTop: 12 }}>
            {scanPreview.map((ev, i) => (
              <label key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0', fontSize: 13 }}>
                <input type="checkbox" checked={ev.include} onChange={() => { const u = [...scanPreview]; u[i].include = !u[i].include; setScanPreview(u); }} />
                {ev.title} — {ev.day} {ev.time}
              </label>
            ))}
            <button className="btn-primary" style={{ marginTop: 8 }} onClick={confirmScan}>Add checked events</button>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Let AI plan your gym & individual sessions</h2>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 10 }}>
          Looks at this week's fixed schedule (school, team training, matches) and proposes sessions that fit around it — never on top of a match, never right before one.
        </p>
        <button className="btn-primary" onClick={planTraining} disabled={planning}>{planning ? 'Analyzing your week…' : 'Plan my training'}</button>
        {planError && <p style={{ color: '#b3423a', fontSize: 13, marginTop: 8 }}>{planError}</p>}
        {planPreview && (
          <div style={{ marginTop: 12 }}>
            {planPreview.map((s, i) => (
              <label key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(189,187,182,0.4)', fontSize: 13 }}>
                <input type="checkbox" checked={s.include} onChange={() => { const u = [...planPreview]; u[i].include = !u[i].include; setPlanPreview(u); }} />
                <div>
                  <strong>{s.title}</strong> ({s.type}) — {s.day} {s.start_time}-{s.end_time}
                  <div style={{ color: 'var(--ink-soft)' }}>{s.description}</div>
                </div>
              </label>
            ))}
            <button className="btn-primary" style={{ marginTop: 8 }} onClick={confirmPlan}>Add checked sessions</button>
          </div>
        )}
      </div>
    </main>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--stone)',
  background: 'var(--card)', fontSize: 14, fontFamily: 'inherit', color: 'var(--ink)',
};
const navBtn = { background: 'var(--card)', border: '1px solid var(--stone)', borderRadius: 10, width: 32, height: 32 };
