import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connect, personaA, personaB, withPersonas } from "./support/db";

const PERMISSION_DENIED = "42501";
const CHECK_VIOLATION = "23514";

let client: pg.Client;

beforeAll(async () => {
  client = connect();
  await client.connect();
});

afterAll(async () => {
  await client.end();
});

describe("profiles", () => {
  it("is created with the account using sensible defaults", async () => {
    await withPersonas(client, async (db) => {
      await db.as(personaA);
      const { rows } = await db.query("select * from public.profiles");

      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        owner_id: personaA.id,
        display_name: "persona-a",
        weight_unit: "kg",
        theme: "system",
        week_starts_on: 1,
        time_zone: "America/Sao_Paulo",
        onboarding_step: 1,
        onboarding_completed_at: null,
      });
    });
  });

  it("takes the display name chosen at sign-up", async () => {
    await withPersonas(client, async (db) => {
      await db.query(
        `insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data)
         values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(),
                 'authenticated', 'authenticated', 'named@example.test', $1)
         returning id`,
        [JSON.stringify({ display_name: "  Marcelo  " })],
      );
      const { rows } = await db.query(
        `select p.display_name from public.profiles p
         join auth.users u on u.id = p.owner_id where u.email = 'named@example.test'`,
      );
      expect(rows[0]).toEqual({ display_name: "Marcelo" });
    });
  });

  it("lets the owner update their preferences", async () => {
    await withPersonas(client, async (db) => {
      await db.as(personaA);
      const result = await db.query(
        "update public.profiles set weight_unit = 'lb', theme = 'dark' where owner_id = $1",
        [personaA.id],
      );
      expect(result.rowCount).toBe(1);
    });
  });

  it("hides other accounts from a listing", async () => {
    await withPersonas(client, async (db) => {
      await db.as(personaB);
      const { rows } = await db.query<{ owner_id: string }>("select owner_id from public.profiles");
      expect(rows.map((row) => row.owner_id)).toEqual([personaB.id]);
    });
  });

  it("does not return another account even when asked by id", async () => {
    await withPersonas(client, async (db) => {
      await db.as(personaA);
      const { rows } = await db.query("select * from public.profiles where owner_id = $1", [
        personaB.id,
      ]);
      expect(rows).toEqual([]);
    });
  });

  it("does not let one account change another", async () => {
    await withPersonas(client, async (db) => {
      await db.as(personaA);
      const result = await db.query(
        "update public.profiles set display_name = 'Invasor' where owner_id = $1",
        [personaB.id],
      );
      expect(result.rowCount).toBe(0);

      await db.as("admin");
      const { rows } = await db.query(
        "select display_name from public.profiles where owner_id = $1",
        [personaB.id],
      );
      expect(rows[0]).toEqual({ display_name: "persona-b" });
    });
  });

  it("does not let the owner reassign the profile to another account", async () => {
    await withPersonas(client, async (db) => {
      await db.as(personaA);
      await db.rejects(
        "update public.profiles set owner_id = $1 where owner_id = $2",
        [personaB.id, personaA.id],
        PERMISSION_DENIED,
      );
    });
  });

  it("does not let the owner forge timestamps", async () => {
    await withPersonas(client, async (db) => {
      await db.as(personaA);
      await db.rejects(
        "update public.profiles set created_at = now() - interval '1 year' where owner_id = $1",
        [personaA.id],
        PERMISSION_DENIED,
      );
    });
  });

  it("does not let accounts create or delete profiles directly", async () => {
    await withPersonas(client, async (db) => {
      await db.as(personaA);
      await db.rejects(
        "insert into public.profiles (owner_id, display_name) values ($1, 'Outro')",
        [personaB.id],
        PERMISSION_DENIED,
      );
      await db.rejects(
        "delete from public.profiles where owner_id = $1",
        [personaA.id],
        PERMISSION_DENIED,
      );
    });
  });

  it("is invisible to anonymous visitors", async () => {
    await withPersonas(client, async (db) => {
      await db.as("anon");
      await db.rejects("select * from public.profiles", [], PERMISSION_DENIED);
    });
  });

  it("rejects values outside the allowed ranges", async () => {
    await withPersonas(client, async (db) => {
      await db.as(personaA);
      const invalid = [
        "weight_unit = 'stone'",
        "theme = 'neon'",
        "week_starts_on = 7",
        "time_zone = 'Mars/Olympus_Mons'",
        "default_rest_seconds = -1",
        "load_increment_kg = 0",
        "display_name = '   '",
        "onboarding_step = 6",
        "training_goal = 'diagnosis'",
      ];
      for (const assignment of invalid) {
        await db.rejects(
          `update public.profiles set ${assignment} where owner_id = $1`,
          [personaA.id],
          CHECK_VIOLATION,
        );
      }
    });
  });

  it("is removed together with the account", async () => {
    await withPersonas(client, async (db) => {
      await db.query("delete from auth.users where id = $1", [personaA.id]);
      const { rows } = await db.query("select 1 from public.profiles where owner_id = $1", [
        personaA.id,
      ]);
      expect(rows).toEqual([]);
    });
  });
});
