import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateBackup, exportBackup } from './backup.js';
const empty = () => ({ format: 'thai-trainer', version: 1, phrases: [], reviews: [], activity: [], watched_videos: [] });
test('пустая копия корректна', () => assert.deepEqual(validateBackup(empty()), empty()));
test('неверный формат и потерянная таблица отклоняются', () => {
  assert.throws(() => validateBackup({ ...empty(), version: 2 }));
  assert.throws(() => validateBackup({ ...empty(), activity: null }));
});
test('прогресс без фразы отклоняется', () => assert.throws(() => validateBackup({ ...empty(), reviews: [{ phrase_id: 'missing', box: 1, due_date: '2026-10-05' }] })));
test('ошибка чтения не создаёт неполную копию', async () => {
  const client = { from: () => ({ select: () => ({ order: () => ({ range: async () => ({ error: new Error('offline') }) }) }) }) };
  await assert.rejects(exportBackup(client), /offline/);
});

test('копия v2 включает решения и результаты миссий, старые копии принимаются', () => {
  const backup = { ...empty(), version: 2, phrase_decisions: [], mission_results: [{ day: '2026-10-05', mission_id: 'thanks', note: 'Получилось' }] };
  assert.equal(validateBackup(backup), backup);
  assert.throws(() => validateBackup({ ...backup, phrase_decisions: [{ phrase_id: 'missing', choice: 'learn' }] }));
  assert.throws(() => validateBackup({ ...backup, mission_results: [{ ...backup.mission_results[0], note: 'x'.repeat(2001) }] }));
});
test('экспорт v2 читает новые таблицы и несколько страниц фраз', async () => {
  const calls = [];
  const phrases = Array.from({ length: 501 }, (_, i) => ({ id: `00000000-0000-0000-0000-${String(i).padStart(12,'0')}`, ru: 'r', th: 't', tr: 't', deck: 'base', hidden: false }));
  const client = { from: table => ({ select: () => ({ order: () => ({ range: async (start,end) => {
    calls.push(table); return { data: table === 'phrases' ? phrases.slice(start,end+1) : [], error: null };
  } }) }) }) };
  const backup = await exportBackup(client);
  assert.equal(backup.version, 2); assert.equal(backup.phrases.length, 501);
  assert.ok(calls.includes('mission_results')); assert.ok(calls.includes('phrase_decisions'));
});
