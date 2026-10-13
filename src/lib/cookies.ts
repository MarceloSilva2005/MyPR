// Cookie names and attributes (ASVS 5.0 V3.3). Production cookies are Secure
// and carry the __Host- prefix, which also pins them to this host and path "/".
// The development server runs over plain HTTP, where browsers refuse prefixed
// names, so it uses the same names without the prefix.

const secure = process.env.NODE_ENV === "production";

/** Session cookies written by the auth client. Readable only by the server. */
export const SESSION_COOKIE = {
  name: secure ? "__Host-mypr-session" : "mypr-session",
  path: "/",
  sameSite: "lax",
  secure,
  httpOnly: true,
} as const;

/**
 * Cookie scoped to one path. __Host- requires path "/", so a cookie limited
 * to a page uses the __Secure- prefix instead.
 */
export function pathCookieName(base: string): string {
  return secure ? `__Secure-${base}` : base;
}

export const COOKIES_ARE_SECURE = secure;
