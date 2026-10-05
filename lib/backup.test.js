const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateBackup, exportBackup } = require('./backup.js');
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
