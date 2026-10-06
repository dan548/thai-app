-- Только при первой установке, ПОСЛЕ seed.sql и learning-workflows.sql.
-- Стартовые и личные intro-фразы (source='chat', не из видео) входят в занятия сразу,
-- а не ждут решения во «Входящих». Слова из видео остаются на выбор. Повтор безопасен.
insert into public.phrase_decisions (phrase_id, choice)
select id, 'learn' from public.phrases
where source = 'chat' and video_id is null and hidden = false
on conflict (phrase_id) do nothing;
