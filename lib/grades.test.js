import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGradeSaver } from './grades.js';

test('повтор запроса после потери ответа сохраняет UUID', async () => {
  const calls = [];
  let next = 0;
  const client = { rpc: async (_name, args) => {
    calls.push({ ...args });
    if (calls.length === 1) throw new Error('response lost');
    return { data: { review: { box: 1 } } };
  } };
  const save = createGradeSaver(client, request => request(), () => `operation-${++next}`);
  await assert.rejects(save('phrase', 'good', 'new'), /response lost/);
  await save('phrase', 'good', 'new');
  assert.deepEqual(calls[0], calls[1]);
  assert.equal(next, 1);
});

test('подтверждённые оценки получают разные UUID', async () => {
  const ids = []; let next = 0;
  const save = createGradeSaver({ rpc: async (_name, args) => {
    ids.push(args.operation_id); return { data: {} };
  } }, request => request(), () => `operation-${++next}`);
  await save('phrase', 'good', 'new'); await save('phrase', 'good', 'new');
  assert.notEqual(ids[0], ids[1]);
});

test('неподтверждённая оценка не заменяется другой', async () => {
  const save = createGradeSaver({ rpc: async () => { throw new Error('offline'); } }, request => request(), () => 'operation');
  await assert.rejects(save('phrase', 'good', 'new'), /offline/);
  await assert.rejects(save('phrase', 'again', 'new'), /предыдущую оценку/);
});
