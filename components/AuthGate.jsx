'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { C } from '@/components/ui';

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setError('Не удалось проверить вход. Попробуй обновить страницу.');
      setSession(data.session);
      setLoading(false);
    }).catch(() => { if (active) { setError('Не удалось проверить вход.'); setLoading(false); } });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      if (active) { setSession(next); setLoading(false); }
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  const login = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      setPassword('');
    } catch { setError('Не удалось войти. Проверь email, пароль и подключение.'); }
    finally { setBusy(false); }
  };

  if (session) return <div key={session.user.id}>{children}<button onClick={async () => {
    const { error } = await supabase.auth.signOut();
    if (error) setError('Не удалось выйти. Проверь подключение и повтори.');
  }} style={{ display: 'block', margin: '16px auto', padding: 10 }}>Выйти</button>{error && <p role="alert">{error}</p>}</div>;

  return <main style={{ maxWidth: 390, margin: '80px auto', padding: 20, color: C.text }}>
    <h1>Thai Trainer</h1>
    {loading ? <p>Проверяю вход…</p> : !supabase ? <p role="alert">Для запуска заполни NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY в .env.local.</p> : <form onSubmit={login} style={{ display: 'grid', gap: 16 }}>
      <p>Вход в личный тренажёр</p>
      <label>Email<input required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} style={{ display: 'block', width: '100%', padding: 12, boxSizing: 'border-box' }} /></label>
      <label>Пароль<input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} style={{ display: 'block', width: '100%', padding: 12, boxSizing: 'border-box' }} /></label>
      <button disabled={busy} style={{ padding: 14, borderRadius: 16, background: C.text, color: '#fff' }}>{busy ? 'Вхожу…' : 'Войти'}</button>
      {error && <p role="alert">{error}</p>}
    </form>}
  </main>;
}
