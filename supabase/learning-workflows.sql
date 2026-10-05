-- Выполнить после secure-owner.sql и save-grade.sql.
create table if not exists public.phrase_decisions (
  phrase_id uuid primary key references public.phrases(id) on delete cascade,
  choice text not null check (choice in ('learn','known','dismissed','deferred')),
  updated_at timestamptz not null default now()
);
create table if not exists public.mission_results (
  day date primary key,
  mission_id text not null,
  note text not null default '' check (length(note) <= 2000),
  completed_at timestamptz,
  checked_at timestamptz
);
do $$ declare t text; begin
  foreach t in array array['phrase_decisions','mission_results'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public,anon,authenticated',t);
    execute format('grant select,insert,update,delete on public.%I to authenticated',t);
    execute format('drop policy if exists owner_access on public.%I',t);
    execute format('create policy owner_access on public.%I for all to authenticated
      using (exists(select 1 from public.app_owner where user_id=(select auth.uid())))
      with check (exists(select 1 from public.app_owner where user_id=(select auth.uid())))',t);
  end loop;
end $$;

create or replace function public.decide_phrase(phrase uuid, decision text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare p public.phrases; d public.phrase_decisions; r public.reviews; previous_choice text;
begin
  if not exists(select 1 from public.app_owner where user_id=auth.uid()) then raise exception 'Доступ запрещён'; end if;
  if decision is null or decision not in ('learn','known','dismissed','deferred') then raise exception 'Неверное решение'; end if;
  select * into p from public.phrases where id=phrase for update;
  if not found then raise exception 'Фраза не найдена'; end if;
  select choice into previous_choice from public.phrase_decisions where phrase_id=phrase;
  if decision='learn' and previous_choice='known' then
    delete from public.reviews where phrase_id=phrase;
  end if;
  insert into public.phrase_decisions(phrase_id,choice) values(phrase,decision)
    on conflict(phrase_id) do update set choice=excluded.choice,updated_at=now() returning * into d;
  update public.phrases set hidden=decision in ('dismissed','deferred') where id=phrase returning * into p;
  if decision='known' then
    insert into public.reviews(phrase_id,box,due_date,updated_at)
      values(phrase,4,(now() at time zone 'Asia/Bangkok')::date+7,now())
      on conflict(phrase_id) do update set box=greatest(public.reviews.box,4),
        due_date=greatest(public.reviews.due_date,excluded.due_date),updated_at=now();
  end if;
  select * into r from public.reviews where phrase_id=phrase;
  return jsonb_build_object('phrase',to_jsonb(p),'decision',to_jsonb(d),'review',case when r.phrase_id is null then null else to_jsonb(r) end);
end $$;

create or replace function public.choose_video_words(video text, choices jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare c record; results jsonb:='[]'::jsonb; watched public.watched_videos;
begin
  if not exists(select 1 from public.app_owner where user_id=auth.uid()) then raise exception 'Доступ запрещён'; end if;
  if jsonb_typeof(choices) is distinct from 'array' then raise exception 'Неверный список решений'; end if;
  select * into watched from public.watched_videos where video_id=video for update;
  if not found then raise exception 'Сначала отметьте просмотр видео'; end if;
  if (select count(*) from jsonb_to_recordset(choices) as x(phrase_id uuid,choice text)) <>
     (select count(distinct phrase_id) from jsonb_to_recordset(choices) as x(phrase_id uuid,choice text)) then
    raise exception 'Фразы повторяются';
  end if;
  for c in select * from jsonb_to_recordset(choices) as x(phrase_id uuid,choice text) order by phrase_id loop
    if not exists(select 1 from public.phrases where id=c.phrase_id and video_id=video and source='video') then
      raise exception 'Фраза не принадлежит видео';
    end if;
    results:=results || jsonb_build_array(public.decide_phrase(c.phrase_id,c.choice));
  end loop;
  update public.watched_videos set words_added=not exists(
    select 1 from public.phrases p left join public.phrase_decisions d on d.phrase_id=p.id
      where p.source='video' and p.video_id=video and d.phrase_id is null
  ) where video_id=video returning * into watched;
  return jsonb_build_object('results',results,'watched',to_jsonb(watched));
end $$;
revoke all on function public.decide_phrase(uuid,text) from public,anon;
revoke all on function public.choose_video_words(text,jsonb) from public,anon;
grant execute on function public.decide_phrase(uuid,text) to authenticated;
grant execute on function public.choose_video_words(text,jsonb) to authenticated;
