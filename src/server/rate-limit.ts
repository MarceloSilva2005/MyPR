import "server-only";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";

import { createSupabaseServerClient } from "./supabase";
import { getSupabaseEnv } from "@/env";

interface RateRule {
  readonly name: string;
  readonly max: number;
  readonly windowSeconds: number;
}

// Limits for public handlers. The auth provider applies its own limits as
// well; these stop abuse before it reaches the provider and work per person.
export const RATE_RULES = {
  signInByAddress: { name: "sign-in:ip", max: 20, windowSeconds: 5 * 60 },
  signInByEmail: { name: "sign-in:email", max: 10, windowSeconds: 15 * 60 },
  signUpByAddress: { name: "sign-up:ip", max: 5, windowSeconds: 60 * 60 },
  emailByAddress: { name: "email:ip", max: 5, windowSeconds: 15 * 60 },
  emailByRecipient: { name: "email:to", max: 3, windowSeconds: 60 * 60 },
  reauthByAccount: { name: "reauth:account", max: 5, windowSeconds: 15 * 60 },
  // Failed sign-ins; past `max`, sign-in asks for the human check.
  signInFailuresByEmail: { name: "sign-in-failed:email", max: 3, windowSeconds: 15 * 60 },
  signInFailuresByAddress: { name: "sign-in-failed:ip", max: 3, windowSeconds: 15 * 60 },
} as const satisfies Record<string, RateRule>;

/**
 * Digest that identifies a subject within a rule without revealing it.
 * Keyed with a server secret, so nobody else can compute someone's bucket.
 */
export function rateBucket(rule: RateRule, subject: string, secret: string): string {
  return createHmac("sha256", secret).update(`${rule.name}\n${subject}`).digest("hex");
}

/** Client address as reported by the hosting proxy. */
export async function clientAddress(): Promise<string> {
  const list = await headers();
  const forwarded = list.get("x-forwarded-for")?.split(",")[0]?.trim();
  return list.get("x-real-ip") ?? (forwarded === "" ? undefined : forwarded) ?? "unknown";
}

/**
 * Counts one attempt for every rule and answers whether all are within their
 * limits. If the limiter itself fails, the request goes through: a database
 * hiccup must not lock everyone out, and the provider limits still apply.
 */
export async function withinRateLimits(
  checks: readonly (readonly [RateRule, string])[],
): Promise<boolean> {
  const { RATE_LIMIT_SECRET } = getSupabaseEnv();
  const supabase = await createSupabaseServerClient();

  const results = await Promise.all(
    checks.map(async ([rule, subject]) => {
      const { data, error } = await supabase.rpc("consume_rate_limit", {
        bucket: rateBucket(rule, subject, RATE_LIMIT_SECRET),
        max_hits: rule.max,
        window_seconds: rule.windowSeconds,
      });
      return error ? true : data;
    }),
  );
  return results.every(Boolean);
}

/**
 * Whether any of the counters already reached its limit, without counting a
 * new attempt. Fails open like the limiter: the check is a deterrent on top of
 * the limits that still apply.
 */
export async function anyLimitReached(
  checks: readonly (readonly [RateRule, string])[],
): Promise<boolean> {
  const { RATE_LIMIT_SECRET } = getSupabaseEnv();
  const supabase = await createSupabaseServerClient();

  const results = await Promise.all(
    checks.map(async ([rule, subject]) => {
      const { data, error } = await supabase.rpc("peek_rate_limit", {
        bucket: rateBucket(rule, subject, RATE_LIMIT_SECRET),
        window_seconds: rule.windowSeconds,
      });
      return !error && data >= rule.max;
    }),
  );
  return results.some(Boolean);
}
