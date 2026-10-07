import { NextResponse } from "next/server";

import { getEnv } from "@/env";

/**
 * Runs on every matched request. Indexing is controlled at runtime so the
 * public launch only needs an environment change, not a new build.
 */
export function proxy(): NextResponse {
  const response = NextResponse.next();
  if (!getEnv().ALLOW_INDEXING) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
