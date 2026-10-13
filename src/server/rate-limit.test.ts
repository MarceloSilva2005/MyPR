import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { RATE_RULES, rateBucket } from "./rate-limit";

const secret = "s".repeat(32);

describe("rateBucket", () => {
  it("produces the 64 hex characters the database accepts", () => {
    expect(rateBucket(RATE_RULES.signInByAddress, "203.0.113.7", secret)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("never contains the subject", () => {
    const bucket = rateBucket(RATE_RULES.signInByEmail, "nome@exemplo.com", secret);
    expect(bucket).not.toContain("nome");
  });

  it("separates rules and subjects", () => {
    const base = rateBucket(RATE_RULES.signInByAddress, "203.0.113.7", secret);
    expect(rateBucket(RATE_RULES.signUpByAddress, "203.0.113.7", secret)).not.toBe(base);
    expect(rateBucket(RATE_RULES.signInByAddress, "203.0.113.8", secret)).not.toBe(base);
  });

  it("cannot be reproduced without the server secret", () => {
    const base = rateBucket(RATE_RULES.signInByAddress, "203.0.113.7", secret);
    expect(rateBucket(RATE_RULES.signInByAddress, "203.0.113.7", "x".repeat(32))).not.toBe(base);
  });
});
