const { test } = require('node:test');
const assert = require('node:assert/strict');
const { nextBox, todayStr, dueDateFor, calcStreak } = require('./srs.js');
test('три оценки и максимальная ступень', () => {
  assert.equal(nextBox(4,'again'),0); assert.equal(nextBox(4,'hard'),4);
  assert.equal(nextBox(4,'good'),5); assert.equal(nextBox(6,'good'),6);
});
test('интервалы используют календарные даты', () => {
  assert.equal(dueDateFor(0),todayStr()); assert.equal(dueDateFor(6),todayStr(30));
});
test('стрик учитывает вчера и прерывается на пропуске', () => {
  assert.equal(calcStreak([]),0);
  assert.equal(calcStreak([{ day: todayStr(-1), did_review: true }, { day: todayStr(-2), did_new: true }]),2);
  assert.equal(calcStreak([{ day: todayStr(), did_new: true }, { day: todayStr(-2), did_review: true }]),1);
});

test('учебная дата использует Бангкок на границе месяца', () => {
  const now = new Date('2026-01-31T17:00:00Z');
  assert.equal(todayStr(0, now),'2026-02-01');
  assert.equal(todayStr(-1, now),'2026-01-31');
});
