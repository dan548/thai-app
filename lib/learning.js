import { LEARNED_BOX } from './srs.js';

export const CHOICES = [
  { key: 'learn', label: 'Учить' }, { key: 'known', label: 'Уже знаю' },
  { key: 'dismissed', label: 'Не нужно' }, { key: 'deferred', label: 'Отложить' },
];
export function phraseChoice(phrase, decisions = {}, reviews = {}) {
  if (decisions[phrase.id]) return decisions[phrase.id].choice;
  if (phrase.source === 'seed' || reviews[phrase.id]) return 'learn';
  return 'pending';
}
export function inLearning(phrase, decisions, reviews) {
  return !phrase.hidden && ['learn', 'known'].includes(phraseChoice(phrase, decisions, reviews));
}
export function incomingPhrases(phrases, decisions, reviews, watched) {
  const seen = new Set(watched.map(w => w.video_id));
  return phrases.filter(p => p.source !== 'seed' && (p.source !== 'video' || seen.has(p.video_id))
    && ['pending', 'deferred'].includes(phraseChoice(p, decisions, reviews)));
}
export function videoProgress(phrases, decisions, reviews) {
  return phrases.reduce((count, p) => {
    const choice = phraseChoice(p, decisions, reviews);
    if (['learn', 'known'].includes(choice) && !p.hidden) {
      count.added++;
      (reviews[p.id]?.box >= LEARNED_BOX ? count.learned++ : count.learning++);
    } else if (['pending', 'deferred'].includes(choice)) count.pending++;
    return count;
  }, { added: 0, learning: 0, learned: 0, pending: 0 });
}
