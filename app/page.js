'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [step, setStep] = useState('form'); // 'form' | 'loading' | 'summary'
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [photoFile, setPhotoFile] = useState(null);

  const [form, setForm] = useState({
    name: '', age: '', position: '', height_cm: '', weight_kg: '',
    team: '', league: '', goals: '',
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login');
      } else {
        setUserId(data.user.id);
      }
      setCheckingAuth(false);
    });
  }, [router]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setStep('loading');

    try {
      // 1. Ask Gemini (via our server route) for a personalized summary
      const res = await fetch('/api/onboarding-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const { summary: aiSummary } = await res.json();

      // 2. Upload the photo (if one was chosen) to Supabase Storage
      let photoUrl = null;
      if (photoFile) {
        const filePath = `${userId}/${Date.now()}-${photoFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, photoFile);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
          photoUrl = urlData.publicUrl;
        }
      }

      // 3. Save the profile + summary + photo to Supabase
      const { error: dbError } = await supabase.from('profiles').upsert({
        id: userId,
        name: form.name,
        age: form.age ? Number(form.age) : null,
        position: form.position,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        team: form.team,
        league: form.league,
        goals: form.goals,
        summary: aiSummary,
        photo_url: photoUrl,
      });

      if (dbError) throw dbError;

      setSummary(aiSummary);
      setStep('summary');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setStep('form');
    }
  }

  if (checkingAuth) return null;

  return (
    <main style={{ maxWidth: 480, margin: '40px auto', padding: 20 }}>
      {step === 'form' && (
        <div className="card">
          <h1 style={{ fontSize: 26, marginBottom: 6 }}>Build your profile</h1>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 20, fontSize: 14 }}>
            One profile that understands your football, your school, and everything in between.
          </p>
          <form onSubmit={handleSubmit}>
            <Field label="Name"><input required value={form.name} onChange={(e) => update('name', e.target.value)} style={inputStyle} /></Field>
            <Row>
              <Field label="Age"><input type="number" value={form.age} onChange={(e) => update('age', e.target.value)} style={inputStyle} /></Field>
              <Field label="Position"><input value={form.position} onChange={(e) => update('position', e.target.value)} style={inputStyle} /></Field>
            </Row>
            <Row>
              <Field label="Height (cm)"><input type="number" value={form.height_cm} onChange={(e) => update('height_cm', e.target.value)} style={inputStyle} /></Field>
              <Field label="Weight (kg)"><input type="number" value={form.weight_kg} onChange={(e) => update('weight_kg', e.target.value)} style={inputStyle} /></Field>
            </Row>
            <Field label="Team"><input value={form.team} onChange={(e) => update('team', e.target.value)} style={inputStyle} /></Field>
            <Field label="League / competition level">
              <input placeholder="e.g. P16 Division 1 2016 B-Slutspel östra Götaland" value={form.league} onChange={(e) => update('league', e.target.value)} style={inputStyle} />
            </Field>
            <Field label="What do you want to work on?">
              <textarea rows={3} value={form.goals} onChange={(e) => update('goals', e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} />
            </Field>
            <Field label="Upper-body photo (optional)">
              <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} />
            </Field>

            {error && <p style={{ color: '#b3423a', fontSize: 13, marginBottom: 12 }}>{error}</p>}

            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              Build my profile
            </button>
          </form>
        </div>
      )}

      {step === 'loading' && (
        <div className="card">
          <h2>Building your profile…</h2>
          <p style={{ color: 'var(--ink-soft)' }}>Analyzing your league level and goals.</p>
        </div>
      )}

      {step === 'summary' && (
        <div className="card">
          <h2>Welcome, {form.name}</h2>
          <p style={{ color: 'var(--ink-soft)', lineHeight: 1.5, marginTop: 10 }}>{summary}</p>
          <button className="btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={() => router.push('/')}>
            Enter Pitchpath
          </button>
        </div>
      )}
    </main>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--pine)', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

function Row({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>;
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 14,
  border: '1.5px solid var(--stone)',
  background: 'var(--card)',
  fontSize: 15,
  fontFamily: 'inherit',
  color: 'var(--ink)',
};
