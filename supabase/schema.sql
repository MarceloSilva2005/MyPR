create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lb')),
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  updated_at timestamptz not null default now()
);

create table if not exists public.exercises (
  id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  muscle_group text check (muscle_group is null or char_length(muscle_group) <= 80),
  source text not null check (source in ('default', 'custom')),
  archived_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (user_id, id)
);

create table if not exists public.workouts (
  id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  performed_at date not null,
  status text not null check (status in ('draft', 'in_progress', 'completed')),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  primary key (user_id, id)
);

create table if not exists public.workout_exercises (
  id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id uuid not null,
  exercise_id uuid not null,
  position integer not null check (position between 0 and 1000),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  primary key (user_id, id),
  foreign key (user_id, workout_id) references public.workouts(user_id, id) on delete cascade,
  foreign key (user_id, exercise_id) references public.exercises(user_id, id)
);

create table if not exists public.set_entries (
  id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_exercise_id uuid not null,
  position integer not null check (position between 0 and 1000),
  reps integer not null check (reps between 0 and 10000),
  load_kg numeric(10,2) not null check (load_kg between 0 and 100000),
  completed boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  primary key (user_id, id),
  foreign key (user_id, workout_exercise_id)
    references public.workout_exercises(user_id, id) on delete cascade
);

create index if not exists exercises_user_id_idx on public.exercises(user_id);
create index if not exists workouts_user_date_idx on public.workouts(user_id, performed_at desc);
create index if not exists workout_exercises_workout_idx on public.workout_exercises(user_id, workout_id, position);
create index if not exists set_entries_workout_exercise_idx on public.set_entries(user_id, workout_exercise_id, position);

alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.set_entries enable row level security;

alter table public.profiles force row level security;
alter table public.exercises force row level security;
alter table public.workouts force row level security;
alter table public.workout_exercises force row level security;
alter table public.set_entries force row level security;

drop policy if exists "profiles_owner_all" on public.profiles;
drop policy if exists "exercises_owner_all" on public.exercises;
drop policy if exists "workouts_owner_all" on public.workouts;
drop policy if exists "workout_exercises_owner_all" on public.workout_exercises;
drop policy if exists "set_entries_owner_all" on public.set_entries;

create policy "profiles_owner_all" on public.profiles
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "exercises_owner_all" on public.exercises
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workouts_owner_all" on public.workouts
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workout_exercises_owner_all" on public.workout_exercises
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "set_entries_owner_all" on public.set_entries
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
