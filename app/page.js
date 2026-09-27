'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState('checking'); // checking | ready
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function check() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        router.push('/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .single();

      if (!profileData) {
        router.push('/onboarding');
        return;
      }

      setProfile(profileData);
      setStatus('ready');
    }
    check();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (status === 'checking') return null;

  return (
    <main style={{ maxWidth: 480, margin: '60px auto', padding: 20 }}>
      <div className="card">
        <h1 style={{ fontSize: 26 }}>Hey {profile.name} 👋</h1>
        <p style={{ color: 'var(--ink-soft)', marginTop: 10, lineHeight: 1.5 }}>
          {profile.summary}
        </p>
      </div>
      <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginTop: 4 }}>
        The full Overview dashboard (progress, water, calendar, AI assistant) is being built next on this same profile.
      </p>
      <button onClick={handleLogout} className="btn-primary" style={{ marginTop: 16, background: 'var(--stone)', color: 'var(--ink)' }}>
        Log out
      </button>
    </main>
  );
}
