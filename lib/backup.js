const TABLES = ['phrases', 'reviews', 'activity', 'watched_videos'];
export function validateBackup(value) {
  if (!value || value.format !== 'thai-trainer' || value.version !== 1) throw new Error('Неверный формат резервной копии');
  for (const table of TABLES) {
    if (!Array.isArray(value[table]) || value[table].some(row => !row || typeof row !== 'object' || Array.isArray(row))) throw new Error('Неверный формат таблицы ' + table);
  }
  const ids = new Set(value.phrases.map(p => p.id));
  if (ids.size !== value.phrases.length || value.phrases.some(p => !/^[0-9a-f-]{36}$/i.test(p.id) || ['ru','th','tr','deck'].some(k => typeof p[k] !== 'string') || !['base','num','coffee','resto','shop','market','massage'].includes(p.deck) || typeof p.hidden !== 'boolean')) throw new Error('Неверные фразы');
  if (value.reviews.some(r => !ids.has(r.phrase_id) || !Number.isInteger(r.box) || r.box < 0 || r.box > 6 || !/^\d{4}-\d{2}-\d{2}$/.test(r.due_date))) throw new Error('Неверный прогресс');
  if (value.activity.some(r => !/^\d{4}-\d{2}-\d{2}$/.test(r.day) || typeof r.did_review !== 'boolean' || typeof r.did_new !== 'boolean')) throw new Error('Неверная активность');
  if (value.watched_videos.some(r => typeof r.video_id !== 'string' || typeof r.words_added !== 'boolean')) throw new Error('Неверные видео');
  return value;
}

export async function exportBackup(client) {
  const value = { format: 'thai-trainer', version: 1, exported_at: new Date().toISOString() };
  for (const table of TABLES) {
    const rows = [];
    const key = { phrases: 'id', reviews: 'phrase_id', activity: 'day', watched_videos: 'video_id' }[table];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await client.from(table).select('*').order(key).range(offset, offset + 499);
      if (error) throw error;
      rows.push(...data);
      if (data.length < 500) break;
    }
    value[table] = rows;
  }
  return validateBackup(value);
}
