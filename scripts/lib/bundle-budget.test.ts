import { describe, expect, it } from "vitest";

import { checkBudget, formatKilobytes, gzipBytes, routeScripts } from "./bundle-budget.ts";

describe("routeScripts", () => {
  it("counts the runtime and every segment chunk once, in order", () => {
    const scripts = routeScripts(["static/chunks/runtime.js", "static/chunks/react.js"], {
      "[project]/src/app/layout": ["static/chunks/root.js"],
      "[project]/src/app/app/layout": ["static/chunks/root.js", "static/chunks/shell.js"],
      "[project]/src/app/app/page": ["static/chunks/root.js", "static/chunks/shell.js"],
    });
    expect(scripts).toEqual([
      "static/chunks/runtime.js",
      "static/chunks/react.js",
      "static/chunks/root.js",
      "static/chunks/shell.js",
    ]);
  });
});

describe("budget", () => {
  it("passes at the limit and fails above it", () => {
    expect(checkBudget("/", 1000, 1000).ok).toBe(true);
    expect(checkBudget("/", 1001, 1000).ok).toBe(false);
  });

  it("measures compressed size", () => {
    const repetitive = new TextEncoder().encode("abc".repeat(5000));
    expect(gzipBytes(repetitive)).toBeLessThan(repetitive.length / 10);
  });

  it("formats sizes in kilobytes", () => {
    expect(formatKilobytes(2048)).toBe("2.0 kB");
  });
});
