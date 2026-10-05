-- Оценка и активность сохраняются в одной транзакции.
create or replace function public.save_grade(phrase uuid, grade text, target_box integer, session_mode text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  new_box integer;
  review_row public.reviews;
  activity_row public.activity;
  local_day date := (now() at time zone 'Asia/Bangkok')::date;
  intervals integer[] := array[0,1,2,4,7,15,30];
begin
  if not exists (select 1 from public.app_owner where user_id = auth.uid()) then raise exception 'Доступ запрещён'; end if;
  if grade is null or grade not in ('again','hard','good') then raise exception 'Неверная оценка'; end if;
  if session_mode is null or session_mode not in ('new','review','deck','video') then raise exception 'Неверный режим'; end if;
  -- Блокировка фразы сериализует оценки с разных устройств.
  perform 1 from public.phrases where id = phrase for update;
  if not found then raise exception 'Фраза не найдена'; end if;
  if target_box is null or target_box < 0 or target_box > 6 or (grade = 'again' and target_box <> 0) then raise exception 'Неверная ступень'; end if;
  new_box := target_box;
  insert into public.reviews(phrase_id,box,due_date,updated_at)
    values(phrase,new_box,local_day+intervals[new_box+1],now())
    on conflict(phrase_id) do update set box=excluded.box,due_date=excluded.due_date,updated_at=excluded.updated_at
    returning * into review_row;
  insert into public.activity(day,did_review,did_new)
    values(local_day,session_mode not in ('new','video'),session_mode in ('new','video'))
    on conflict(day) do update set did_review=public.activity.did_review or excluded.did_review,
      did_new=public.activity.did_new or excluded.did_new
    returning * into activity_row;
  return jsonb_build_object('review',to_jsonb(review_row),'activity',to_jsonb(activity_row));
end $$;
revoke all on function public.save_grade(uuid,text,integer,text) from public, anon;
grant execute on function public.save_grade(uuid,text,integer,text) to authenticated;
