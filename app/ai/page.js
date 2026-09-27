'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AiPage() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hey! I know your profile, calendar, water, sleep and injuries. Ask me anything.' },
  ]);
  const [input, setInput] = useState('');
  const [context, setContext] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function loadContext() {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user.id;
      const [{ data: profile }, { data: events }, { data: injuries }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', uid).single(),
        supabase.from('calendar_events').select('*').eq('user_id', uid).order('starts_at').limit(10),
        supabase.from('injuries').select('*').eq('user_id', uid).eq('status', 'active'),
      ]);
      setContext({ profile, upcomingEvents: events, activeInjuries: injuries });
    }
    loadContext();
  }, []);

  async function send() {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages((m) => [...m, { role: 'user', text: userMsg }]);
    setInput('');
    setSending(true);
    const res = await fetch('/api/assistant', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg, context }),
    });
    const { reply } = await res.json();
    setMessages((m) => [...m, { role: 'ai', text: reply }]);
    setSending(false);
  }

  return (
    <main style={{ maxWidth: 480, margin: '40px auto', padding: 20 }}>
      <div className="card">
        <h2>Assistant</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12, minHeight: 200 }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              maxWidth: '82%', padding: '11px 15px', borderRadius: 16, fontSize: 14,
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              background: m.role === 'user' ? 'var(--pine)' : 'var(--cream)',
              color: m.role === 'user' ? '#fff' : 'var(--ink)',
            }}>
              {m.text}
            </div>
          ))}
          {sending && <div style={{ fontSize: 13, color: 'var(--ink-soft)', fontStyle: 'italic' }}>Thinking…</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Ask anything..." style={{ flex: 1, padding: '12px 16px', borderRadius: 100, border: '1.5px solid var(--stone)', fontFamily: 'inherit' }} />
          <button className="btn-primary" onClick={send}>→</button>
        </div>
      </div>
    </main>
  );
}
