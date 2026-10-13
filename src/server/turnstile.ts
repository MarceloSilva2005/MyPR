import "server-only";

import { getSupabaseEnv } from "@/env";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Name of the field the Turnstile widget adds to the form. */
export const TURNSTILE_FIELD = "cf-turnstile-response";

/** Where the check is used. The widget sends it back, so a token only works where it was issued. */
export type HumanCheckAction = "sign-up" | "sign-in" | "password-reset";

export type HumanCheckResult = "passed" | "missing" | "failed" | "unavailable";

interface SiteverifyResponse {
  success: boolean;
  action?: string;
  "error-codes"?: string[];
}

/**
 * Verifies a Turnstile token with Cloudflare (ASVS 5.0 6.3: anti-automation on
 * public sign-up, recovery and repeated sign-in). Tokens are single use and
 * tied to the action the widget was rendered for.
 */
export async function verifyHuman(
  token: FormDataEntryValue | null,
  action: HumanCheckAction,
  remoteIp: string,
  send: typeof fetch = fetch,
): Promise<HumanCheckResult> {
  if (typeof token !== "string" || token === "" || token.length > 2048) return "missing";

  const body = new URLSearchParams({
    secret: getSupabaseEnv().TURNSTILE_SECRET_KEY,
    response: token,
  });
  if (remoteIp !== "unknown") body.set("remoteip", remoteIp);

  let result: SiteverifyResponse;
  try {
    const response = await send(VERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return "unavailable";
    result = (await response.json()) as SiteverifyResponse;
  } catch {
    return "unavailable";
  }

  if (!result.success) return "failed";
  // The test keys report no action; real keys always do.
  if (result.action !== undefined && result.action !== action) return "failed";
  return "passed";
}
