import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { clientAddress, RATE_RULES, withinRateLimits } from "./rate-limit";
import type { SessionUser } from "./session";
import type { Database } from "@/data/database";
import { getSupabaseEnv } from "@/env";

export type ReauthResult =
  | { ok: true; session: SupabaseClient<Database> }
  | { ok: false; reason: "invalid" | "rate_limited" | "unavailable" };

/**
 * Confirms the current password before a sensitive action (ASVS 5.0 7.5).
 * The check signs in on a separate, short-lived client, so the cookies of the
 * current session stay untouched. The returned session was created a moment
 * ago, which also satisfies the provider's "recent sign-in" rule; end it with
 * `endReauthSession` once the action is done.
 */
export async function confirmPassword(user: SessionUser, password: string): Promise<ReauthResult> {
  const allowed = await withinRateLimits([
    [RATE_RULES.reauthByAccount, user.id],
    [RATE_RULES.signInByAddress, await clientAddress()],
  ]);
  if (!allowed) return { ok: false, reason: "rate_limited" };

  const env = getSupabaseEnv();
  const session = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await session.auth.signInWithPassword({ email: user.email, password });

  if (error) {
    return { ok: false, reason: error.code === "invalid_credentials" ? "invalid" : "unavailable" };
  }
  // The password must belong to the account of this request, not just any account.
  if (data.user.id !== user.id) {
    await session.auth.signOut({ scope: "local" });
    return { ok: false, reason: "invalid" };
  }
  return { ok: true, session };
}

export async function endReauthSession(session: SupabaseClient<Database>): Promise<void> {
  // Already gone when the action ended every other session; nothing to report.
  await session.auth.signOut({ scope: "local" }).catch(() => undefined);
}
