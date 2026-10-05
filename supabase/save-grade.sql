-- Оценка и активность сохраняются атомарно; UUID отличает повтор от новой оценки.
create table if not exists public.grade_operations (
  id uuid primary key,
  phrase_id uuid not null references public.phrases(id) on delete cascade,
  grade text not null check (grade in ('again','hard','good')),
  session_mode text not null check (session_mode in ('new','review','deck','video')),
  result jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.grade_operations enable row level security;
revoke all on public.grade_operations from public, anon, authenticated;
grant select, insert on public.grade_operations to authenticated;
drop policy if exists owner_operations on public.grade_operations;
create policy owner_operations on public.grade_operations for all to authenticated
  using (exists (select 1 from public.app_owner where user_id = (select auth.uid())))
  with check (exists (select 1 from public.app_owner where user_id = (select auth.uid())));

create or replace function public.save_grade_once(phrase uuid, grade text, session_mode text, operation_id uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  current_box integer;
  new_box integer;
  previous public.grade_operations;
  review_row public.reviews;
  activity_row public.activity;
  result jsonb;
  local_day date := (now() at time zone 'Asia/Bangkok')::date;
  intervals integer[] := array[0,1,2,4,7,15,30];
begin
  if not exists (select 1 from public.app_owner where user_id = auth.uid()) then raise exception 'Доступ запрещён'; end if;
  if operation_id is null then raise exception 'Не задан идентификатор операции'; end if;
  if grade is null or grade not in ('again','hard','good') then raise exception 'Неверная оценка'; end if;
  if session_mode is null or session_mode not in ('new','review','deck','video') then raise exception 'Неверный режим'; end if;
  -- После блокировки читаем актуальную ступень, а не устаревшую копию клиента.
  perform 1 from public.phrases where id = phrase for update;
  if not found then raise exception 'Фраза не найдена'; end if;
  select * into previous from public.grade_operations where id = operation_id;
  if found then
    if previous.phrase_id <> phrase or previous.grade <> grade or previous.session_mode <> session_mode then
      raise exception 'Идентификатор операции уже использован для другой оценки';
    end if;
    return previous.result;
  end if;
  select box into current_box from public.reviews where phrase_id = phrase for update;
  current_box := coalesce(current_box,0);
  new_box := case grade when 'again' then 0 when 'hard' then current_box else least(6,current_box+1) end;
  insert into public.reviews(phrase_id,box,due_date,updated_at)
    values(phrase,new_box,local_day+intervals[new_box+1],now())
    on conflict(phrase_id) do update set box=excluded.box,due_date=excluded.due_date,updated_at=excluded.updated_at
    returning * into review_row;
  insert into public.activity(day,did_review,did_new)
    values(local_day,session_mode not in ('new','video'),session_mode in ('new','video'))
    on conflict(day) do update set did_review=public.activity.did_review or excluded.did_review,
      did_new=public.activity.did_new or excluded.did_new
    returning * into activity_row;
  result := jsonb_build_object('review',to_jsonb(review_row),'activity',to_jsonb(activity_row));
  insert into public.grade_operations(id,phrase_id,grade,session_mode,result)
    values(operation_id,phrase,grade,session_mode,result);
  return result;
end $$;
revoke all on function public.save_grade_once(uuid,text,text,uuid) from public, anon;
grant execute on function public.save_grade_once(uuid,text,text,uuid) to authenticated;

-- Устаревший RPC с target_box не должен оставлять путь для потери прогресса.
do $$ begin
  if to_regprocedure('public.save_grade(uuid,text,integer,text)') is not null then
    revoke all on function public.save_grade(uuid,text,integer,text) from public, anon, authenticated;
  end if;
end $$;
