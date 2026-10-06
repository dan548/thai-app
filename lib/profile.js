// Профиль пользователя и подмена вежливой частицы на лету.
// База и код хранят женскую частицу (ค่ะ/คะ, khâ/khá); мужской вариант
// получается трансформацией по NEXT_PUBLIC_USER_GENDER — ничего не дублируется.

export const GENDER = process.env.NEXT_PUBLIC_USER_GENDER === 'male' ? 'male' : 'female';
export const USER_NAME = process.env.NEXT_PUBLIC_USER_NAME || 'friend';

// Ядро без env — удобно тестировать.
export function applyGenderWith(text, gender) {
  if (gender !== 'male' || typeof text !== 'string' || !text) return text;
  return text
    .replace(/ค่ะ/g, 'ครับ')
    .replace(/คะ/g, 'ครับ')
    // Только отдельное слово: иначе заденет khâao (рис), khâo-jai и т.п.
    .replace(/(?<![\p{L}])khâ(?![\p{L}])/gu, 'khráp')
    .replace(/(?<![\p{L}])khá(?![\p{L}])/gu, 'khráp');
}

export function applyGender(text) {
  return applyGenderWith(text, GENDER);
}

export function genderPhraseWith(p, gender) {
  if (!p) return p;
  // Пометка пола в учебном определении описывает саму форму, а не пользователя.
  // Например, «вежливая частица (женская)» должна оставаться ค่ะ / คะ.
  if (/\((?:женская|мужская|жен\.|муж\.)/u.test(p.ru || '')) return { ...p };
  const ru = gender === 'male' && typeof p.ru === 'string'
    ? p.ru.replace(/^Я не совсем поняла$/u, 'Я не совсем понял')
      .replace(/^Я голодная(?=\s|$)/u, 'Я голодный')
      .replace(/^Я пошла(?=\s|$)/u, 'Я пошёл')
    : p.ru;
  return { ...p, ru, th: applyGenderWith(p.th, gender), tr: applyGenderWith(p.tr, gender) };
}

export function genderPhrase(p) {
  return genderPhraseWith(p, GENDER);
}
