'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [userId, setUserId] = useState(null);
  const [type, setType] = useState('school');
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState(null); // detected events awaiting confirmation
  const [scanError, setScanError] = useState('');

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
    setScanning(true);
    setScanError('');
    setPreview(null);
    const base64Image = await fileToBase64(file);
    const res = await fetch('/api/scan-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image, mimeType: file.type }),
    });
    const data = await res.json();
    setScanning(false);
    if (data.error || !data.events || data.events.length === 0) {
      setScanError(data.error || "Couldn't find any events in that photo.");
    } else {
      // every detected event starts as "checked" (will be added) so the
      // player can uncheck any that were misread before confirming
      setPreview(data.events.map((ev) => ({ ...ev, include: true })));
    }
  }

  function togglePreview(i) {
    const updated = [...preview];
    updated[i].include = !updated[i].include;
    setPreview(updated);
  }

  function updatePreviewField(i, field, value) {
    const updated = [...preview];
    updated[i][field] = value;
    setPreview(updated);
  }

  async function confirmPreview() {
    const toAdd = preview.filter((ev) => ev.include);
    const rows = toAdd.map((ev) => ({
      user_id: userId,
      type: ev.type || 'school',
      title: ev.title,
      starts_at: new Date().toISOString(), // day/time text kept in notes since OCR text isn't a reliable exact timestamp
      notes: `${ev.day || ''} ${ev.time || ''}`.trim(),
    }));
    if (rows.length > 0) {
      await supabase.from('calendar_events').insert(rows);
    }
    setPreview(null);
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
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{e.notes || new Date(e.starts_at).toLocaleString()}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 100, background: 'var(--sage)', color: '#fff', height: 'fit-content' }}>{e.type}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Scan a schedule photo</h2>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 10 }}>
          Take a photo of your school timetable, training plan, or match schedule — AI reads it and you confirm before anything gets added.
        </p>
        <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} />
        {scanning && <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginTop: 8 }}>Reading the photo…</p>}
        {scanError && <p style={{ color: '#b3423a', fontSize: 13, marginTop: 8 }}>{scanError}</p>}

        {preview && (
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--pine)' }}>Found {preview.length} event(s) — review before adding:</p>
            {preview.map((ev, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(189,187,182,0.4)' }}>
                <input type="checkbox" checked={ev.include} onChange={() => togglePreview(i)} />
                <input value={ev.title} onChange={(e) => updatePreviewField(i, 'title', e.target.value)} style={{ ...smallInput, flex: 2 }} />
                <input value={ev.day || ''} onChange={(e) => updatePreviewField(i, 'day', e.target.value)} placeholder="day" style={{ ...smallInput, flex: 1 }} />
                <input value={ev.time || ''} onChange={(e) => updatePreviewField(i, 'time', e.target.value)} placeholder="time" style={{ ...smallInput, flex: 1 }} />
              </div>
            ))}
            <button className="btn-primary" style={{ marginTop: 10 }} onClick={confirmPreview}>Add checked events</button>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Add manually</h2>
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

const smallInput = {
  padding: '6px 8px', borderRadius: 8, border: '1px solid var(--stone)', fontSize: 12, fontFamily: 'inherit',
};
