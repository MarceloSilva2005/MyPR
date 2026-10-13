-- One profile per account: display name, preferences and onboarding progress.
-- Created by a trigger when the account is created, removed with the account.

create table public.profiles (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null
    check (char_length(btrim(display_name)) between 1 and 60),
  weight_unit text not null default 'kg'
    check (weight_unit in ('kg', 'lb')),
  theme text not null default 'system'
    check (theme in ('system', 'light', 'dark')),
  -- 0 = Sunday ... 6 = Saturday.
  week_starts_on smallint not null default 1
    check (week_starts_on between 0 and 6),
  time_zone text not null default 'America/Sao_Paulo'
    check (private.is_time_zone(time_zone)),
  default_rest_seconds integer not null default 120
    check (default_rest_seconds between 0 and 1800),
  -- Stored in kg like every load (decision D-20).
  load_increment_kg numeric(9, 4) not null default 2.5
    check (load_increment_kg > 0 and load_increment_kg <= 50),
  training_goal text
    check (training_goal in ('hypertrophy', 'strength', 'general_fitness')),
  experience_level text
    check (experience_level in ('beginner', 'intermediate', 'advanced')),
  -- Last onboarding step the person reached, so an interrupted onboarding resumes.
  onboarding_step smallint not null default 1
    check (onboarding_step between 1 and 5),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Display name, preferences and onboarding state of one account.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (owner_id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- No insert or delete policy: rows follow the lifecycle of the account.
grant select on public.profiles to authenticated;
grant update (
  display_name,
  weight_unit,
  theme,
  week_starts_on,
  time_zone,
  default_rest_seconds,
  load_increment_kg,
  training_goal,
  experience_level,
  onboarding_step,
  onboarding_completed_at
) on public.profiles to authenticated;

-- Creates the profile together with the account. The display name comes from
-- the sign-up form; the local part of the e-mail is the fallback.
create function private.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested text := btrim(coalesce(new.raw_user_meta_data ->> 'display_name', ''));
begin
  if requested = '' then
    requested := split_part(coalesce(new.email, ''), '@', 1);
  end if;
  if requested = '' then
    requested := 'Atleta';
  end if;

  insert into public.profiles (owner_id, display_name)
  values (new.id, left(requested, 60));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.create_profile_for_new_user();
