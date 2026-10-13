import { describe, expect, it } from "vitest";

import { parseEnv, parseSupabaseEnv } from "./env";

describe("parseSupabaseEnv", () => {
  const valid = {
    SUPABASE_URL: "http://127.0.0.1:54321",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_local",
    RATE_LIMIT_SECRET: "r".repeat(32),
    TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
    TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
  };

  it("accepts the local stack", () => {
    expect(parseSupabaseEnv(valid)).toEqual(valid);
  });

  it("names every missing variable without echoing values", () => {
    expect(() => parseSupabaseEnv({ SUPABASE_URL: "ftp://secret-host" })).toThrow(
      /SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, RATE_LIMIT_SECRET, TURNSTILE_SITE_KEY/,
    );
    expect(() => parseSupabaseEnv({ SUPABASE_URL: "ftp://secret-host" })).not.toThrow(
      /secret-host/,
    );
  });
});

describe("parseSupabaseEnv in production", () => {
  it("refuses the public Turnstile test keys", () => {
    expect(() =>
      parseSupabaseEnv({
        APP_ENV: "production",
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x",
        RATE_LIMIT_SECRET: "r".repeat(32),
        TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
        TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
      }),
    ).toThrow("TURNSTILE_SECRET_KEY");
  });
});

describe("parseEnv", () => {
  it("falls back to safe defaults when nothing is set", () => {
    expect(parseEnv({})).toEqual({
      APP_ENV: "development",
      ALLOW_INDEXING: false,
      ENABLE_DESIGN_GALLERY: false,
    });
  });

  it("accepts explicit values", () => {
    expect(
      parseEnv({ APP_ENV: "production", ALLOW_INDEXING: "true", ENABLE_DESIGN_GALLERY: "true" }),
    ).toEqual({
      APP_ENV: "production",
      ALLOW_INDEXING: true,
      ENABLE_DESIGN_GALLERY: true,
    });
  });

  it("rejects unknown environments and names the variable", () => {
    expect(() => parseEnv({ APP_ENV: "staging" })).toThrow("APP_ENV");
  });

  it("never echoes the rejected value", () => {
    const secret = "do-not-leak-this-value";
    try {
      parseEnv({ ALLOW_INDEXING: secret });
      expect.unreachable("parseEnv should have thrown");
    } catch (error) {
      expect(String(error)).not.toContain(secret);
      expect(String(error)).toContain("ALLOW_INDEXING");
    }
  });
});
