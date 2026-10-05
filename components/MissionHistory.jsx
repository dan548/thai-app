'use client';
import { useRef, useState } from 'react';
import { MISSIONS } from '@/lib/data';
import { todayStr } from '@/lib/srs';
import { genderPhrase } from '@/lib/profile';
import { C, SpeakBtn, NoVoiceHint } from '@/components/ui';

export default function MissionHistory({ records, onCheck, noVoice }) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const list = records.filter(r => r.completed_at).sort((a,b) => b.day.localeCompare(a.day)).slice(0,20);
  if (!list.length) return null;
  return <section style={{ marginTop: 24 }}><h3>Миссии в реальной жизни</h3>{list.map(r => {
    const mission = MISSIONS.find(m => m.id === r.mission_id);
    if (!mission) return null;
    const phrase = genderPhrase(mission);
    const open = selected === r.day;
    return <div key={r.day} style={{ background: '#fff', borderRadius: 20, padding: 16, marginTop: 10 }}>
      <div style={{ fontSize: 12, color: C.sub }}>{r.day}{r.checked_at ? ' · Проверено' : ''}</div><div style={{ fontWeight: 800, marginTop: 6 }}>{mission.text}</div>
      {r.note && <p style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{r.note}</p>}
      {r.day < todayStr() && !open && <button onClick={() => { setSelected(r.day); setRevealed(false); setError(''); }} style={{ border: 0, background: C.lime, padding: 10, borderRadius: 16 }}>Проверить себя</button>}
      {open && <div><p>Вспомни, как сказать это по-тайски.</p>{revealed ? <><div className="thai" style={{ fontSize: 20 }}>{phrase.th}</div><p style={{ color: C.greenDark }}>{phrase.tr}</p><SpeakBtn text={phrase.th} />{noVoice && <NoVoiceHint />}
        <button disabled={saving} onClick={async () => {
          if (busy.current) return;
          busy.current = true; setSaving(true); setError('');
          try { await onCheck(r); setSelected(null); }
          catch { setError('Не сохранилось — попробуй ещё раз.'); }
          finally { busy.current = false; setSaving(false); }
        }} style={{ marginTop: 12, border: 0, padding: 10, borderRadius: 16, background: C.bg }}>{saving ? 'Сохраняю…' : 'Проверил себя'}</button></> : <button onClick={() => setRevealed(true)} style={{ border: 0, padding: 10, borderRadius: 16, background: C.bg }}>Показать ответ</button>}
        {error && <p role="alert">{error}</p>}
      </div>}
    </div>;
  })}</section>;
}
