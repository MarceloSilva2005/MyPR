import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseEnv } from "@/env";

/**
 * Supabase client acting as the signed-in person: every query carries their
 * token, so row level security applies (decision D-04). Create one per request.
 */
export async function createSupabaseServerClient() {
  const store = await cookies();
  const env = getSupabaseEnv();

  return createServerClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Server Components cannot write cookies. The proxy refreshes the
          // session on the next request, so nothing is lost here.
        }
      },
    },
  });
}
