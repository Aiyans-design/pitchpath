'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function NutritionPage() {
  const [userId, setUserId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [mealType, setMealType] = useState('breakfast');
  const [description, setDescription] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  async function load(uid) {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase.from('nutrition_logs').select('*').eq('user_id', uid).eq('date', today).order('created_at');
    setLogs(data || []);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { setUserId(data.user.id); load(data.user.id); });
  }, []);

  async function addManual() {
    if (!description) return;
    await supabase.from('nutrition_logs').insert({ user_id: userId, meal_type: mealType, food_description: description, confirmed: true });
    setDescription('');
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
    setScanResult(null);
    const base64Image = await fileToBase64(file);
    const res = await fetch('/api/scan-food', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image, mimeType: file.type }),
    });
    const data = await res.json();
    setScanning(false);
    setScanResult(data);
  }

  async function confirmScan() {
    if (!scanResult || scanResult.error) return;
    await supabase.from('nutrition_logs').insert({
      user_id: userId, meal_type: mealType, food_description: scanResult.food_name,
      estimated_calories: scanResult.estimated_calories, estimated_protein_g: scanResult.estimated_protein_g, confirmed: true,
    });
    setScanResult(null);
    load(userId);
  }

  return (
    <main style={{ maxWidth: 480, margin: '40px auto', padding: 20 }}>
      <div className="card">
        <h2>Today's meals</h2>
        {logs.length === 0 && <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>Nothing logged yet today.</p>}
        {logs.map((l) => (
          <div key={l.id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(189,187,182,0.4)', fontSize: 14 }}>
            <strong>{l.meal_type}:</strong> {l.food_description} {l.estimated_calories ? `(~${l.estimated_calories} kcal)` : ''}
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Add a meal</h2>
        <select value={mealType} onChange={(e) => setMealType(e.target.value)} style={inputStyle}>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
        </select>

        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--pine)', marginTop: 14 }}>Type it in</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="e.g. chicken pasta" value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          <button className="btn-primary" onClick={addManual}>Add</button>
        </div>

        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--pine)', marginTop: 14 }}>Or take a photo</p>
        <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} />

        {scanning && <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Analyzing photo…</p>}

        {scanResult && !scanResult.error && (
          <div style={{ marginTop: 12, padding: 12, background: 'var(--cream)', borderRadius: 14 }}>
            <p style={{ fontWeight: 600 }}>{scanResult.food_name}</p>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
              ~{scanResult.estimated_calories} kcal · {scanResult.estimated_protein_g}g protein · {scanResult.estimated_carbs_g}g carbs · {scanResult.estimated_fat_g}g fat
            </p>
            <p style={{ fontSize: 12, color: 'var(--ink-soft)', fontStyle: 'italic' }}>{scanResult.confidence_note}</p>
            <button className="btn-primary" style={{ marginTop: 8 }} onClick={confirmScan}>Confirm & add</button>
          </div>
        )}
        {scanResult && scanResult.error && <p style={{ color: '#b3423a', fontSize: 13 }}>{scanResult.error}</p>}
      </div>
    </main>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--stone)',
  background: 'var(--card)', fontSize: 14, fontFamily: 'inherit', color: 'var(--ink)',
};
