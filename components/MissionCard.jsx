'use client';
import { useRef, useState } from 'react';
import { C, SpeakBtn, SectionLabel, NoVoiceHint } from '@/components/ui';
import { genderPhrase } from '@/lib/profile';

export default function MissionCard({ mission, record, noVoice, onSave, onPrepare, onAddPhrase }) {
  const phrase = genderPhrase(mission);
  const [note, setNote] = useState(record?.note || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const save = async (completed) => {
    if (busy.current) return;
    busy.current = true; setSaving(true); setError('');
    try { await onSave(mission, { note: note.trim(), completed }); }
    catch { setError('Не сохранилось — попробуй ещё раз после восстановления связи.'); }
    finally { busy.current = false; setSaving(false); }
  };
  return <section style={{ background: '#fff', borderRadius: 24, padding: 18, marginTop: 12 }}>
    <SectionLabel>МИССИЯ ДНЯ</SectionLabel>
    <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 12 }}>
      <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 800 }}>{mission.text}</div><div className="thai" style={{ fontSize: 17, marginTop: 6 }}>{phrase.th}</div><div style={{ fontSize: 12, color: C.greenDark, marginTop: 2 }}>{phrase.tr}</div></div>
      <SpeakBtn text={phrase.th} />
    </div>
    {noVoice && <NoVoiceHint />}
    {mission.deck && <button onClick={() => onPrepare(mission.deck)} style={{ border: 0, background: C.bg, borderRadius: 16, padding: 10, marginTop: 12 }}>Подготовиться к разговору</button>}
    <label style={{ display: 'block', fontSize: 12, color: C.sub, marginTop: 14 }}>Что ответили? Что получилось?<textarea disabled={saving} maxLength={2000} value={note} onChange={e => setNote(e.target.value)} placeholder="Запиши ответ или впечатление от разговора" style={{ display: 'block', width: '100%', boxSizing: 'border-box', padding: 12, marginTop: 6, border: 0, borderRadius: 14, background: C.bg, font: 'inherit', minHeight: 74 }} /></label>
    {record?.completed_at && <p role="status" style={{ fontSize: 13, color: C.greenDark }}>✓ Миссия выполнена. Позже можно проверить себя в «Прогрессе».</p>}
    {error && <p role="alert">{error}</p>}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
      <button disabled={saving} onClick={() => save(true)} style={{ border: 0, borderRadius: 18, background: C.lime, fontWeight: 800, padding: '12px 16px' }}>{saving ? 'Сохраняю…' : record?.completed_at ? 'Сохранить заметку' : 'Сделано'}</button>
      <button disabled={saving} onClick={onAddPhrase} style={{ border: 0, borderRadius: 18, background: C.bg, padding: '12px 16px' }}>Добавить услышанную фразу</button>
      {record?.completed_at && <button disabled={saving} onClick={() => save(false)} style={{ border: 0, background: 'none', color: C.sub }}>Отменить отметку</button>}
    </div>
  </section>;
}
