import pg from "pg";

// Local stack defaults from `supabase start`. CI uses the same stack.
const DEFAULT_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

export interface Persona {
  readonly id: string;
  readonly email: string;
}

export const personaA: Persona = {
  id: "00000000-0000-4000-8000-00000000000a",
  email: "persona-a@example.test",
};

export const personaB: Persona = {
  id: "00000000-0000-4000-8000-00000000000b",
  email: "persona-b@example.test",
};

type Role = Persona | "anon" | "admin";

export interface Session {
  /** Runs `sql` as the current role. */
  query<Row extends pg.QueryResultRow = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<pg.QueryResult<Row>>;
  /** Switches the role for the following queries, as an API request would. */
  as(role: Role): Promise<void>;
  /** Asserts that `sql` fails with the given SQLSTATE and keeps the transaction usable. */
  rejects(sql: string, params: unknown[], code: string): Promise<void>;
}

export function connect(): pg.Client {
  return new pg.Client({ connectionString: process.env["DB_TEST_URL"] ?? DEFAULT_URL });
}

/**
 * Runs `body` inside a transaction that is always rolled back, with personas A
 * and B created as confirmed accounts. Each test starts from a clean database.
 */
export async function withPersonas(
  client: pg.Client,
  body: (session: Session) => Promise<void>,
): Promise<void> {
  await client.query("begin");
  try {
    for (const persona of [personaA, personaB]) {
      await createAccount(client, persona);
    }

    let savepoint = 0;
    const session: Session = {
      query: (sql, params) => client.query(sql, params),
      as: (role) => switchRole(client, role),
      async rejects(sql, params, code) {
        const name = `attempt_${String(++savepoint)}`;
        await client.query(`savepoint ${name}`);
        let caught: unknown;
        try {
          await client.query(sql, params);
        } catch (error) {
          caught = error;
        }
        await client.query(`rollback to savepoint ${name}`);
        const actual = (caught as { code?: string } | undefined)?.code;
        if (actual !== code) {
          throw new Error(`Expected SQLSTATE ${code}, got ${actual ?? "success"}: ${sql}`);
        }
      },
    };

    await body(session);
  } finally {
    await client.query("rollback");
  }
}

async function createAccount(client: pg.Client, persona: Persona): Promise<void> {
  await client.query(
    `insert into auth.users (
       instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       raw_app_meta_data, raw_user_meta_data, created_at, updated_at
     ) values (
       '00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', $2, '',
       now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()
     )`,
    [persona.id, persona.email],
  );
}

async function switchRole(client: pg.Client, role: Role): Promise<void> {
  await client.query("reset role");
  if (role === "admin") return;

  if (role === "anon") {
    await client.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ role: "anon" }),
    ]);
    await client.query("set local role anon");
    return;
  }

  await client.query("select set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({ sub: role.id, role: "authenticated", email: role.email }),
  ]);
  await client.query("set local role authenticated");
}
