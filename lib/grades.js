import { confirmedWrite } from './save.js';

// Сохраняем UUID до подтверждения: ручной повтор после потери ответа
// должен отправить ту же операцию, а не новую оценку.
export function createGradeSaver(client, confirm = confirmedWrite, makeId = () => crypto.randomUUID()) {
  const pending = new Map();
  return async (phrase, grade, sessionMode) => {
    let request = pending.get(phrase);
    if (request && (request.grade !== grade || request.session_mode !== sessionMode)) {
      throw new Error('Сначала повтори предыдущую оценку: её сохранение ещё не подтверждено.');
    }
    if (!request) {
      request = { phrase, grade, session_mode: sessionMode, operation_id: makeId() };
      pending.set(phrase, request);
    }
    try {
      const { data } = await confirm(() => client.rpc('save_grade_once', request));
      pending.delete(phrase);
      return data;
    } catch (error) {
      if (error.permanent) pending.delete(phrase);
      throw error;
    }
  };
}
