-- Запускать через SQL Editor с административной ролью. Все изменения откатываются.
begin;
do $$ declare t text; begin
  foreach t in array array['phrases','reviews','activity','watched_videos','app_owner'] loop
    if has_table_privilege('anon','public.'||t,'select,insert,update,delete') then
      raise exception 'Анонимный доступ к %', t;
    end if;
  end loop;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',user_id,'role','authenticated')::text,true)
  from public.app_owner;
set local role authenticated;
do $$
declare p public.phrases; r jsonb; b jsonb;
begin
  select * into p from public.phrases limit 1;
  if p.id is null then raise exception 'Владелец не видит фразы'; end if;
  r := public.save_grade(p.id,'good',1,'new');
  r := public.save_grade(p.id,'good',1,'new');
  if (r->'review'->>'box')::integer <> 1 or not (r->'activity'->>'did_new')::boolean then
    raise exception 'Повтор оценки или активность некорректны';
  end if;
  b := jsonb_build_object('format','thai-trainer','version',1,
    'phrases',jsonb_build_array(to_jsonb(p)||jsonb_build_object('ru','test restore')),
    'reviews','[]'::jsonb,'activity','[]'::jsonb,'watched_videos','[]'::jsonb);
  perform public.restore_backup(b);
  if (select ru from public.phrases where id=p.id) <> 'test restore' then raise exception 'Импорт не выполнен'; end if;
  b := jsonb_set(b,'{phrases}',jsonb_build_array(to_jsonb(p)||jsonb_build_object('ru','must roll back')));
  b := jsonb_set(b,'{reviews}',jsonb_build_array(jsonb_build_object('phrase_id',p.id,'box',-1,'due_date','2026-10-05')));
  begin
    perform public.restore_backup(b);
    raise exception 'Неверный импорт принят';
  exception when raise_exception then
    if SQLERRM <> 'Неверная ступень SRS' then raise; end if;
  end;
  if (select ru from public.phrases where id=p.id) <> 'test restore' then raise exception 'Частичный импорт не откатился'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
do $$ declare n integer; begin
  if exists(select 1 from public.phrases) or exists(select 1 from public.reviews)
    or exists(select 1 from public.activity) or exists(select 1 from public.watched_videos)
    or exists(select 1 from public.app_owner) then raise exception 'Посторонний видит данные'; end if;
  begin
    insert into public.phrases(ru,th,tr,deck) values('test','test','test','base');
    raise exception 'Посторонний может вставлять';
  exception when insufficient_privilege then null; end;
  update public.phrases set hidden=true;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'Посторонний может изменять'; end if;
  delete from public.phrases;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'Посторонний может удалять'; end if;
  begin
    perform public.restore_backup('{}'::jsonb);
    raise exception 'Посторонний может импортировать';
  exception when raise_exception then if SQLERRM <> 'Доступ запрещён' then raise; end if; end;
end $$;
rollback;
