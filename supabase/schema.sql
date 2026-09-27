-- Pitchpath database schema
-- Run this once in Supabase SQL Editor

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  age int,
  position text,
  height_cm int,
  weight_kg numeric,
  team text,
  league text,
  competition_level text,
  goals text,
  summary text,
  created_at timestamp with time zone default now()
);

create table calendar_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  type text not null, -- school | training | gym | match | individual
  title text,
  starts_at timestamp with time zone,
  duration_minutes int,
  notes text,
  created_at timestamp with time zone default now()
);

create table water_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  date date not null default current_date,
  amount_ml int not null,
  day_type text, -- rest | training | match
  goal_ml int,
  created_at timestamp with time zone default now()
);

create table sleep_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  date date not null default current_date,
  bedtime time,
  wake_time time,
  quality int, -- 1-5
  notes text
);

create table injuries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  body_area text,
  symptoms text,
  severity int,
  occurred_at date,
  status text default 'active', -- active | recovering | resolved
  notes text,
  created_at timestamp with time zone default now()
);

create table ai_conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  role text not null, -- user | assistant
  content text not null,
  created_at timestamp with time zone default now()
);

-- Row Level Security: every user only sees their own data
alter table profiles enable row level security;
alter table calendar_events enable row level security;
alter table water_logs enable row level security;
alter table sleep_logs enable row level security;
alter table injuries enable row level security;
alter table ai_conversations enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own events" on calendar_events for all using (auth.uid() = user_id);
create policy "own water" on water_logs for all using (auth.uid() = user_id);
create policy "own sleep" on sleep_logs for all using (auth.uid() = user_id);
create policy "own injuries" on injuries for all using (auth.uid() = user_id);
create policy "own chat" on ai_conversations for all using (auth.uid() = user_id);
