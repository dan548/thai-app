'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AuthGate from '@/components/AuthGate';
import BackupControls from '@/components/BackupControls';
import MissionHistory from '@/components/MissionHistory';
import Inbox from '@/components/screens/Inbox';
import { inLearning, incomingPhrases, phraseChoice } from '@/lib/learning';
import { confirmedWrite } from '@/lib/save';
import { createGradeSaver } from '@/lib/grades';
import { todayStr, calcStreak, NEW_PER_DAY } from '@/lib/srs';
import { checkThaiVoice } from '@/lib/tts';
import { DECK_META, VIDEOS, missionOfToday } from '@/lib/data';
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
  const [addDeck, setAddDeck] = useState('base');
  const [decisions, setDecisions] = useState({});
  const [missions, setMissions] = useState([]);
  const [wordVideo, setWordVideo] = useState(null);
  const [dismissedVideos, setDismissedVideos] = useState([]);

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
  // Только для обработчиков без состояния ожидания. Асинхронные экраны
  // получают исходный Promise и обрабатывают ошибки самостоятельно.
  const safely = (action) => (...args) => action(...args).catch(() => {});
  const [saveGrade] = useState(() => createGradeSaver(supabase, request => write(request)));
  const [noVoice, setNoVoice] = useState(false);
  // Слова, закинутые с главной в очередь «Учить новое» (➕) — переживают перезагрузку
  const [pinned, setPinned] = useState([]);

  const load = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 12000));
      const [ph, rv, ac, wv, dc, ms] = await Promise.race([
        Promise.all([
          supabase.from('phrases').select('*').order('created_at'),
          supabase.from('reviews').select('*'),
          supabase.from('activity').select('*'),
          supabase.from('watched_videos').select('*'),
          supabase.from('phrase_decisions').select('*'),
          supabase.from('mission_results').select('*'),
        ]),
        timeout,
      ]);
      if ([ph,rv,ac,wv,dc,ms].some(r => r.error)) throw [ph,rv,ac,wv,dc,ms].find(r => r.error).error;
      setPhrases((ph.data || []).map(genderPhrase));
      setReviews(Object.fromEntries(rv.data.map((r) => [r.phrase_id, r])));
      setActivity(ac.data);
      setWatchedVideos(wv.data || []);
      setDecisions(Object.fromEntries((dc.data || []).map(d => [d.phrase_id,d])));
      setMissions(ms.data || []);
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
  const studyPhrases = useMemo(() => phrases.filter(p => ['learn','known'].includes(phraseChoice(p,decisions,reviews))),[phrases,decisions,reviews]);
  const visible = useMemo(() => studyPhrases.filter(p => !p.hidden),[studyPhrases]);
  const incoming = useMemo(() => incomingPhrases(phrases,decisions,reviews,watchedVideos),[phrases,decisions,reviews,watchedVideos]);
  const inboxPhrases = useMemo(() => phrases.filter(p => p.source !== 'seed' && (p.source !== 'video' || watchedVideos.some(w => w.video_id === p.video_id))),[phrases,watchedVideos]);
  const mission = missionOfToday(today);
  const missionRecord = missions.find(m => m.day === today && m.mission_id === mission.id);
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

  // Новые слова требуют решения даже у видео с ранее сохранённым выбором.
  const pendingVideo = useMemo(() => {
    const cand = watchedVideos
      .filter(w => !dismissedVideos.includes(w.video_id) && videoPhrases[w.video_id]?.some(p => phraseChoice(p,decisions,reviews) === 'pending'))
      .sort((a, b) => (b.watched_at || '').localeCompare(a.watched_at || ''));
    return cand[0] || null;
  }, [watchedVideos, videoPhrases, dismissedVideos, decisions, reviews]);

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

  const applyChoices = (results) => {
    const updated = new Map(results.map(r => [r.phrase.id,genderPhrase(r.phrase)]));
    setPhrases(prev => prev.map(p => updated.get(p.id) || p));
    setDecisions(prev => ({ ...prev, ...Object.fromEntries(results.map(r => [r.decision.phrase_id,r.decision])) }));
    setReviews(prev => {
      const next = { ...prev };
      for (const r of results) {
        if (r.review) next[r.phrase.id] = r.review;
        else delete next[r.phrase.id];
      }
      return next;
    });
    const removed = new Set(results.filter(r => r.decision.choice !== 'learn').map(r => r.phrase.id));
    savePinned(pinned.filter(id => !removed.has(id)));
  };
  const decidePhrase = async (phrase, choice) => {
    const { data } = await write(() => supabase.rpc('decide_phrase',{ phrase: phrase.id, decision: choice }));
    applyChoices([data]);
  };
  const closeVideo = (id) => {
    setDismissedVideos(prev => [...new Set([...prev,id])]);
    setWordVideo(null);
  };
  const saveVideoChoices = async (id, choices, start = false) => {
    const { data } = await write(() => supabase.rpc('choose_video_words',{ video: id, choices }));
    applyChoices(data.results);
    setWatchedVideos(prev => [...prev.filter(w => w.video_id !== id),data.watched]);
    closeVideo(id);
    const ids = data.results.filter(r => r.decision.choice === 'learn').map(r => r.phrase.id);
    if (start && ids.length) setOverlay({ type: 'lesson', mode: 'video', videoId: id, phraseIds: ids });
  };
  const openVideoWords = async (id) => {
    const list = videoPhrases[id] || [];
    if (list.some(p => ['pending','deferred'].includes(phraseChoice(p,decisions,reviews)))) {
      setWordVideo(id); return;
    }
    const ids = list.filter(p => inLearning(p,decisions,reviews)).map(p => p.id);
    if (ids.length) setOverlay({ type: 'lesson', mode: 'video', videoId: id, phraseIds: ids });
    else setWordVideo(id);
  };
  const saveMission = async (selected, { note, completed }) => {
    const existing = missions.find(m => m.day === today);
    const row = { day: today, mission_id: selected.id, note,
      completed_at: completed ? existing?.completed_at || new Date().toISOString() : null,
      checked_at: completed ? existing?.checked_at || null : null };
    await write(() => supabase.from('mission_results').upsert(row));
    setMissions(prev => [...prev.filter(m => m.day !== today),row]);
  };
  const checkMission = async (record) => {
    const checked_at = new Date().toISOString();
    await write(() => supabase.from('mission_results').update({ checked_at }).eq('day',record.day).select().single());
    setMissions(prev => prev.map(m => m.day === record.day ? { ...m, checked_at } : m));
  };

  const markWatched = async (videoId) => {
    if (watchedVideos.some(w => w.video_id === videoId)) return;
    const row = { video_id: videoId, words_added: false, watched_at: new Date().toISOString() };
    await write(() => supabase.from('watched_videos').upsert(row, { ignoreDuplicates: true }));
    setWatchedVideos(prev => [...prev.filter(w => w.video_id !== videoId), row]);
  };

  // «Уже знаю» и возврат к изучению используют то же атомарное решение, что и входящие.
  const toggleLearned = (phrase) => decidePhrase(phrase,
    phraseChoice(phrase, decisions, reviews) === 'known' ? 'learn' : 'known');

  // Оценка карточки: обновить box/due_date в reviews (upsert)
  const gradePhrase = async (phrase, grade) => {
    const data = await saveGrade(phrase.id, grade, overlay.mode);
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
      return <Videos watched={watchedVideos} onWatch={markWatched} videoPhrases={videoPhrases} onLearn={openVideoWords} decisions={decisions} reviews={reviews} noVoice={noVoice} />;
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
    if (overlay?.type === 'inbox') {
      return <Inbox phrases={inboxPhrases} decisions={decisions} reviews={reviews} noVoice={noVoice} onDecision={decidePhrase} onBack={() => setOverlay(null)} />;
    }
    if (overlay?.type === 'place') {
      return <Place deck={overlay.id} phrases={phrases} noVoice={noVoice} onBack={() => setOverlay(null)} />;
    }
    if (overlay?.type === 'deck') {
      return (
        <Deck
          deck={overlay.id}
          phrases={studyPhrases}
          reviews={reviews}
          onBack={() => setOverlay(null)}
          onTrain={() => setOverlay({ type: 'lesson', mode: 'deck', deck: overlay.id, from: 'deck' })}
          onToggleHidden={safely(toggleHidden)}
        />
      );
    }
    switch (tab) {
      case 'decks':
        return <Decks phrases={studyPhrases} reviews={reviews} onDeck={(id) => setOverlay({ type: 'deck', id })} onAdd={() => { setAddDeck('base'); setAddOpen(true); }} />;
      case 'progress':
        return <><Progress streak={streak} phrases={studyPhrases} reviews={reviews} /><MissionHistory noVoice={noVoice} records={missions} onCheck={checkMission} /><BackupControls onRestore={load} /></>;
      default:
        return (
          <Home
            mission={mission} missionRecord={missionRecord} noVoice={noVoice}
            onSaveMission={saveMission}
            onAddMissionPhrase={() => { setAddDeck(mission.deck || 'base'); setAddOpen(true); }}
            inboxCount={incoming.length} onInbox={() => setOverlay({ type: 'inbox' })}
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
          <BottomNav active={tab} onNav={(key) => { setTab(key); setOverlay(null); setAddOpen(false); setWordVideo(null); }} />
        </div>
      )}
      {addOpen && <AddSheet initialDeck={addDeck} onClose={() => setAddOpen(false)} onAdd={addPhrase} />}
      {!loading && !loadError && tab === 'videos' && !overlay && !addOpen && (wordVideo || pendingVideo) && (
        <VideoWords
          key={wordVideo || pendingVideo.video_id}
          title={VIDEOS.find(v => v.id === (wordVideo || pendingVideo.video_id))?.title}
          phrases={videoPhrases[wordVideo || pendingVideo.video_id] || []}
          decisions={decisions} reviews={reviews} noVoice={noVoice}
          onSave={(choices,start) => saveVideoChoices(wordVideo || pendingVideo.video_id,choices,start)}
          onClose={() => closeVideo(wordVideo || pendingVideo.video_id)}
        />
      )}
    </div>
  );
}
