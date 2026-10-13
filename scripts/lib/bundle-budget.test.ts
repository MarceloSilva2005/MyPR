import { describe, expect, it } from "vitest";

import {
  checkBudget,
  formatKilobytes,
  gzipBytes,
  heaviestOnDemand,
  routeScripts,
} from "./bundle-budget.ts";

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

describe("heaviestOnDemand", () => {
  const sizes: Record<string, number> = { "shared.js": 50, "a.js": 10, "b.js": 30, "c.js": 5 };
  const sizeOf = (file: string) => sizes[file] ?? 0;

  it("adds only the heaviest on-demand import, without files already loaded", () => {
    const total = heaviestOnDemand(
      ["shared.js"],
      [
        ["shared.js", "a.js"],
        ["b.js", "c.js"],
      ],
      sizeOf,
    );
    expect(total).toBe(35);
  });

  it("is zero when the route loads nothing on demand", () => {
    expect(heaviestOnDemand(["shared.js"], [], sizeOf)).toBe(0);
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
