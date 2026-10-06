-- Только при первой установке, ПОСЛЕ seed.sql и learning-workflows.sql.
-- Стартовые и личные intro-фразы (source='chat', не из видео) входят в занятия сразу,
-- а не ждут решения во «Входящих». Слова из видео остаются на выбор. Повтор безопасен.
-- Не запускать на базе с данными: защита `not exists` пропускает всё, если есть прогресс,
-- чтобы не забрать фразы, намеренно оставленные во «Входящих».
insert into public.phrase_decisions (phrase_id, choice)
select id, 'learn' from public.phrases
where source = 'chat' and video_id is null and hidden = false
  and not exists (select 1 from public.reviews)
on conflict (phrase_id) do nothing;
