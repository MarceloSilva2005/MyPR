import { describe, expect, it } from "vitest";

import { checkBudget, extractScriptSources, formatKilobytes, gzipBytes } from "./bundle-budget.ts";

describe("extractScriptSources", () => {
  it("lists the framework scripts of a page once each, in order", () => {
    const html = `
      <script src="/_next/static/chunks/a.js" async=""></script>
      <script src="/_next/static/chunks/b.js?dpl=1"></script>
      <script src="/_next/static/chunks/a.js"></script>`;
    expect(extractScriptSources(html)).toEqual([
      "/_next/static/chunks/a.js",
      "/_next/static/chunks/b.js",
    ]);
  });

  it("skips fallbacks for browsers that cannot run the app", () => {
    const html =
      '<script src="/_next/static/chunks/a.js"></script>' +
      '<script src="/_next/static/chunks/poly.js" noModule=""></script>';
    expect(extractScriptSources(html)).toEqual(["/_next/static/chunks/a.js"]);
  });

  it("ignores inline scripts and third-party sources", () => {
    const html = `<script>window.x = 1</script><script src="https://example.com/x.js"></script>`;
    expect(extractScriptSources(html)).toEqual([]);
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
