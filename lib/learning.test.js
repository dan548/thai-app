import { test } from 'node:test';
import assert from 'node:assert/strict';
import { phraseChoice, inLearning, incomingPhrases, videoProgress } from './learning.js';
import { MISSIONS, missionOfToday } from './data.js';
import { SITUATIONS, situationPhrases } from './situations.js';
import { genderPhrase } from './profile.js';
const seed = { id: 'seed', source: 'seed', hidden: false };
const chat = { id: 'chat', source: 'chat', hidden: false };
const video = { id: 'video', source: 'video', video_id: 'v', hidden: false };
test('новые входящие не попадают в обучение; существующий прогресс сохраняется', () => {
  assert.equal(phraseChoice(seed), 'learn');
  assert.equal(inLearning(chat), false);
  assert.equal(inLearning(chat, {}, { chat: { box: 1 } }), true);
  assert.equal(inLearning({ ...seed, hidden: true }), false);
});
test('четыре решения управляют очередью независимо от старого прогресса', () => {
  for (const choice of ['learn','known','deferred','dismissed']) {
    assert.equal(inLearning(chat, { chat: { choice } }, { chat: { box: 4 } }), ['learn','known'].includes(choice));
  }
});
test('видео попадает во входящие только после открытия, отложенное остаётся', () => {
  assert.deepEqual(incomingPhrases([seed,chat,video], {}, {}, []), [chat]);
  assert.deepEqual(incomingPhrases([video], { video: { choice: 'deferred' } }, {}, [{ video_id: 'v' }]), [video]);
  assert.deepEqual(incomingPhrases([chat], { chat: { choice: 'dismissed' } }, {}, []), []);
});
test('прогресс видео различает добавленное, изучаемое и закреплённое', () => {
  const list = ['a','b','c','d'].map(id => ({ ...video, id }));
  assert.deepEqual(videoProgress(list, { a: { choice: 'learn' }, b: { choice: 'known' }, c: { choice: 'dismissed' } }, { b: { box: 4 } }), { added: 2, learning: 1, learned: 1, pending: 1 });
});
test('шпаргалки сохраняют ручной порядок при добавлении произвольных фраз', () => {
  for (const [deck, slots] of Object.entries(SITUATIONS)) {
    const phrases = slots.map(([intent, deck, th], i) => genderPhrase({ id: String(i), deck, th, source: 'seed' }));
    const extra = { id: 'extra', deck, th: 'другая фраза', source: 'chat' };
    assert.deepEqual(situationPhrases(deck, [extra,...phrases]).map(s => s.phrase.id), phrases.map(p => p.id));
    assert.equal(situationPhrases(deck, []).length, 5);
    assert.ok(situationPhrases(deck, []).every(s => s.phrase === null));
  }
});
test('миссия стабильна в пределах даты и возвращается через неделю', () => {
  assert.equal(missionOfToday('2026-10-05'), missionOfToday('2026-10-12'));
  assert.notEqual(missionOfToday('2026-10-05'), missionOfToday('2026-10-06'));
  assert.equal(new Set(MISSIONS.map(m => m.id)).size, MISSIONS.length);
});
