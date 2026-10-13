import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createSupabaseServerClient } from "./supabase";
import { AUTH_ROUTES } from "@/lib/routes";

export interface SessionUser {
  readonly id: string;
  readonly email: string;
}

/**
 * The person behind this request, from a verified token. Identity never comes
 * from the request body or query string (decision D-05). Cached per request.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data) return null;

  const { sub, email } = data.claims;
  return { id: sub, email: typeof email === "string" ? email : "" };
});

/** Use in private pages and actions. Sends visitors to sign in and back. */
export async function requireUser(returnTo = "/app"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`${AUTH_ROUTES.signIn}?next=${encodeURIComponent(returnTo)}`);
  return user;
}
