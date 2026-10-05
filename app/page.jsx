'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AuthGate from '@/components/AuthGate';
import BackupControls from '@/components/BackupControls';
import { confirmedWrite } from '@/lib/save';
import { todayStr, nextBox, dueDateFor, calcStreak, NEW_PER_DAY, LEARNED_BOX } from '@/lib/srs';
import { checkThaiVoice } from '@/lib/tts';
import { DECK_META, VIDEOS } from '@/lib/data';
import { genderPhrase } from '@/lib/profile';
import { BottomNav, C } from '@/components/ui';
import Home from '@/components/screens/Home';
import Place from '@/components/screens/Place';
import Decks from '@/components/screens/Decks';
import Deck from '@/components/screens/Deck';
import Lesson from '@/components/screens/Lesson';
import Dialogs, { DialogPlayer } from '@/components/screens/Dialogs';
import Tones from '@/components/screens/Tones';
import Videos from '@/components/screens/Videos';
import Progress from '@/components/screens/Progress';
import AddSheet from '@/components/screens/AddSheet';
import VideoWords from '@/components/screens/VideoWords';

export default function Page() {
  return <AuthGate><App /></AuthGate>;
}

function App() {
  const [tab, setTab] = useState('home');
  // Оверлеи поверх вкладок: {type:'deck'|'place'|'dialog', id} или {type:'lesson', mode, deck?}
  const [overlay, setOverlay] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  const [phrases, setPhrases] = useState([]);
  const [reviews, setReviews] = useState({}); // phrase_id -> {box, due_date}
  const [activity, setActivity] = useState([]);
  // Просмотренные видео: [{ video_id, words_added, watched_at }] — для попапа «Новые слова из видео»
  const [watchedVideos, setWatchedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const write = async (request, attempts = 3) => {
    setSaveStatus('Сохраняю…');
    try {
      const result = await confirmedWrite(request, attempts);
      setSaveStatus('');
      return result;
    } catch (error) {
      setSaveStatus('Не сохранилось. Проверь подключение и повтори действие.');
      throw error;
    }
  };
  const safely = (action) => (...args) => { action(...args).catch(() => {}); };
  const [noVoice, setNoVoice] = useState(false);
  // Слова, закинутые с главной в очередь «Учить новое» (➕) — переживают перезагрузку
  const [pinned, setPinned] = useState([]);

  const load = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 12000));
      const [ph, rv, ac, wv] = await Promise.race([
        Promise.all([
          supabase.from('phrases').select('*').order('created_at'),
          supabase.from('reviews').select('*'),
          supabase.from('activity').select('*'),
          supabase.from('watched_videos').select('*'),
        ]),
        timeout,
      ]);
      if (ph.error || rv.error || ac.error || wv.error) throw ph.error || rv.error || ac.error || wv.error;
      setPhrases((ph.data || []).map(genderPhrase));
      setReviews(Object.fromEntries(rv.data.map((r) => [r.phrase_id, r])));
      setActivity(ac.data);
      setWatchedVideos(wv.data || []);
    } catch (e) {
      setLoadError(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    try {
      const ids = JSON.parse(localStorage.getItem('thai-pinned-new') || '[]');
      if (Array.isArray(ids)) setPinned(ids.filter(id => typeof id === 'string'));
    } catch {}
    const cleanupVoice = checkThaiVoice((ok) => setNoVoice(!ok));
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    return cleanupVoice;
  }, []);

  const today = todayStr();
  const visible = useMemo(() => phrases.filter((p) => !p.hidden), [phrases]);
  const newPhrases = useMemo(() => visible.filter((p) => !reviews[p.id]), [visible, reviews]);
  const duePhrases = useMemo(
    () => visible.filter((p) => reviews[p.id] && reviews[p.id].due_date <= today),
    [visible, reviews, today]
  );
  const chatCount = useMemo(
    () => newPhrases.filter((p) => p.source === 'chat').length,
    [newPhrases]
  );
  // Последние слова: только добавленные пользователем (из чата или вручную), по дате добавления, новые сверху
  const recentWords = useMemo(
    () =>
      visible
        .filter((p) => p.source !== 'seed')
        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
        .slice(0, 20),
    [visible]
  );
  const streak = useMemo(() => calcStreak(activity), [activity]);

  // Слова, привязанные к видео (source='video'): video_id -> [phrases]
  const videoPhrases = useMemo(() => {
    const map = {};
    for (const p of phrases) {
      if (!p.video_id) continue;
      (map[p.video_id] ||= []).push(p);
    }
    return map;
  }, [phrases]);

  // Попап показываем для самого свежего просмотренного видео, у которого слова
  // ещё не добавлены (words_added=false) и для которого слова вообще заведены.
  const pendingVideo = useMemo(() => {
    const cand = watchedVideos
      .filter((w) => !w.words_added && (videoPhrases[w.video_id]?.length))
      .sort((a, b) => (b.watched_at || '').localeCompare(a.watched_at || ''));
    return cand[0] || null;
  }, [watchedVideos, videoPhrases]);

  const savePinned = (ids) => {
    setPinned(ids);
    try { localStorage.setItem('thai-pinned-new', JSON.stringify(ids)); } catch {}
  };
  const unpin = (id) => savePinned(pinned.filter((x) => x !== id));

  // ➕ на главной: закинуть слово в очередь ближайшего занятия «Учить новое» (тап повторно — убрать)
  const togglePin = (phrase) => {
    if (pinned.includes(phrase.id)) unpin(phrase.id);
    else savePinned([...pinned, phrase.id]);
  };

  // Добавить слова видео в изучение: снять hidden с ВЫБРАННЫХ (не исключённых),
  // закинуть их в очередь «Учить новое» и пометить видео обработанным (words_added=true).
  // excludedIds — слова, с которых сняли галочку в попапе: они остаются скрытыми.
  const addVideoWords = async (videoId, excludedIds = []) => {
    const list = videoPhrases[videoId] || [];
    if (!list.length) return;
    const ex = new Set(excludedIds);
    const ids = list.filter((p) => !ex.has(p.id)).map((p) => p.id);
    if (ids.length) await write(() => supabase.from('phrases').update({ hidden: false }).in('id', ids));
    await write(() => supabase.from('watched_videos').update({ words_added: true }).eq('video_id', videoId));
    setPhrases((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, hidden: false } : p)));
    if (ids.length) savePinned([...new Set([...pinned, ...ids])]);
    setWatchedVideos((prev) => prev.map((w) => (w.video_id === videoId ? { ...w, words_added: true } : w)));
  };

  const startVideoLesson = async (videoId, excludedIds = []) => {
    const ex = new Set(excludedIds);
    const ids = (videoPhrases[videoId] || []).filter((p) => !ex.has(p.id)).map((p) => p.id);
    await addVideoWords(videoId, excludedIds);
    if (ids.length) setOverlay({ type: 'lesson', mode: 'video', videoId, phraseIds: ids });
  };

  const markWatched = async (videoId) => {
    if (watchedVideos.some(w => w.video_id === videoId)) return;
    const row = { video_id: videoId, words_added: false, watched_at: new Date().toISOString() };
    await write(() => supabase.from('watched_videos').upsert(row));
    setWatchedVideos(prev => [...prev.filter(w => w.video_id !== videoId), row]);
  };

  // ✓ на главной: «уже знаю» — сразу закрепить (box 4); повторный тап отменяет и возвращает в новые
  const toggleLearned = async (phrase) => {
    if ((reviews[phrase.id]?.box ?? -1) >= LEARNED_BOX) {
      await write(() => supabase.from('reviews').delete().eq('phrase_id', phrase.id));
      setReviews((prev) => {
        const next = { ...prev };
        delete next[phrase.id];
        return next;
      });
    } else {
      const row = {
        phrase_id: phrase.id,
        box: LEARNED_BOX,
        due_date: dueDateFor(LEARNED_BOX),
        updated_at: new Date().toISOString(),
      };
      await write(() => supabase.from('reviews').upsert(row));
      setReviews((prev) => ({ ...prev, [phrase.id]: row }));
      if (pinned.includes(phrase.id)) unpin(phrase.id);
    }
  };

  // Оценка карточки: обновить box/due_date в reviews (upsert)
  const gradePhrase = async (phrase, grade) => {
    // Передаём итоговую ступень: повтор того же запроса не повышает её дважды.
    const { data } = await write(() => supabase.rpc('save_grade', {
      phrase: phrase.id, grade, target_box: nextBox(reviews[phrase.id]?.box ?? 0, grade), session_mode: overlay.mode,
    }));
    setReviews(prev => ({ ...prev, [phrase.id]: data.review }));
    setActivity(prev => [...prev.filter(a => a.day !== data.activity.day), data.activity]);
    if (pinned.includes(phrase.id)) unpin(phrase.id);
  };

  const toggleHidden = async (phrase) => {
    const hidden = !phrase.hidden;
    await write(() => supabase.from('phrases').update({ hidden }).eq('id', phrase.id));
    setPhrases((prev) => prev.map((p) => (p.id === phrase.id ? { ...p, hidden } : p)));
  };

  // Скрыть слово прямо с карточки в «Учить новое» (иконка-глаз) — вернуть можно в колоде
  const hideFromLesson = async (phrase) => {
    await toggleHidden(phrase);
    if (pinned.includes(phrase.id)) unpin(phrase.id);
  };

  const addPhrase = async ({ ru, th, tr, deck }) => {
    const { data, error } = await supabase
      .from('phrases')
      .insert({ ru, th, tr, deck, source: 'manual' })
      .select()
      .single();
    if (error) throw error;
    setPhrases((prev) => [...prev, genderPhrase(data)]);
  };

  // Перемешать фразы, чтобы похожие слова не шли подряд и порядок не подсказывал ответ
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Очередь занятия по режиму
  const lessonQueue = useMemo(() => {
    if (!overlay || overlay.type !== 'lesson') return [];
    if (overlay.mode === 'new') {
      // Закинутые с главной (➕) — в начало очереди, внутри групп порядок случайный
      const pin = new Set(pinned);
      return shuffle(newPhrases)
        .sort((a, b) => (pin.has(b.id) ? 1 : 0) - (pin.has(a.id) ? 1 : 0))
        .slice(0, NEW_PER_DAY);
    }
    if (overlay.mode === 'review') return shuffle(duePhrases);
    if (overlay.mode === 'video') {
      const set = new Set(overlay.phraseIds || []);
      return shuffle(phrases.filter((p) => set.has(p.id)));
    }
    return shuffle(visible.filter((p) => p.deck === overlay.deck));
    // очередь фиксируется на момент старта занятия
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlay]);

  const lessonTitle =
    overlay?.type === 'lesson'
      ? overlay.mode === 'new' ? 'Новое'
        : overlay.mode === 'review' ? 'Повторение'
        : overlay.mode === 'video' ? 'Из видео'
        : DECK_META[overlay.deck].name
      : '';

  const inLesson = overlay?.type === 'lesson';

  const content = () => {
    // Диалоги и тоны не зависят от базы — показываем сразу
    if (!overlay && tab === 'dialogs') {
      return <Dialogs onOpen={(id) => setOverlay({ type: 'dialog', id })} />;
    }
    if (!overlay && tab === 'tones') {
      return <Tones noVoice={noVoice} />;
    }
    if (!overlay && tab === 'videos') {
      return <Videos watched={watchedVideos} onWatch={safely(markWatched)} videoPhrases={videoPhrases} onLearn={safely(startVideoLesson)} />;
    }
    if (overlay?.type === 'dialog') {
      return <DialogPlayer dialogId={overlay.id} noVoice={noVoice} onBack={() => setOverlay(null)} />;
    }
    if (loading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: C.faint, fontSize: 14, fontWeight: 600 }}>
          Загружаю фразы…
        </div>
      );
    }
    if (loadError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
          <div style={{ color: C.sub, fontSize: 14, fontWeight: 600, textAlign: 'center' }}>Не получилось загрузить фразы.<br />Проверь интернет.</div>
          <div className="press" onClick={load} style={{ background: '#17181A', color: '#fff', borderRadius: 999, padding: '13px 28px', fontSize: 14, fontWeight: 800 }}>
            Попробовать снова
          </div>
        </div>
      );
    }
    if (inLesson) {
      return (
        <Lesson
          key={`${overlay.mode}-${overlay.deck || overlay.videoId || ''}`}
          title={lessonTitle}
          initialQueue={lessonQueue}
          noVoice={noVoice}
          onGrade={gradePhrase}
          onHide={overlay.mode === 'new' ? hideFromLesson : undefined}
          onExit={() => setOverlay(overlay.from ? { type: 'deck', id: overlay.deck } : null)}
        />
      );
    }
    if (overlay?.type === 'place') {
      return <Place deck={overlay.id} phrases={phrases} noVoice={noVoice} onBack={() => setOverlay(null)} />;
    }
    if (overlay?.type === 'deck') {
      return (
        <Deck
          deck={overlay.id}
          phrases={phrases}
          reviews={reviews}
          onBack={() => setOverlay(null)}
          onTrain={() => setOverlay({ type: 'lesson', mode: 'deck', deck: overlay.id, from: 'deck' })}
          onToggleHidden={safely(toggleHidden)}
        />
      );
    }
    switch (tab) {
      case 'decks':
        return <Decks phrases={phrases} reviews={reviews} onDeck={(id) => setOverlay({ type: 'deck', id })} onAdd={() => setAddOpen(true)} />;
      case 'progress':
        return <><Progress streak={streak} phrases={phrases} reviews={reviews} /><BackupControls onRestore={load} /></>;
      default:
        return (
          <Home
            streak={streak}
            newCount={Math.min(newPhrases.length, NEW_PER_DAY)}
            reviewCount={duePhrases.length}
            chatCount={chatCount}
            recentWords={recentWords}
            reviews={reviews}
            pinnedIds={pinned}
            onTogglePin={togglePin}
            onToggleLearned={safely(toggleLearned)}
            onStartNew={() => setOverlay({ type: 'lesson', mode: 'new' })}
            onStartReview={() => setOverlay({ type: 'lesson', mode: 'review' })}
            onPlace={(deck) => setOverlay({ type: 'place', id: deck })}
          />
        );
    }
  };

  return (
    <div style={{
      maxWidth: 430, margin: '0 auto', minHeight: '100dvh', background: C.bg,
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      <div style={{ flex: 1, overflow: 'auto', padding: 'calc(env(safe-area-inset-top) + 20px) 20px 20px', boxSizing: 'border-box' }}>
        {saveStatus && <p role="status" aria-live="polite" style={{ fontSize: 13, color: C.sub }}>{saveStatus}</p>}
        {content()}
      </div>
      {!inLesson && (
        <div style={{ position: 'sticky', bottom: 0 }}>
          <BottomNav active={tab} onNav={(key) => { setTab(key); setOverlay(null); setAddOpen(false); }} />
        </div>
      )}
      {addOpen && <AddSheet onClose={() => setAddOpen(false)} onAdd={addPhrase} />}
      {!loading && !loadError && !inLesson && !addOpen && pendingVideo && (
        <VideoWords
          videoNo={VIDEOS.findIndex((v) => v.id === pendingVideo.video_id) + 1}
          title={VIDEOS.find((v) => v.id === pendingVideo.video_id)?.title}
          phrases={videoPhrases[pendingVideo.video_id] || []}
          onStart={(excludedIds) => startVideoLesson(pendingVideo.video_id, excludedIds)}
          onClose={(excludedIds) => addVideoWords(pendingVideo.video_id, excludedIds)}
        />
      )}
    </div>
  );
}
