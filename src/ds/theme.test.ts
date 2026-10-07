import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

import { THEME_STORAGE_KEY, parseThemePreference, themeInitScript } from "./theme";

describe("parseThemePreference", () => {
  it("accepts the explicit themes", () => {
    expect(parseThemePreference("light")).toBe("light");
    expect(parseThemePreference("dark")).toBe("dark");
  });

  it("falls back to following the system for anything else", () => {
    expect(parseThemePreference("system")).toBe("system");
    expect(parseThemePreference("sepia")).toBe("system");
    expect(parseThemePreference(null)).toBe("system");
    expect(parseThemePreference(undefined)).toBe("system");
  });
});

describe("themeInitScript", () => {
  function run(getItem: (key: string) => string | null): string | undefined {
    const dataset: Record<string, string> = {};
    runInNewContext(themeInitScript, {
      localStorage: { getItem },
      document: { documentElement: { dataset } },
    });
    return dataset["theme"];
  }

  const stored = (value: string | null) => (key: string) =>
    key === THEME_STORAGE_KEY ? value : null;

  it("applies an explicit stored theme before paint", () => {
    expect(run(stored("dark"))).toBe("dark");
    expect(run(stored("light"))).toBe("light");
  });

  it("leaves the document untouched for system or unknown values", () => {
    expect(run(stored(null))).toBeUndefined();
    expect(run(stored("system"))).toBeUndefined();
    expect(run(stored("neon"))).toBeUndefined();
  });

  it("does not throw when storage is unavailable", () => {
    expect(() =>
      run(() => {
        throw new Error("blocked");
      }),
    ).not.toThrow();
  });
});
