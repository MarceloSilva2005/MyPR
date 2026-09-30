begin;

-- Remove as FKs antigas baseadas apenas em id.
alter table public.set_entries
  drop constraint if exists set_entries_workout_exercise_id_fkey;
alter table public.workout_exercises
  drop constraint if exists workout_exercises_workout_id_fkey,
  drop constraint if exists workout_exercises_exercise_id_fkey;

-- Permite que o mesmo UUID de exercício padrão exista para usuários diferentes.
alter table public.set_entries drop constraint if exists set_entries_pkey;
alter table public.workout_exercises drop constraint if exists workout_exercises_pkey;
alter table public.workouts drop constraint if exists workouts_pkey;
alter table public.exercises drop constraint if exists exercises_pkey;

alter table public.exercises add constraint exercises_pkey primary key (user_id, id);
alter table public.workouts add constraint workouts_pkey primary key (user_id, id);
alter table public.workout_exercises add constraint workout_exercises_pkey primary key (user_id, id);
alter table public.set_entries add constraint set_entries_pkey primary key (user_id, id);

alter table public.workout_exercises
  add constraint workout_exercises_workout_owner_fkey
    foreign key (user_id, workout_id)
    references public.workouts(user_id, id)
    on delete cascade,
  add constraint workout_exercises_exercise_owner_fkey
    foreign key (user_id, exercise_id)
    references public.exercises(user_id, id);

alter table public.set_entries
  add constraint set_entries_workout_exercise_owner_fkey
    foreign key (user_id, workout_exercise_id)
    references public.workout_exercises(user_id, id)
    on delete cascade;

alter table public.profiles
  add constraint profiles_display_name_length_check
    check (char_length(display_name) <= 80) not valid;
alter table public.exercises
  add constraint exercises_name_length_check
    check (char_length(trim(name)) between 1 and 120) not valid,
  add constraint exercises_muscle_group_length_check
    check (muscle_group is null or char_length(muscle_group) <= 80) not valid;
alter table public.workout_exercises
  add constraint workout_exercises_position_security_check
    check (position between 0 and 1000) not valid;
alter table public.set_entries
  add constraint set_entries_position_security_check
    check (position between 0 and 1000) not valid,
  add constraint set_entries_reps_security_check
    check (reps between 0 and 10000) not valid,
  add constraint set_entries_load_security_check
    check (load_kg between 0 and 100000) not valid;

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

commit;
