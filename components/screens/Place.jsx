'use client';

import { C, BackBtn, SpeakBtn, SectionLabel, NoVoiceHint } from '@/components/ui';
import { PLACES, THEY_SAY, DECK_META } from '@/lib/data';
import { situationPhrases } from '@/lib/situations';

// «Я сейчас в…» — шпаргалка на 30 секунд перед входом в место
export default function Place({ deck, phrases, noVoice, onBack }) {
  const place = PLACES.find((p) => p.deck === deck);
  const say = situationPhrases(deck, phrases);
  const theySay = THEY_SAY[deck] || [];

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <BackBtn onClick={onBack} />
        <div>
          <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: -0.5 }}>
            {place?.emoji} {place?.name || DECK_META[deck]?.name}
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: C.sub, marginTop: 2 }}>шпаргалка на 30 секунд</div>
        </div>
      </div>

      {noVoice && <NoVoiceHint />}

      <div style={{ marginTop: 20 }}>
        <SectionLabel>СКАЖИ ЭТО</SectionLabel>
      </div>
      <div style={{ background: '#fff', borderRadius: 24, marginTop: 10, overflow: 'hidden' }}>
        {say.map(({ phrase: p, intent }, i) => (
          <div key={intent} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
            borderBottom: i < say.length - 1 ? `1px solid ${C.line}` : 'none',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, marginBottom: 5 }}>{i + 1}. {intent}</div>
              {p ? <><div className="thai" style={{ fontSize: 17, fontWeight: 700 }}>{p.th}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.greenDark, marginTop: 2 }}>{p.tr}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.sub, marginTop: 2 }}>{p.ru}</div></>
                : <div style={{ fontSize: 13, color: C.sub }}>Нужная фраза ещё не добавлена</div>}
            </div>
            {p && <SpeakBtn text={p.th} />}
          </div>
        ))}
        {say.length === 0 && (
          <div style={{ padding: 18, fontSize: 13, fontWeight: 500, color: C.sub }}>В этой теме пока нет фраз</div>
        )}
      </div>

      <div style={{ marginTop: 22 }}>
        <SectionLabel>ТЕБЕ МОГУТ СКАЗАТЬ</SectionLabel>
      </div>
      <div style={{ background: '#17181A', borderRadius: 24, marginTop: 10, overflow: 'hidden' }}>
        {theySay.map((p, i) => (
          <div key={p.th} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
            borderBottom: i < theySay.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="thai" style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>{p.th}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.lime, marginTop: 2 }}>{p.tr}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{p.ru}</div>
            </div>
            <SpeakBtn text={p.th.replace(/\.{3}|…/g, '')} bg="rgba(255,255,255,0.12)" color="#fff" />
          </div>
        ))}
      </div>
    </div>
  );
}
