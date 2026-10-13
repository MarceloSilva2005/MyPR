import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "./redirect";

describe("safeRedirectPath", () => {
  it.each([
    ["/app", "/app"],
    ["/app/history?status=completed", "/app/history?status=completed"],
    ["/app/settings#conta", "/app/settings"],
  ])("keeps the application path %s", (raw, expected) => {
    expect(safeRedirectPath(raw)).toBe(expected);
  });

  it.each([
    null,
    undefined,
    "",
    "app",
    "https://evil.example/app",
    "//evil.example/app",
    "/\\evil.example",
    "/app\\..\\..\\evil",
    "/app%0d%0aSet-Cookie:x",
    "/app\r\nLocation: https://evil.example",
    "javascript:alert(1)",
    "/applications",
    "/sign-in",
    "/api/health",
    "/app/../sign-in",
    `/app/${"a".repeat(600)}`,
  ])("falls back to the default for %s", (raw) => {
    expect(safeRedirectPath(raw)).toBe("/app");
  });
});
