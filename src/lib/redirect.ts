export const DEFAULT_AFTER_SIGN_IN = "/app";

// Only application pages may be the destination after signing in.
const ALLOWED_PREFIXES = ["/app"];

/**
 * Turns an untrusted `next` value into a path on this site, or the default.
 * Rejects absolute and protocol-relative URLs, backslash tricks and control
 * characters, so a crafted link can never send someone to another site.
 */
export function safeRedirectPath(raw: string | null | undefined): string {
  if (!raw || raw.length > 512) return DEFAULT_AFTER_SIGN_IN;
  if (!raw.startsWith("/") || raw.startsWith("//")) return DEFAULT_AFTER_SIGN_IN;
  // eslint-disable-next-line no-control-regex -- control characters are exactly what is rejected.
  if (/[\\\u0000-\u001f\u007f]/.test(raw)) return DEFAULT_AFTER_SIGN_IN;

  let url: URL;
  try {
    url = new URL(raw, "https://mypr.invalid");
  } catch {
    return DEFAULT_AFTER_SIGN_IN;
  }
  if (url.origin !== "https://mypr.invalid") return DEFAULT_AFTER_SIGN_IN;

  const allowed = ALLOWED_PREFIXES.some(
    (prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`),
  );
  return allowed ? `${url.pathname}${url.search}` : DEFAULT_AFTER_SIGN_IN;
}
