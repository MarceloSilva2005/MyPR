import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getEnv, getSupabaseEnv } from "@/env";
import { SESSION_COOKIE } from "@/lib/cookies";
import { buildContentSecurityPolicy, createNonce } from "@/lib/csp";
import { DEFAULT_AFTER_SIGN_IN } from "@/lib/redirect";
import { AUTH_ROUTES, GUEST_ONLY_ROUTES, isPrivatePath, needsSession } from "@/lib/routes";

/**
 * Runs before every page. It sets the per-request Content Security Policy,
 * refreshes the session cookie where a session matters and keeps visitors
 * without a session out of the application (first of the three authorization
 * layers, decision D-05). Indexing is decided at runtime so the public launch
 * only needs an environment change.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const nonce = createNonce();
  const policy = buildContentSecurityPolicy({
    nonce,
    development: process.env.NODE_ENV === "development",
  });

  // Next.js reads the nonce from the request's policy and applies it to the
  // scripts it renders; `x-nonce` exposes it to the root layout.
  const forward = (): NextResponse => {
    const headers = new Headers(request.headers);
    headers.set("x-nonce", nonce);
    headers.set("content-security-policy", policy);
    return NextResponse.next({ request: { headers } });
  };

  let response = forward();
  const { pathname, search } = request.nextUrl;

  if (needsSession(pathname)) {
    const env = getSupabaseEnv();
    const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
      cookieOptions: SESSION_COOKIE,
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list, cacheHeaders) {
          for (const { name, value } of list) request.cookies.set(name, value);
          response = forward();
          for (const { name, value, options } of list) response.cookies.set(name, value, options);
          for (const [key, value] of Object.entries(cacheHeaders)) response.headers.set(key, value);
        },
      },
    });

    // Asks the auth server, so a session ended on another device stops working
    // at once instead of when its access token expires. Never trust the cookie
    // contents on their own.
    const { data } = await supabase.auth.getUser();
    const signedIn = Boolean(data.user);

    if (!signedIn && isPrivatePath(pathname)) {
      const target = new URL(AUTH_ROUTES.signIn, request.url);
      target.searchParams.set("next", `${pathname}${search}`);
      response = redirectKeepingCookies(target, response);
    } else if (signedIn && GUEST_ONLY_ROUTES.includes(pathname)) {
      response = redirectKeepingCookies(new URL(DEFAULT_AFTER_SIGN_IN, request.url), response);
    }
  }

  response.headers.set("Content-Security-Policy", policy);
  if (!getEnv().ALLOW_INDEXING) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

function redirectKeepingCookies(target: URL, from: NextResponse): NextResponse {
  const redirect = NextResponse.redirect(target);
  for (const cookie of from.cookies.getAll()) redirect.cookies.set(cookie);
  const cacheControl = from.headers.get("Cache-Control");
  if (cacheControl) redirect.headers.set("Cache-Control", cacheControl);
  return redirect;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      // Prefetches carry no HTML of their own and would waste a nonce.
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
