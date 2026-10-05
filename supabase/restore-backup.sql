-- Выполнить после secure-owner.sql. SECURITY INVOKER сохраняет проверки RLS.
create or replace function public.restore_backup(backup jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if not exists (select 1 from public.app_owner where user_id = auth.uid()) then
    raise exception 'Доступ запрещён';
  end if;
  if backup->>'format' is distinct from 'thai-trainer' or backup->>'version' is distinct from '1'
    or jsonb_typeof(backup->'phrases') is distinct from 'array'
    or jsonb_typeof(backup->'reviews') is distinct from 'array'
    or jsonb_typeof(backup->'activity') is distinct from 'array'
    or jsonb_typeof(backup->'watched_videos') is distinct from 'array' then
    raise exception 'Неверный формат копии';
  end if;
  insert into public.phrases
    select * from jsonb_populate_recordset(null::public.phrases, backup->'phrases')
    on conflict (id) do update set ru=excluded.ru, th=excluded.th, tr=excluded.tr,
      deck=excluded.deck, source=excluded.source, hidden=excluded.hidden,
      video_id=excluded.video_id, created_at=excluded.created_at;
  if exists (select 1 from jsonb_populate_recordset(null::public.reviews, backup->'reviews') r
    where r.box < 0 or r.box > 6) then raise exception 'Неверная ступень SRS'; end if;
  insert into public.reviews
    select * from jsonb_populate_recordset(null::public.reviews, backup->'reviews')
    on conflict (phrase_id) do update set box=excluded.box, due_date=excluded.due_date, updated_at=excluded.updated_at;
  insert into public.activity
    select * from jsonb_populate_recordset(null::public.activity, backup->'activity')
    on conflict (day) do update set did_review=excluded.did_review, did_new=excluded.did_new;
  insert into public.watched_videos
    select * from jsonb_populate_recordset(null::public.watched_videos, backup->'watched_videos')
    on conflict (video_id) do update set words_added=excluded.words_added, watched_at=excluded.watched_at;
end $$;
revoke all on function public.restore_backup(jsonb) from public, anon;
grant execute on function public.restore_backup(jsonb) to authenticated;
