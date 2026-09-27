'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('signup'); // 'signup' | 'login'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const action =
      mode === 'signup'
        ? supabase.auth.signUp({ email, password })
        : supabase.auth.signInWithPassword({ email, password });

    const { data, error: authError } = await action;
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    // New signup with no existing profile -> onboarding.
    // Existing user -> also send to onboarding for now; it will
    // redirect onward once a profile already exists.
    router.push('/onboarding');
  }

  return (
    <main style={{ maxWidth: 420, margin: '60px auto', padding: 20 }}>
      <div className="card">
        <h1 style={{ fontSize: 28, marginBottom: 6 }}>Pitchpath</h1>
        <p style={{ color: 'var(--ink-soft)', marginBottom: 20, fontSize: 15 }}>
          {mode === 'signup'
            ? 'Create your player account.'
            : 'Welcome back.'}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--pine)', marginBottom: 5 }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--pine)', marginBottom: 5 }}>
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ color: '#b3423a', fontSize: 13, marginBottom: 12 }}>{error}</p>
          )}

          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Please wait…' : mode === 'signup' ? 'Sign up' : 'Log in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--ink-soft)' }}>
          {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
            style={{ background: 'none', border: 'none', color: 'var(--pine)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
          >
            {mode === 'signup' ? 'Log in' : 'Sign up'}
          </button>
        </p>
      </div>
    </main>
  );
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
