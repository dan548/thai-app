-- Все записи, включая тестовые видео и результаты, откатываются.
begin;
do $$ declare t text; begin
  foreach t in array array['phrase_decisions','mission_results'] loop
    if has_table_privilege('anon','public.'||t,'select,insert,update,delete') then raise exception 'Анонимный доступ к %',t; end if;
  end loop;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',user_id,'role','authenticated')::text,true) from public.app_owner;
set local role authenticated;
do $$ declare p uuid; q uuid; r jsonb; b jsonb; v text:='workflow-test'; begin
  insert into public.phrases(ru,th,tr,deck,source,video_id) values('test','test','test','base','video',v) returning id into p;
  insert into public.phrases(ru,th,tr,deck,source,video_id) values('other','other','other','base','video','other-video') returning id into q;
  insert into public.watched_videos(video_id,words_added) values(v,false);
  r:=public.decide_phrase(p,'deferred');
  if not (r->'phrase'->>'hidden')::boolean then raise exception 'Отложенная фраза не скрыта'; end if;
  r:=public.decide_phrase(p,'known');
  if (r->'review'->>'box')::integer < 4 then raise exception 'Уже знаю не закреплено'; end if;
  r:=public.decide_phrase(p,'learn');
  if r->'review' <> 'null'::jsonb or (r->'phrase'->>'hidden')::boolean then raise exception 'Возврат к изучению не сбросил отметку'; end if;
  perform public.decide_phrase(p,'learn'); -- Повтор безопасен.
  r:=public.choose_video_words(v,jsonb_build_array(jsonb_build_object('phrase_id',p,'choice','learn')));
  if not (r->'watched'->>'words_added')::boolean then raise exception 'Выбор не завершён'; end if;
  begin
    perform public.choose_video_words(v,jsonb_build_array(jsonb_build_object('phrase_id',p,'choice','dismissed'),jsonb_build_object('phrase_id',q,'choice','learn')));
    raise exception 'Чужая фраза принята';
  exception when raise_exception then if SQLERRM <> 'Фраза не принадлежит видео' then raise; end if; end;
  if (select choice from public.phrase_decisions where phrase_id=p) <> 'learn' then raise exception 'Частичный выбор не откатился'; end if;
  insert into public.mission_results(day,mission_id,note,completed_at) values('2099-01-01','thanks','Ответили по-тайски',now());
  b:=jsonb_build_object('format','thai-trainer','version',2,'phrases','[]'::jsonb,'reviews','[]'::jsonb,'activity','[]'::jsonb,'watched_videos','[]'::jsonb,
    'phrase_decisions',jsonb_build_array(jsonb_build_object('phrase_id',p,'choice','learn','updated_at',now())),
    'mission_results',jsonb_build_array(jsonb_build_object('day','2099-01-01','mission_id','thanks','note','Восстановлено','completed_at',now())));
  perform public.restore_backup(b);
  if (select note from public.mission_results where day='2099-01-01') <> 'Восстановлено' then raise exception 'Миссия не восстановлена'; end if;
  b:=jsonb_set(b,'{phrase_decisions}',jsonb_build_array(jsonb_build_object('phrase_id',p,'choice','invalid','updated_at',now())));
  begin perform public.restore_backup(b); raise exception 'Неверный выбор принят'; exception when check_violation then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
do $$ begin
  if exists(select 1 from public.phrase_decisions) or exists(select 1 from public.mission_results) then raise exception 'Посторонний видит новые данные'; end if;
  begin insert into public.mission_results(day,mission_id) values('2099-01-02','thanks'); raise exception 'Посторонний пишет результаты'; exception when insufficient_privilege then null; end;
  begin perform public.decide_phrase(gen_random_uuid(),'learn'); raise exception 'Посторонний выбирает фразы'; exception when raise_exception then if SQLERRM <> 'Доступ запрещён' then raise; end if; end;
  begin perform public.choose_video_words('x','[]'::jsonb); raise exception 'Посторонний выбирает видео'; exception when raise_exception then if SQLERRM <> 'Доступ запрещён' then raise; end if; end;
end $$;
rollback;
