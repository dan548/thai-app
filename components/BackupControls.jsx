'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { exportBackup, validateBackup } from '@/lib/backup';

export default function BackupControls({ onRestore }) {
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const run = async action => {
    if (busy) return;
    setBusy(true); setMessage('');
    try { await action(); } catch (error) { setMessage(error.message || 'Не удалось выполнить операцию. Повтори после восстановления связи.'); }
    finally { setBusy(false); }
  };
  return <section style={{ marginTop: 24, padding: 16, background: '#fff', borderRadius: 20 }}>
    <h3>Резервная копия</h3>
    <button disabled={busy} onClick={() => run(async () => {
      const backup = await exportBackup(supabase);
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = `thai-trainer-${backup.exported_at.slice(0,10)}.json`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('Копия подготовлена для скачивания.');
    })}>Скачать JSON</button>
    <label style={{ display: 'block', marginTop: 12 }}>Выбрать копию для восстановления<input type="file" accept="application/json,.json" disabled={busy} onChange={event => {
      const file = event.target.files?.[0]; event.target.value = ''; setPending(null);
      if (!file) return;
      run(async () => {
        if (file.size > 10 * 1024 * 1024) throw new Error('Файл должен быть меньше 10 МБ');
        setPending(validateBackup(JSON.parse(await file.text())));
      });
    }} /></label>
    {pending && <div><p>Фраз: {pending.phrases.length}, записей прогресса: {pending.reviews.length}{pending.version === 2 && <>, решений: {pending.phrase_decisions.length}, миссий: {pending.mission_results.length}</>}. Совпадающие записи будут заменены данными копии. Другие записи сохранятся.</p>
      <button disabled={busy} onClick={() => run(async () => {
        // Сначала сохранить текущее состояние отдельной копией.
        const before = await exportBackup(supabase);
        const url = URL.createObjectURL(new Blob([JSON.stringify(before, null, 2)], { type: 'application/json' }));
        const link = document.createElement('a'); link.href = url; link.download = `thai-trainer-before-restore-${Date.now()}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        const { error } = await supabase.rpc('restore_backup', { backup: pending });
        if (error) throw error;
        setPending(null); await onRestore(); setMessage('Данные восстановлены.');
      })}>Восстановить из этой копии</button>
      <button disabled={busy} onClick={() => setPending(null)}>Отмена</button>
    </div>}
    {busy && <p role="status">Выполняю…</p>}
    {message && <p role="status">{message}</p>}
  </section>;
}
