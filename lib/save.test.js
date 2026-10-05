const { test } = require('node:test');
const assert = require('node:assert/strict');
const { confirmedWrite } = require('./save.js');

test('временная ошибка повторяется до подтверждения', async () => {
  let calls = 0;
  const result = await confirmedWrite(async () => ++calls === 1 ? { error: { message: 'offline' }, status: 503 } : { data: 'saved', error: null });
  assert.equal(calls, 2); assert.equal(result.data, 'saved');
});
test('ошибка доступа не повторяется', async () => {
  let calls = 0;
  await assert.rejects(confirmedWrite(async () => { calls++; return { error: { message: 'denied' }, status: 403 }; }), /denied/);
  assert.equal(calls, 1);
});
test('неудачная запись не считается успешной', async () => {
  let calls = 0;
  await assert.rejects(confirmedWrite(async () => { calls++; throw new Error('offline'); }), /offline/);
  assert.equal(calls, 3);
});
