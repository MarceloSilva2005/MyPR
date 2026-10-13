interface CspOptions {
  /** Fresh per request; Next.js applies it to the scripts it renders. */
  readonly nonce: string;
  /** Development needs `eval` for React debugging and inline styles for hot reload. */
  readonly development: boolean;
}

/**
 * Content Security Policy for every HTML response (decision D-22). The browser
 * only talks to this origin: all data goes through the server (decision D-04).
 */
export function buildContentSecurityPolicy({ nonce, development }: CspOptions): string {
  const directives: [string, ...string[]][] = [
    ["default-src", "'self'"],
    [
      "script-src",
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(development ? ["'unsafe-eval'"] : []),
    ],
    ["style-src", "'self'", development ? "'unsafe-inline'" : `'nonce-${nonce}'`],
    // Positioning of popovers and chart geometry use style attributes.
    ["style-src-attr", "'unsafe-inline'"],
    ["img-src", "'self'", "blob:", "data:"],
    ["font-src", "'self'"],
    ["connect-src", "'self'"],
    ["worker-src", "'self'"],
    ["manifest-src", "'self'"],
    ["frame-src", "'none'"],
    ["object-src", "'none'"],
    ["base-uri", "'none'"],
    ["form-action", "'self'"],
    ["frame-ancestors", "'none'"],
  ];
  if (!development) directives.push(["upgrade-insecure-requests"]);

  return directives.map((parts) => parts.join(" ")).join("; ");
}

/** 128 random bits, base64-encoded, as CSP Level 3 recommends. */
export function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}
