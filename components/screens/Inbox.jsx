'use client';
import { useRef, useState } from 'react';
import { C, ScreenTitle, BackBtn, SpeakBtn, NoVoiceHint } from '@/components/ui';
import { CHOICES, phraseChoice } from '@/lib/learning';
import { DECK_META } from '@/lib/data';

export default function Inbox({ phrases, decisions, reviews, onDecision, onBack, noVoice }) {
  const [filter, setFilter] = useState('pending');
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const list = phrases.filter(p => {
    const choice = phraseChoice(p, decisions, reviews);
    return filter === 'all' || choice === filter;
  }).sort((a,b) => (b.created_at || '').localeCompare(a.created_at || ''));
  const choose = async (p, choice) => {
    if (busy.current) return;
    busy.current = true; setSaving(p.id); setError('');
    try { await onDecision(p, choice); }
    catch { setError('Не сохранилось — проверь подключение и повтори выбор.'); }
    finally { busy.current = false; setSaving(null); }
  };
  return <div className="fade-in">
    <BackBtn onClick={onBack} /><div style={{ marginTop: 16 }}><ScreenTitle>Входящие фразы</ScreenTitle></div>
    <p style={{ fontSize: 13, color: C.sub }}>Выбери полезное. В занятия попадут только фразы, которые ты решил учить.</p>
    {noVoice && <NoVoiceHint />}
    <div style={{ display: 'flex', gap: 8 }}>{[['pending','Новые'],['deferred','Отложенные'],['all','Все']].map(([key,label]) => <button key={key} onClick={() => setFilter(key)} style={{ border: 0, borderRadius: 18, padding: '10px 14px', background: filter === key ? C.text : '#fff', color: filter === key ? '#fff' : C.text }}>{label}</button>)}</div>
    {error && <p role="alert">{error}</p>}
    {!list.length && <p style={{ color: C.sub }}>Здесь пока нет фраз.</p>}
    {list.map(p => <div key={p.id} style={{ background: '#fff', borderRadius: 20, padding: 16, marginTop: 12 }}>
      <div style={{ fontSize: 11, color: C.sub }}>{DECK_META[p.deck].name} · {p.source === 'video' ? 'Из видео' : p.source === 'manual' ? 'Добавлено вручную' : 'Из чата'}</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}><div style={{ flex: 1 }}><div style={{ fontWeight: 800 }}>{p.ru}</div><div className="thai" style={{ fontSize: 20, marginTop: 5 }}>{p.th}</div><div style={{ color: C.greenDark, fontSize: 13 }}>{p.tr}</div></div><SpeakBtn text={p.th} /></div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>{CHOICES.map(c => <button key={c.key} disabled={!!saving} onClick={() => choose(p,c.key)} style={{ border: 0, borderRadius: 16, padding: '9px 12px', background: phraseChoice(p,decisions,reviews) === c.key ? C.lime : C.bg, fontWeight: 700 }}>{c.label}</button>)}</div>
      {saving === p.id && <p role="status">Сохраняю…</p>}
    </div>)}
  </div>;
}
