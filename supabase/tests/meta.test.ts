import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connect, withPersonas, type Session } from "./support/db";

// Tables readable by every account (none yet; the exercise catalog joins in E3).
// Listing a table here exempts it from the `owner_id` rule only.
const SHARED_TABLES: readonly string[] = [];

// API functions allowed to run with the privileges of their owner, each with a
// narrow purpose. Anything else elevated fails the suite.
const ELEVATED_FUNCTIONS: readonly string[] = [
  // Writes only to private.rate_limits; inputs are validated (rate-limits.test.ts).
  "consume_rate_limit",
];

// Each query returns the offending objects in `public`; an empty result passes.
const CHECKS = {
  "row level security is enabled and forced": `
    select c.relname as name
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
      and not (c.relrowsecurity and c.relforcerowsecurity)`,
  "every table has at least one policy": `
    select c.relname as name
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
      and not exists (select 1 from pg_policy p where p.polrelid = c.oid)`,
  "policies name their roles instead of applying to everyone": `
    select c.relname || '.' || p.polname as name
    from pg_policy p join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and 0 = any (p.polroles)`,
  "anonymous visitors have no access to tables": `
    select c.relname as name
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm')
      and (has_table_privilege('anon', c.oid, 'select, insert, update, delete, truncate')
        or has_any_column_privilege('anon', c.oid, 'select, insert, update'))`,
  "views run with the privileges of the caller": `
    select c.relname as name
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'v'
      and not coalesce(c.reloptions && array['security_invoker=true', 'security_invoker=on'], false)`,
  "API functions never run with elevated privileges": `
    select p.proname as name
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef and p.proname <> all ($1::text[])`,
  "private tables are owned through owner_id": `
    select c.relname as name
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
      and c.relname <> all ($1::text[])
      and not exists (
        select 1 from pg_attribute a
        where a.attrelid = c.oid and a.attname = 'owner_id' and a.attnotnull and not a.attisdropped
      )`,
} as const;

// Allowlists passed to the checks that take one.
const PARAMS: Partial<Record<keyof typeof CHECKS, unknown[]>> = {
  "API functions never run with elevated privileges": [ELEVATED_FUNCTIONS],
  "private tables are owned through owner_id": [SHARED_TABLES],
};

async function violations(session: Session, rule: keyof typeof CHECKS): Promise<string[]> {
  const sql = CHECKS[rule];
  const params = PARAMS[rule] ?? [];
  const result = await session.query<{ name: string }>(sql, params);
  return result.rows.map((row) => row.name).sort();
}

let client: pg.Client;

beforeAll(async () => {
  client = connect();
  await client.connect();
});

afterAll(async () => {
  await client.end();
});

describe("schema conventions", () => {
  for (const rule of Object.keys(CHECKS) as (keyof typeof CHECKS)[]) {
    it(rule, async () => {
      await withPersonas(client, async (session) => {
        expect(await violations(session, rule)).toEqual([]);
      });
    });
  }

  it("detects a table created without the conventions", async () => {
    await withPersonas(client, async (session) => {
      await session.query("create table public.probe_without_rls (id int primary key)");
      await session.query("grant select on public.probe_without_rls to anon");

      for (const rule of Object.keys(CHECKS) as (keyof typeof CHECKS)[]) {
        if (rule.startsWith("views") || rule.startsWith("API") || rule.startsWith("policies")) {
          continue;
        }
        expect(await violations(session, rule), rule).toContain("probe_without_rls");
      }
    });
  });

  it("detects a view that bypasses row level security", async () => {
    await withPersonas(client, async (session) => {
      await session.query("create view public.probe_view as select 1 as value");
      expect(await violations(session, "views run with the privileges of the caller")).toContain(
        "probe_view",
      );
    });
  });

  it("detects an elevated function that was not reviewed", async () => {
    await withPersonas(client, async (session) => {
      await session.query(
        "create function public.probe_elevated() returns int language sql security definer as 'select 1'",
      );
      expect(await violations(session, "API functions never run with elevated privileges")).toEqual(
        ["probe_elevated"],
      );
    });
  });
});
