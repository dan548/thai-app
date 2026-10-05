-- Thai Trainer — схема БД. По умолчанию клиентский доступ закрыт.
-- Выполни этот файл в SQL Editor нового проекта Supabase (или через /setup).

create table if not exists phrases (
  id uuid primary key default gen_random_uuid(),
  ru text not null,
  th text not null,
  tr text not null,
  deck text not null check (deck in ('base','num','coffee','resto','shop','market','massage')),
  source text not null default 'seed',        -- 'seed' | 'chat' | 'manual' | 'video'
  hidden boolean not null default false,
  video_id text,                              -- id ролика, если source='video'
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  phrase_id uuid primary key references phrases(id) on delete cascade,
  box int not null default 0,
  due_date date not null default current_date,
  updated_at timestamptz not null default now()
);

create table if not exists activity (
  day date primary key,
  did_review boolean not null default false,
  did_new boolean not null default false
);

create table if not exists watched_videos (
  video_id text primary key,
  words_added boolean not null default false,
  watched_at timestamptz not null default now()
);

-- RLS: доступ закрыт до назначения владельца через secure-owner.sql.
alter table phrases enable row level security;
alter table reviews enable row level security;
alter table activity enable row level security;
alter table watched_videos enable row level security;

drop policy if exists allow_all_phrases on phrases;
drop policy if exists allow_all_reviews on reviews;
drop policy if exists allow_all_activity on activity;
drop policy if exists allow_all_watched on watched_videos;
revoke all on phrases, reviews, activity, watched_videos from anon, authenticated;
