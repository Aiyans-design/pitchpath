'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function TheoryPage() {
  const [userId, setUserId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user.id));
    loadQuestions();
  }, []);

  async function loadQuestions() {
    const { data } = await supabase.from('theory_questions').select('*').limit(5);
    if (data && data.length > 0) setQuestions(data);
  }

  async function generateMore() {
    setLoading(true);
    const res = await fetch('/api/generate-theory-questions', { method: 'POST' });
    const { questions: newQs } = await res.json();
    if (newQs.length > 0) {
      const { data: inserted } = await supabase.from('theory_questions').insert(newQs).select();
      setQuestions(inserted);
      setCurrent(0);
    }
    setLoading(false);
  }

  async function answer(index) {
    setSelected(index);
    const correct = index === questions[current].correct_index;
    if (correct) setStreak((s) => s + 1); else setStreak(0);
    await supabase.from('theory_progress').insert({ user_id: userId, question_id: questions[current].id, answered_correctly: correct });
  }

  function next() {
    setSelected(null);
    if (current + 1 < questions.length) setCurrent(current + 1);
    else generateMore();
  }

  if (questions.length === 0) {
    return (
      <main style={{ maxWidth: 480, margin: '40px auto', padding: 20 }}>
        <div className="card">
          <h2>Football Theory</h2>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 12 }}>No questions yet — let's generate your first set.</p>
          <button className="btn-primary" onClick={generateMore} disabled={loading}>{loading ? 'Generating…' : 'Start'}</button>
        </div>
      </main>
    );
  }

  const q = questions[current];
  return (
    <main style={{ maxWidth: 480, margin: '40px auto', padding: 20 }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--pine)', textTransform: 'uppercase' }}>{q.topic}</span>
          <span style={{ fontSize: 13 }}>🔥 {streak}</span>
        </div>
        <p style={{ fontWeight: 600, marginBottom: 14 }}>{q.question}</p>
        {q.options.map((opt, i) => (
          <button key={i} onClick={() => selected === null && answer(i)}
            style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '12px 14px', marginBottom: 8, borderRadius: 14,
              border: '1.5px solid var(--stone)',
              background: selected === null ? 'var(--card)' : i === q.correct_index ? 'var(--sage)' : i === selected ? '#e8b3ae' : 'var(--card)',
              color: selected !== null && i === q.correct_index ? '#fff' : 'var(--ink)',
            }}>
            {opt}
          </button>
        ))}
        {selected !== null && (
          <>
            <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 8 }}>{q.explanation}</p>
            <button className="btn-primary" style={{ marginTop: 12 }} onClick={next}>Next question</button>
          </>
        )}
      </div>
    </main>
  );
}
