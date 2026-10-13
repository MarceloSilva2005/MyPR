import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy, createNonce } from "./csp";

function directives(policy: string): Map<string, string[]> {
  return new Map(
    policy.split("; ").map((directive) => {
      const [name = "", ...values] = directive.split(" ");
      return [name, values];
    }),
  );
}

describe("buildContentSecurityPolicy", () => {
  const production = directives(buildContentSecurityPolicy({ nonce: "abc", development: false }));

  it("allows only scripts carrying the request nonce", () => {
    expect(production.get("script-src")).toEqual(["'self'", "'nonce-abc'", "'strict-dynamic'"]);
  });

  it("never allows inline or evaluated scripts in production", () => {
    const policy = buildContentSecurityPolicy({ nonce: "abc", development: false });
    expect(policy).not.toContain("unsafe-eval");
    expect(production.get("script-src")).not.toContain("'unsafe-inline'");
    expect(production.get("style-src")).toEqual(["'self'", "'nonce-abc'"]);
  });

  it("keeps the browser on this origin and out of frames", () => {
    expect(production.get("connect-src")).toEqual(["'self'"]);
    expect(production.get("frame-ancestors")).toEqual(["'none'"]);
    expect(production.get("object-src")).toEqual(["'none'"]);
    expect(production.get("base-uri")).toEqual(["'none'"]);
    expect(production.get("form-action")).toEqual(["'self'"]);
    expect(production.has("upgrade-insecure-requests")).toBe(true);
  });

  it("relaxes only what the development server needs", () => {
    const development = directives(buildContentSecurityPolicy({ nonce: "abc", development: true }));
    expect(development.get("script-src")).toContain("'unsafe-eval'");
    expect(development.get("style-src")).toContain("'unsafe-inline'");
    expect(development.has("upgrade-insecure-requests")).toBe(false);
  });
});

describe("createNonce", () => {
  it("encodes 128 random bits and differs on every call", () => {
    const first = createNonce();
    expect(atob(first)).toHaveLength(16);
    expect(createNonce()).not.toBe(first);
  });
});
