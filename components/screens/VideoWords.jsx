'use client';

import { useState } from 'react';
import { C, Icon, SpeakBtn } from '@/components/ui';

const wordForm = (n) =>
  n % 10 === 1 && n % 100 !== 11 ? 'слово'
    : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'слова' : 'слов';

// Попап после просмотра видео. Слова добавляются в изучение, НО можно снять галочку
// с ненужных — они не попадут в изучение. Кнопка «Начать сейчас» открывает занятие
// по выбранным словам; крестик просто закрывает (выбранные всё равно добавлены).
// onStart(excludedIds) и onClose(excludedIds) сообщают родителю, какие слова исключить.
export default function VideoWords({ videoNo, title, phrases, onStart, onClose }) {
  const [excluded, setExcluded] = useState(() => new Set());

  const toggle = (id) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const included = phrases.length - excluded.size;
  const excludedIds = () => [...excluded];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', maxWidth: 430, margin: '0 auto' }}>
      <div className="fade-in" onClick={() => onClose(excludedIds())} style={{ position: 'absolute', inset: 0, background: 'rgba(23,24,26,0.5)' }} />
      <div className="sheet-up" style={{ position: 'relative', background: '#fff', borderRadius: '28px 28px 0 0', padding: '12px 20px calc(24px + env(safe-area-inset-bottom))', maxHeight: '86dvh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: '#E4E4E2', margin: '0 auto', flexShrink: 0 }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginTop: 16, flexShrink: 0 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>🎬</span>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.3 }}>Новые слова</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.sub, lineHeight: 1.45, marginTop: 6 }}>
              Из видео {videoNo}{title ? ` — ${title}` : ''}. Сними галочку с тех, что не нужны.
            </div>
          </div>
          <div className="press-sm" onClick={() => onClose(excludedIds())} style={{
            width: 34, height: 34, borderRadius: 999, background: C.bg, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon d="M6 6l12 12M18 6L6 18" size={14} width={1.8} />
          </div>
        </div>

        <div style={{ overflowY: 'auto', marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minHeight: 0 }}>
          {phrases.map((p) => {
            const off = excluded.has(p.id);
            return (
              <div key={p.id} style={{ background: C.bg, borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, opacity: off ? 0.5 : 1 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="thai" style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.3, textDecoration: off ? 'line-through' : 'none' }}>{p.th}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: C.greenDark, marginTop: 2 }}>{p.tr}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: C.sub, marginTop: 1 }}>{p.ru}</div>
                </div>
                <SpeakBtn text={p.th} size={38} />
                <div
                  className="press-sm"
                  onClick={() => toggle(p.id)}
                  title={off ? 'Добавить обратно' : 'Не добавлять'}
                  style={{
                    width: 30, height: 30, borderRadius: 999, flexShrink: 0, cursor: 'pointer',
                    background: off ? '#fff' : C.lime, border: off ? `1.5px solid ${C.faint}` : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {!off && <Icon d="M5 12.5l4.5 4.5L19 7.5" size={15} color={C.text} width={2.4} />}
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="press"
          onClick={() => included > 0 && onStart(excludedIds())}
          style={{
            background: '#17181A', color: '#fff', borderRadius: 999, height: 52, marginTop: 16, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800,
            opacity: included > 0 ? 1 : 0.45, pointerEvents: included > 0 ? 'auto' : 'none',
          }}
        >
          Начать сейчас
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: C.faint, marginTop: 10, flexShrink: 0 }}>
          {included > 0
            ? `${included} ${wordForm(included)} — в «Учить новое»${excluded.size ? `, ${excluded.size} убрано` : ''}`
            : 'Все слова убраны — ничего не добавится'}
        </div>
      </div>
    </div>
  );
}
