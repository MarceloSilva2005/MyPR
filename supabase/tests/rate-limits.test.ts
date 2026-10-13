import type pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { connect, personaA, withPersonas, type Session } from "./support/db";

const INVALID_PARAMETER = "22023";
const PERMISSION_DENIED = "42501";
const UNDEFINED_TABLE = "42P01";

const bucketA = "a".repeat(64);
const bucketB = "b".repeat(64);

async function consume(db: Session, bucket: string, max = 3, window = 60): Promise<boolean> {
  const { rows } = await db.query<{ allowed: boolean }>(
    "select public.consume_rate_limit($1, $2, $3) as allowed",
    [bucket, max, window],
  );
  return rows[0]?.allowed ?? false;
}

let client: pg.Client;

beforeAll(async () => {
  client = connect();
  await client.connect();
});

afterAll(async () => {
  await client.end();
});

describe("consume_rate_limit", () => {
  it("allows attempts up to the limit and refuses the next one", async () => {
    await withPersonas(client, async (db) => {
      await db.as("anon");
      const results = [];
      for (let attempt = 0; attempt < 4; attempt++) results.push(await consume(db, bucketA));
      expect(results).toEqual([true, true, true, false]);
    });
  });

  it("counts each bucket separately", async () => {
    await withPersonas(client, async (db) => {
      await db.as("anon");
      for (let attempt = 0; attempt < 3; attempt++) await consume(db, bucketA);
      expect(await consume(db, bucketA)).toBe(false);
      expect(await consume(db, bucketB)).toBe(true);
    });
  });

  it("is available to signed-in accounts as well", async () => {
    await withPersonas(client, async (db) => {
      await db.as(personaA);
      expect(await consume(db, bucketA)).toBe(true);
    });
  });

  it("stores only the digest, never an address or e-mail", async () => {
    await withPersonas(client, async (db) => {
      await db.as("anon");
      await db.rejects(
        "select public.consume_rate_limit($1, 3, 60)",
        ["203.0.113.7"],
        INVALID_PARAMETER,
      );
      await db.rejects(
        "select public.consume_rate_limit($1, 3, 60)",
        ["persona-a@example.test"],
        INVALID_PARAMETER,
      );
    });
  });

  it("rejects limits and windows outside the supported range", async () => {
    await withPersonas(client, async (db) => {
      await db.as("anon");
      for (const [max, window] of [
        [0, 60],
        [10001, 60],
        [3, 0],
        [3, 86401],
      ]) {
        await db.rejects(
          "select public.consume_rate_limit($1, $2, $3)",
          [bucketA, max, window],
          INVALID_PARAMETER,
        );
      }
    });
  });

  it("keeps the counters out of reach of the API roles", async () => {
    await withPersonas(client, async (db) => {
      await db.as("anon");
      await db.rejects("select * from private.rate_limits", [], PERMISSION_DENIED);
      await db.as(personaA);
      await db.rejects("delete from private.rate_limits", [], PERMISSION_DENIED);
      await db.rejects("select * from public.rate_limits", [], UNDEFINED_TABLE);
    });
  });
});
