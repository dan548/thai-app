// Озвучка через Web Speech API, голос th-TH.
// rate 0.85 — обычная, 0.6 — «медленно» (🐢)
export const RATE_NORMAL = 0.85;
export const RATE_SLOW = 0.6;

function findThaiVoice() {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => (v.lang || '').toLowerCase().replace('_', '-').startsWith('th'));
}

export function hasThaiVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return true;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return true; // голоса ещё не загрузились — не пугать зря
  return !!findThaiVoice();
}

// Проверка после загрузки голосов; cb(true|false) — есть ли тайский голос
export function checkThaiVoice(cb) {
  if (typeof window === 'undefined' || !window.speechSynthesis) { cb(false); return; }
  const check = () => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) cb(!!findThaiVoice());
  };
  check();
  window.speechSynthesis.addEventListener('voiceschanged', check);
  return () => window.speechSynthesis.removeEventListener('voiceschanged', check);
}

export function speak(text, rate = RATE_NORMAL) {
  if (typeof window === 'undefined' || !window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'th-TH';
  u.rate = rate;
  const voice = findThaiVoice();
  if (voice) u.voice = voice;
  window.speechSynthesis.speak(u);
}
