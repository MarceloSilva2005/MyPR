create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lb')),
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  updated_at timestamptz not null default now()
);

create table if not exists public.exercises (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  muscle_group text,
  source text not null check (source in ('default', 'custom')),
  archived_at timestamptz,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.workouts (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  performed_at date not null,
  status text not null check (status in ('draft', 'in_progress', 'completed')),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table if not exists public.workout_exercises (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  position integer not null check (position >= 0),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table if not exists public.set_entries (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  position integer not null check (position >= 0),
  reps integer not null check (reps >= 0),
  load_kg numeric(8,2) not null check (load_kg >= 0),
  completed boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create index if not exists exercises_user_id_idx on public.exercises(user_id);
create index if not exists workouts_user_date_idx on public.workouts(user_id, performed_at desc);
create index if not exists workout_exercises_workout_idx on public.workout_exercises(workout_id, position);
create index if not exists set_entries_workout_exercise_idx on public.set_entries(workout_exercise_id, position);

alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.set_entries enable row level security;

create policy "profiles_owner_all" on public.profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "exercises_owner_all" on public.exercises for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workouts_owner_all" on public.workouts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workout_exercises_owner_all" on public.workout_exercises for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "set_entries_owner_all" on public.set_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
