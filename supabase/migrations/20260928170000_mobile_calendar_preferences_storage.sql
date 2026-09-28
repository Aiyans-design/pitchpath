create table if not exists public.recurring_calendar_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type text not null,
  weekday smallint not null check (weekday between 0 and 6),
  local_time time not null,
  duration_minutes integer not null check (duration_minutes > 0 and duration_minutes <= 600),
  start_date date not null default current_date,
  end_date date,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists recurring_calendar_rules_user_id_idx on public.recurring_calendar_rules(user_id);
alter table public.recurring_calendar_rules enable row level security;

drop policy if exists "users manage own recurring rules" on public.recurring_calendar_rules;
create policy "users manage own recurring rules" on public.recurring_calendar_rules for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists public.player_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_gym_weekday smallint check (preferred_gym_weekday between 0 and 6),
  preferred_training_days smallint[] default '{}',
  wake_buffer_minutes integer,
  timezone text,
  language text not null default 'en',
  theme text not null default 'system',
  ai_preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.player_preferences enable row level security;
drop policy if exists "users manage own preferences" on public.player_preferences;
create policy "users manage own preferences" on public.player_preferences for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  scheduled_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_id_scheduled_at_idx on public.notifications(user_id, scheduled_at);
alter table public.notifications enable row level security;
drop policy if exists "users manage own notifications" on public.notifications;
create policy "users manage own notifications" on public.notifications for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public) values ('player-photos', 'player-photos', true) on conflict (id) do nothing;
drop policy if exists "users upload own player photos" on storage.objects;
create policy "users upload own player photos" on storage.objects for insert to authenticated with check (bucket_id = 'player-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "users update own player photos" on storage.objects;
create policy "users update own player photos" on storage.objects for update to authenticated using (bucket_id = 'player-photos' and (storage.foldername(name))[1] = (select auth.uid())::text) with check (bucket_id = 'player-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "users delete own player photos" on storage.objects;
create policy "users delete own player photos" on storage.objects for delete to authenticated using (bucket_id = 'player-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
