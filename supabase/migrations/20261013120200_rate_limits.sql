-- Fixed-window rate limiting kept in Postgres (decision D-22): no extra
-- provider, shared by every server instance.
--
-- Buckets are HMAC digests computed by the server with a secret, so the table
-- never stores IP addresses or e-mails, and a caller who does not know the
-- secret cannot target someone else's bucket.

create table private.rate_limits (
  bucket text not null check (bucket ~ '^[0-9a-f]{64}$'),
  window_start timestamptz not null,
  hits integer not null check (hits > 0),
  primary key (bucket, window_start)
);

-- Counts one attempt and answers whether it is still within the limit.
-- Callable through the API by the server, which uses the publishable key for
-- requests made before sign-in. It touches nothing but its own table.
create function public.consume_rate_limit(
  bucket text,
  max_hits integer,
  window_seconds integer
)
returns boolean
language plpgsql
volatile
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
  if max_hits is null or max_hits not between 1 and 10000 then
    raise exception 'invalid limit' using errcode = '22023';
  end if;
  if window_seconds is null or window_seconds not between 1 and 86400 then
    raise exception 'invalid window' using errcode = '22023';
  end if;

  current_window := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / window_seconds) * window_seconds
  );

  insert into private.rate_limits as limits (bucket, window_start, hits)
  values (consume_rate_limit.bucket, current_window, 1)
  on conflict on constraint rate_limits_pkey
    do update set hits = limits.hits + 1
  returning limits.hits into total;

  -- Expired windows are cleared opportunistically; no scheduler needed.
  if random() < 0.01 then
    delete from private.rate_limits where window_start < clock_timestamp() - interval '1 day';
  end if;

  return total <= max_hits;
end;
$$;

comment on function public.consume_rate_limit(text, integer, integer) is
  'Counts one attempt in a fixed window and returns whether it is within the limit.';

grant execute on function public.consume_rate_limit(text, integer, integer) to anon, authenticated;
