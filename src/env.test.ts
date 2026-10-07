import { describe, expect, it } from "vitest";

import { parseEnv } from "./env";

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
