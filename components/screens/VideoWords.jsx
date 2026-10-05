'use client';
import { useRef, useState } from 'react';
import { C, SpeakBtn, NoVoiceHint } from '@/components/ui';
import { CHOICES, phraseChoice } from '@/lib/learning';

export default function VideoWords({ title, phrases, decisions, reviews, noVoice, onSave, onClose }) {
  const [choices, setChoices] = useState(() => Object.fromEntries(phrases.map(p => {
    const choice = phraseChoice(p,decisions,reviews);
    return [p.id,choice === 'pending' ? 'deferred' : choice];
  })));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const learning = phrases.filter(p => choices[p.id] === 'learn').length;
  const save = async (start) => {
    if (busy.current) return;
    busy.current = true; setSaving(true); setError('');
    try { await onSave(phrases.map(p => ({ phrase_id: p.id, choice: choices[p.id] })),start); }
    catch { setError('Не сохранилось — проверь подключение и попробуй ещё раз.'); }
    finally { busy.current = false; setSaving(false); }
  };
  const close = () => { if (!busy.current) onClose(); };
  return <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', maxWidth: 430, margin: '0 auto' }}>
    <div onClick={close} style={{ position: 'absolute', inset: 0, background: 'rgba(23,24,26,.5)' }} />
    <section className="sheet-up" style={{ position: 'relative', background: '#fff', borderRadius: '28px 28px 0 0', padding: '20px 20px calc(24px + env(safe-area-inset-bottom))', maxHeight: '86dvh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 style={{ fontSize: 20, margin: 0 }}>Слова из видео</h2><button disabled={saving} onClick={close} aria-label="Закрыть без сохранения" style={{ border: 0, borderRadius: 18, padding: 10 }}>✕</button></div>
      <p style={{ fontSize: 12, color: C.sub }}>{title}. Выбери, что учить. Закрытие окна не сохраняет выбор.</p>
      {noVoice && <NoVoiceHint />}
      <button disabled={saving} onClick={() => setChoices(Object.fromEntries(phrases.map(p => [p.id,'learn'])))} style={{ border: 0, background: C.bg, padding: 10, borderRadius: 16, marginBottom: 10 }}>Выбрать все для изучения</button>
      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>{phrases.map(p => <div key={p.id} style={{ background: C.bg, borderRadius: 16, padding: 12, marginTop: 8 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><div style={{ flex: 1 }}><div className="thai" style={{ fontSize: 19 }}>{p.th}</div><div style={{ fontSize: 12, color: C.greenDark }}>{p.tr}</div><div style={{ fontSize: 13, marginTop: 3 }}>{p.ru}</div></div><SpeakBtn text={p.th} /></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>{CHOICES.map(c => <button key={c.key} disabled={saving} onClick={() => setChoices(prev => ({ ...prev,[p.id]:c.key }))} style={{ border: 0, padding: '8px 10px', borderRadius: 14, background: choices[p.id] === c.key ? C.lime : '#fff', fontSize: 11, fontWeight: 700 }}>{c.label}</button>)}</div>
      </div>)}</div>
      {error && <p role="alert">{error}</p>}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}><button disabled={saving} onClick={() => save(false)} style={{ flex: 1, border: 0, padding: 14, borderRadius: 20, background: C.bg, fontWeight: 700 }}>{saving ? 'Сохраняю…' : 'Сохранить выбор'}</button><button disabled={saving || !learning} onClick={() => save(true)} style={{ flex: 1, border: 0, padding: 14, borderRadius: 20, background: C.text, color: '#fff', fontWeight: 700, opacity: learning ? 1 : .5 }}>Учить сейчас · {learning}</button></div>
    </section>
  </div>;
}
