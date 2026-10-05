// Интервальное повторение (Leitner): интервалы в днях по ступеням box
export const INTERVALS = [0, 1, 2, 4, 7, 15, 30];
export const MAX_BOX = 6;
export const NEW_PER_DAY = 6;
export const LEARNED_BOX = 4; // box >= 4 считается «закреплено»

// Единый учебный день совпадает с save_grade в базе, даже в поездках.
export function todayStr(offsetDays = 0, now = new Date()) {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(d);
  const value = type => parts.find(part => part.type === type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

// «Не помню» → box=0 (и показать снова в этой же сессии);
// «С трудом» → box не меняется; «Помню» → box+1 (максимум 6)
export function nextBox(currentBox, grade) {
  if (grade === 'again') return 0;
  if (grade === 'hard') return currentBox;
  return Math.min(MAX_BOX, currentBox + 1);
}

export function dueDateFor(box) {
  return todayStr(INTERVALS[box]);
}

// Стрик: непрерывная цепочка дней с did_review или did_new,
// заканчивая сегодня (или вчера, если сегодня ещё не занималась)
export function calcStreak(activityRows) {
  const days = new Set(
    activityRows.filter((a) => a.did_review || a.did_new).map((a) => a.day)
  );
  let streak = 0;
  let offset = days.has(todayStr()) ? 0 : -1;
  while (days.has(todayStr(offset - streak))) streak++;
  return streak;
}

export function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  if (m100 >= 11 && m100 <= 14) return many;
  if (m10 === 1) return one;
  if (m10 >= 2 && m10 <= 4) return few;
  return many;
}
