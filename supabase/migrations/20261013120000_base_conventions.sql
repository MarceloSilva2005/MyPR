-- Base conventions shared by every migration.
--
-- 1. Nothing is granted implicitly. Each table states which role may do what,
--    and row level security decides which rows.
-- 2. Helpers that must not be callable through the API live in `private`.
-- 3. Every private table has `owner_id`, forced row level security and one
--    policy per operation. supabase/tests/meta.test.ts enforces this.

-- Supabase grants everything on new objects in `public` to the API roles by
-- default. Revoke that so a forgotten grant fails closed instead of open.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Keeps `updated_at` truthful regardless of what the client sends.
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- True when `zone` is an IANA time zone name known to the server.
create function private.is_time_zone(zone text)
returns boolean
language plpgsql
stable
set search_path = ''
as $$
begin
  perform now() at time zone zone;
  return true;
exception
  when invalid_parameter_value then
    return false;
end;
$$;
