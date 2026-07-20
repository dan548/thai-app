// Метаданные колод. Контент фраз — ТОЛЬКО из Supabase, здесь лишь оформление.
export const DECK_META = {
  base: { name: 'База', icon: 'M12 3l2.7 5.6 6.3.9-4.5 4.4 1 6.1-5.5-2.9-5.5 2.9 1-6.1L3 9.5l6.3-.9z' },
  num: { name: 'Числа', icon: 'M9 3L7 21M17 3l-2 18M4 8h17M3 16h17' },
  coffee: { name: 'Кофейня', icon: 'M4 8h13v6a5 5 0 01-5 5H9a5 5 0 01-5-5zM17 9h2a2.5 2.5 0 010 5h-2' },
  resto: { name: 'Кафе', icon: 'M6 3v6a2 2 0 004 0V3M8 3v18M16 3v18M16 3a3.5 3.5 0 013.5 3.5V13H16' },
  shop: { name: 'Магазин', icon: 'M6 8h12l-1 13H7L6 8zM9 8V6a3 3 0 016 0v2' },
  market: { name: 'Рынок', icon: 'M4 10h16M5 10l1.5-5h11L19 10M6 10v10h12V10M10 14h4' },
  massage: { name: 'Массаж', icon: 'M12 21s-7-4.5-9-9a5 5 0 019-3 5 5 0 019 3c-2 4.5-9 9-9 9z' },
};

export const DECK_ORDER = ['base', 'num', 'coffee', 'resto', 'shop', 'market', 'massage'];

// «Я сейчас в…» — кнопки-места на главной
export const PLACES = [
  { deck: 'coffee', name: 'Кофейня', emoji: '☕' },
  { deck: 'resto', name: 'Кафе', emoji: '🍜' },
  { deck: 'shop', name: 'Магазин', emoji: '🏪' },
  { deck: 'market', name: 'Рынок', emoji: '🍍' },
  { deck: 'massage', name: 'Массаж', emoji: '💆‍♀️' },
];

// «Тебе могут сказать» — частые реплики тайцев по месту
export const THEY_SAY = {
  coffee: [
    { th: 'ร้อนหรือเย็นคะ', tr: 'rɔ́ɔn rʉ̌ʉ yen khá', ru: 'Горячий или холодный?' },
    { th: 'แก้วไหนคะ', tr: 'gɛ̂ɛo nǎi khá', ru: 'Какой размер?' },
    { th: 'หวานปกติไหมคะ', tr: 'wǎan pòk-gà-tì mǎi khá', ru: 'Обычная сладость?' },
    { th: 'ทานที่นี่หรือเอากลับคะ', tr: 'thaan thîi-nîi rʉ̌ʉ ao glàp khá', ru: 'Здесь или с собой?' },
    { th: '...บาทค่ะ', tr: '... bàat khâ', ru: '…бат (цена)' },
  ],
  resto: [
    { th: 'รับอะไรดีคะ', tr: 'ráp à-rai dii khá', ru: 'Что закажете?' },
    { th: 'รับน้ำอะไรคะ', tr: 'ráp náam à-rai khá', ru: 'Что будете пить?' },
    { th: 'เผ็ดได้ไหมคะ', tr: 'phèt dâai mǎi khá', ru: 'Острое — ок?' },
    { th: 'รับอะไรเพิ่มไหมคะ', tr: 'ráp à-rai phə̂əm mǎi khá', ru: 'Что-то ещё?' },
  ],
  shop: [
    { th: 'รับถุงไหมคะ', tr: 'ráp thǔng mǎi khá', ru: 'Пакет нужен?' },
    { th: 'อุ่นไหมคะ', tr: 'ùn mǎi khá', ru: 'Подогреть?' },
    { th: 'มีบัตรสมาชิกไหมคะ', tr: 'mii bàt sà-maa-chík mǎi khá', ru: 'Карта участника есть?' },
    { th: 'จ่ายเงินสดหรือสแกนคะ', tr: 'jàai ngən-sòt rʉ̌ʉ sà-gɛɛn khá', ru: 'Наличные или QR?' },
    { th: 'ทั้งหมด...บาทค่ะ', tr: 'tháng-mòt ... bàat khâ', ru: 'Итого …бат' },
  ],
  market: [
    { th: 'เอากี่โลคะ', tr: 'ao gìi loo khá', ru: 'Сколько кило?' },
    { th: 'เอาอะไรอีกไหมคะ', tr: 'ao à-rai ìik mǎi khá', ru: 'Что-то ещё?' },
  ],
  massage: [
    { th: 'นวดอะไรดีคะ', tr: 'nûat à-rai dii khá', ru: 'Какой массаж?' },
    { th: 'กี่ชั่วโมงคะ', tr: 'gìi chûa-moong khá', ru: 'Сколько часов?' },
    { th: 'หนักไหมคะ', tr: 'nàk mǎi khá', ru: 'По силе — ок?' },
    { th: 'เจ็บไหมคะ', tr: 'jèp mǎi khá', ru: 'Больно?' },
    { th: 'เปลี่ยนชุดค่ะ', tr: 'plìan chút khâ', ru: 'Переоденьтесь' },
  ],
};

// Пошаговые мини-диалоги. who: 'thai' — озвучивается автоматически,
// 'me' — показан RU, ответ открывается по кнопке
export const DIALOGS = [
  {
    id: 'coffee',
    name: 'Кофейня',
    sub: 'Заказать кофе от начала до конца',
    icon: DECK_META.coffee.icon,
    steps: [
      { who: 'thai', th: 'สวัสดีค่ะ รับอะไรดีคะ', tr: 'sà-wàt-dii khâ, ráp à-rai dii khá', ru: 'Здравствуйте! Что закажете?' },
      { who: 'me', ru: 'Латте со льдом, пожалуйста', th: 'ขอลาเต้เย็นค่ะ', tr: 'khɔ̌ɔ laa-têe yen khâ' },
      { who: 'thai', th: 'หวานปกติไหมคะ', tr: 'wǎan pòk-gà-tì mǎi khá', ru: 'Обычная сладость?' },
      { who: 'me', ru: 'Немного сладкий', th: 'หวานน้อยค่ะ', tr: 'wǎan nɔ́ɔi khâ' },
      { who: 'thai', th: 'ทานที่นี่หรือเอากลับคะ', tr: 'thaan thîi-nîi rʉ̌ʉ ao glàp khá', ru: 'Здесь или с собой?' },
      { who: 'me', ru: 'С собой', th: 'เอากลับค่ะ', tr: 'ao glàp khâ' },
      { who: 'thai', th: 'ห้าสิบห้าบาทค่ะ', tr: 'hâa-sìp-hâa bàat khâ', ru: '55 бат' },
      { who: 'me', ru: 'Вот, пожалуйста. Спасибо!', th: 'นี่ค่ะ ขอบคุณค่ะ', tr: 'nîi khâ, khɔ̀ɔp-khun khâ' },
    ],
  },
  {
    id: 'resto',
    name: 'Кафе',
    sub: 'Заказать еду и попросить счёт',
    icon: DECK_META.resto.icon,
    steps: [
      { who: 'thai', th: 'รับอะไรดีคะ', tr: 'ráp à-rai dii khá', ru: 'Что закажете?' },
      { who: 'me', ru: 'Пад тай с курицей, пожалуйста', th: 'ขอผัดไทยไก่ค่ะ', tr: 'khɔ̌ɔ phàt-thai gài khâ' },
      { who: 'thai', th: 'เผ็ดได้ไหมคะ', tr: 'phèt dâai mǎi khá', ru: 'Острое — ок?' },
      { who: 'me', ru: 'Не остро, пожалуйста', th: 'ไม่เผ็ดค่ะ', tr: 'mâi phèt khâ' },
      { who: 'thai', th: 'รับน้ำอะไรคะ', tr: 'ráp náam à-rai khá', ru: 'Что будете пить?' },
      { who: 'me', ru: 'Воду, пожалуйста', th: 'ขอน้ำเปล่าค่ะ', tr: 'khɔ̌ɔ nám-plàao khâ' },
      { who: 'thai', th: 'รับอะไรเพิ่มไหมคะ', tr: 'ráp à-rai phə̂əm mǎi khá', ru: 'Что-то ещё?' },
      { who: 'me', ru: 'Достаточно, спасибо', th: 'พอแล้วค่ะ ขอบคุณค่ะ', tr: 'phɔɔ lɛ́ɛo khâ, khɔ̀ɔp-khun khâ' },
      { who: 'me', ru: 'Счёт, пожалуйста', th: 'เช็คบิลค่ะ', tr: 'chék-bin khâ' },
    ],
  },
  {
    id: 'seven',
    name: '7-Eleven',
    sub: 'Касса: подогреть, пакет, оплата',
    icon: 'M4 7l2-4h12l2 4M4 7h16v13H4zM9 20v-6h6v6',
    steps: [
      { who: 'thai', th: 'สวัสดีค่ะ', tr: 'sà-wàt-dii khâ', ru: 'Здравствуйте!' },
      { who: 'me', ru: 'Здравствуйте', th: 'สวัสดีค่ะ', tr: 'sà-wàt-dii khâ' },
      { who: 'thai', th: 'อุ่นไหมคะ', tr: 'ùn mǎi khá', ru: 'Подогреть?' },
      { who: 'me', ru: 'Да, подогрейте, пожалуйста', th: 'อุ่นค่ะ', tr: 'ùn khâ' },
      { who: 'thai', th: 'รับถุงไหมคะ', tr: 'ráp thǔng mǎi khá', ru: 'Пакет нужен?' },
      { who: 'me', ru: 'Не нужно, спасибо', th: 'ไม่เอาถุงค่ะ', tr: 'mâi ao thǔng khâ' },
      { who: 'thai', th: 'จ่ายเงินสดหรือสแกนคะ', tr: 'jàai ngən-sòt rʉ̌ʉ sà-gɛɛn khá', ru: 'Наличные или QR?' },
      { who: 'me', ru: 'QR-кодом', th: 'สแกนค่ะ', tr: 'sà-gɛɛn khâ' },
      { who: 'thai', th: 'ขอบคุณค่ะ', tr: 'khɔ̀ɔp-khun khâ', ru: 'Спасибо!' },
    ],
  },
];

// 5 тонов: латинский диакритик (mark), реальный тайский тоновый знак (markThai/markName)
// и 2-3 слова-примера на каждый — с объяснением образами
export const TONES = [
  {
    name: 'Средний', mark: 'a', markThai: '—', markName: 'без знака',
    words: [
      { word: 'กา', tr: 'gaa', ru: 'ворона' },
      { word: 'ตา', tr: 'dtaa', ru: 'глаз' },
      { word: 'มา', tr: 'maa', ru: 'приходить' },
    ],
    hint: 'Ровный, как гудок телефона — без движения голоса.',
  },
  {
    name: 'Низкий', mark: 'à', markThai: '่', markName: 'ไม้เอก',
    words: [
      { word: 'ข่า', tr: 'khàa', ru: 'галангал' },
      { word: 'ไข่', tr: 'khài', ru: 'яйцо' },
      { word: 'ป่า', tr: 'pàa', ru: 'лес' },
    ],
    hint: 'Спокойно и чуть ниже обычного, как усталое «угу».',
  },
  {
    name: 'Нисходящий', mark: 'â', markThai: '่ / ้', markName: 'ไม้เอก или ไม้โท',
    words: [
      { word: 'ค่า', tr: 'khâa', ru: 'цена, плата' },
      { word: 'ห้า', tr: 'hâa', ru: 'пять' },
      { word: 'ก้าว', tr: 'kâao', ru: 'шаг' },
    ],
    hint: 'Сверху вниз, как строгое «Нет!».',
  },
  {
    name: 'Высокий', mark: 'á', markThai: '้', markName: 'ไม้โท',
    words: [
      { word: 'ค้า', tr: 'kháa', ru: 'торговать' },
      { word: 'ม้า', tr: 'máa', ru: 'лошадь' },
      { word: 'น้ำ', tr: 'náam', ru: 'вода' },
    ],
    hint: 'Высоко и напряжённо, как удивлённое «да-а?!» вверх.',
  },
  {
    name: 'Восходящий', mark: 'ǎ', markThai: '—', markName: 'без знака',
    words: [
      { word: 'ขา', tr: 'khǎa', ru: 'нога' },
      { word: 'ขาว', tr: 'khǎao', ru: 'белый' },
      { word: 'สอง', tr: 'sǎwng', ru: 'два' },
    ],
    hint: 'Снизу вверх, как переспрашиваешь: «че-го-о?»',
  },
];

// Классическая четвёрка для демонстрации, почему тон меняет смысл
export const TONE_DEMO = [
  { th: 'ใหม่', tr: 'mài', ru: 'новый', tone: 'низкий' },
  { th: 'ไม่', tr: 'mâi', ru: 'нет, не', tone: 'нисходящий' },
  { th: 'ไม้', tr: 'máai', ru: 'дерево, палка', tone: 'высокий' },
  { th: 'หม้าย', tr: 'mâai', ru: 'вдова', tone: 'нисходящий' },
];

// Видео с ютуб-плейлиста по тайскому. Показываются как «Видео 1», «Видео 2»…
// Добавить новое: дописать { id, title, deck } в конец списка (id — часть ссылки после watch?v=).
// deck — в какую тему складывать слова из этого ролика (для пайплайна транскрипций).
export const VIDEOS = [
  { id: 'vpGdD9fgWsw', title: 'The First 10 Thai Words You Must Know!', deck: 'base' },
  { id: 'RJGG9hOJOVo', title: '20 First-to-Know Thai Language Verbs', deck: 'base' },
  { id: 'Vrgeac31-Cw', title: 'Ways to call yourself and others in Thai', deck: 'base' },
  { id: 'Y9gUTvhaVLI', title: 'Basic Thai Language Grammar Rules!', deck: 'base' },
  { id: 'DBxro6aGCPk', title: 'Thai ways to ending sentences', deck: 'base' },
  { id: 'fhcDc8Ge1d4', title: 'Thai sentences based on English Tense', deck: 'base' },
  { id: 'RSlSpcaq9M0', title: 'How to make questions in Thai', deck: 'base' },
  { id: 'Let5JPI2R0I', title: 'What to say to motorcycle taxis', deck: 'base' },
  { id: 'u4af2z4sPq4', title: 'What to say to a taxi driver', deck: 'base' },
  { id: 'nBeMnQZ_Knk', title: 'How to order food in Thailand', deck: 'resto' },
  { id: 'KRdLsDmiUpg', title: 'How to order drinks in Thailand', deck: 'coffee' },
  { id: 'FSZFYNNYh38', title: 'Counting in Thai — Numbers 1-10', deck: 'num' },
];

// Миссия дня — маленькое реальное задание, ротация по дате
export const MISSIONS = [
  { text: 'Закажи сегодня кофе целиком по-тайски', th: 'ขอลาเต้เย็นค่ะ', tr: 'khɔ̌ɔ laa-têe yen khâ' },
  { text: 'Спроси цену на рынке', th: 'เท่าไหร่คะ', tr: 'thâo-rài khá' },
  { text: 'Откажись от пакета в 7-Eleven', th: 'ไม่เอาถุงค่ะ', tr: 'mâi ao thǔng khâ' },
  { text: 'Поблагодари с улыбкой троих человек', th: 'ขอบคุณค่ะ', tr: 'khɔ̀ɔp-khun khâ' },
  { text: 'Попроси «не остро» в кафе', th: 'ไม่เผ็ดค่ะ', tr: 'mâi phèt khâ' },
  { text: 'Сосчитай вслух до десяти по-тайски', th: 'หนึ่ง สอง สาม สี่ ห้า หก เจ็ด แปด เก้า สิบ', tr: 'nʉ̀ng sɔ̌ɔng sǎam sìi hâa hòk jèt pɛ̀ɛt gâao sìp' },
  { text: 'Скажи «вкусно!» тому, кто готовил', th: 'อร่อยค่ะ', tr: 'à-rɔ̀i khâ' },
];

export function missionOfToday() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now - start) / 86400000);
  return MISSIONS[dayOfYear % MISSIONS.length];
}
