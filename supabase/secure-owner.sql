-- Выполнить после создания владельца в Authentication → Users.
-- ВАЖНО: перед запуском замени owner_email ниже на email владельца (/setup делает это сам).
-- Перед выполнением экспортировать четыре таблицы (см. docs/security.md).
begin;

create table if not exists public.app_owner (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null unique references auth.users(id)
);
alter table public.app_owner enable row level security;
revoke all on public.app_owner from anon, authenticated;
grant select on public.app_owner to authenticated;
drop policy if exists owner_can_read on public.app_owner;
create policy owner_can_read on public.app_owner for select to authenticated
  using (user_id = (select auth.uid()));

do $$
declare
  owner_email constant text := 'owner@example.com'; -- ← email владельца
  owner_id uuid;
begin
  select id into owner_id from auth.users where lower(email) = lower(owner_email);
  if owner_id is null then
    raise exception 'Сначала создайте владельца % в Authentication → Users (и подставьте его email в owner_email)', owner_email;
  end if;
  if exists (select 1 from public.app_owner where user_id <> owner_id) then
    raise exception 'Владелец уже задан; автоматическая замена запрещена';
  end if;
  insert into public.app_owner (singleton, user_id) values (true, owner_id)
    on conflict (singleton) do nothing;
end $$;

do $$
declare t text; p record;
begin
  foreach t in array array['phrases','reviews','activity','watched_videos'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    -- Старые permissive-политики объединяются через OR: удалить их все.
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy %I on public.%I', p.policyname, t);
    end loop;
    execute format('create policy owner_access on public.%I for all to authenticated
      using (exists (select 1 from public.app_owner where user_id = (select auth.uid())))
      with check (exists (select 1 from public.app_owner where user_id = (select auth.uid())))', t);
  end loop;
end $$;
commit;
