-- Reads a rate limit counter without counting an attempt. Used to decide
-- whether sign-in asks for the human check after repeated failures.

create function public.peek_rate_limit(
  bucket text,
  window_seconds integer
)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_window timestamptz;
  total integer;
begin
  if bucket is null or bucket !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid bucket' using errcode = '22023';
  end if;
  if window_seconds is null or window_seconds not between 1 and 86400 then
    raise exception 'invalid window' using errcode = '22023';
  end if;

  current_window := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / window_seconds) * window_seconds
  );

  select limits.hits into total
  from private.rate_limits as limits
  where limits.bucket = peek_rate_limit.bucket and limits.window_start = current_window;

  return coalesce(total, 0);
end;
$$;

comment on function public.peek_rate_limit(text, integer) is
  'Returns the attempts counted in the current window without counting a new one.';

grant execute on function public.peek_rate_limit(text, integer) to anon, authenticated;
