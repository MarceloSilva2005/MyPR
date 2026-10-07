import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  contrastRatio,
  isInSrgbGamut,
  oklabDistance,
  parseOklch,
  type Oklch,
  relativeLuminance,
} from "./color";

type Theme = "light" | "dark";

const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");

/** Reads every `--color-*` declaration, resolving `light-dark(a, b)` into one color per theme. */
function readColorTokens(): Record<string, Record<Theme, Oklch>> {
  const tokens: Record<string, Record<Theme, Oklch>> = {};
  const declaration = /--color-([a-z0-9-]+):\s*([^;]+);/g;

  for (const [, name, value] of css.matchAll(declaration)) {
    if (!name || !value) continue;
    const pair = /^light-dark\(\s*(oklch\([^)]*\)),\s*(oklch\([^)]*\))\s*\)$/.exec(value.trim());
    tokens[name] = pair
      ? { light: parseOklch(pair[1] ?? ""), dark: parseOklch(pair[2] ?? "") }
      : { light: parseOklch(value), dark: parseOklch(value) };
  }
  return tokens;
}

const tokens = readColorTokens();
const themes: Theme[] = ["light", "dark"];

function color(name: string, theme: Theme): Oklch {
  const token = tokens[name];
  if (!token) throw new Error(`Missing color token: ${name}`);
  return token[theme];
}

const TEXT_PAIRS: [foreground: string, background: string][] = [
  ["fg", "bg"],
  ["fg", "surface"],
  ["fg", "surface-hover"],
  ["fg", "overlay"],
  ["fg-muted", "bg"],
  ["fg-muted", "surface"],
  ["fg-muted", "overlay"],
  ["fg-subtle", "bg"],
  ["fg-subtle", "surface"],
  ["fg-subtle", "overlay"],
  ["accent-text", "bg"],
  ["accent-text", "surface"],
  ["accent-text", "overlay"],
  ["accent-text", "accent-subtle"],
  ["fg", "accent-subtle"],
  ["accent-fg", "accent"],
  ["accent-fg", "accent-hover"],
  ["danger-solid-fg", "danger-solid"],
  ["danger-solid-fg", "danger-solid-hover"],
  ["success", "bg"],
  ["success", "success-subtle"],
  ["danger", "bg"],
  ["danger", "danger-subtle"],
  ["warning", "bg"],
  ["warning", "warning-subtle"],
];

const NON_TEXT_PAIRS: [foreground: string, background: string][] = [
  ["line-control", "bg"],
  ["line-control", "surface"],
  ["line-control", "overlay"],
  ["accent-text", "bg"],
  ["series-1", "bg"],
  ["series-2", "bg"],
  ["series-3", "bg"],
  ["series-4", "bg"],
  ["series-5", "bg"],
  ["series-1", "overlay"],
  ["series-5", "overlay"],
];

describe.each(themes)("color tokens (%s theme)", (theme) => {
  it.each(TEXT_PAIRS)("keeps %s readable on %s (4.5:1)", (foreground, background) => {
    const ratio = contrastRatio(color(foreground, theme), color(background, theme));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it.each(NON_TEXT_PAIRS)("keeps %s distinguishable on %s (3:1)", (foreground, background) => {
    const ratio = contrastRatio(color(foreground, theme), color(background, theme));
    expect(ratio).toBeGreaterThanOrEqual(3);
  });

  it("declares every color inside the sRGB gamut", () => {
    const outside = Object.keys(tokens).filter((name) => {
      const value = color(name, theme);
      return value.alpha === 1 && !isInSrgbGamut(value);
    });
    expect(outside).toEqual([]);
  });

  it("keeps data series visually distinct from each other", () => {
    const series = [1, 2, 3, 4, 5].map((index) => color(`series-${String(index)}`, theme));
    for (const [index, first] of series.entries()) {
      for (const second of series.slice(index + 1)) {
        expect(oklabDistance(first, second)).toBeGreaterThan(0.12);
      }
    }
  });

  it("orders surfaces from the page background to the hover state", () => {
    const luminance = (name: string): number => relativeLuminance(color(name, theme));
    const [page = 0, surface = 0, hover = 0] = ["bg", "surface", "surface-hover"].map(luminance);
    if (theme === "light") {
      expect(page).toBeGreaterThan(surface);
      expect(surface).toBeGreaterThan(hover);
    } else {
      expect(page).toBeLessThan(surface);
      expect(surface).toBeLessThan(hover);
    }
  });
});

describe("motion tokens", () => {
  const duration = (name: string): number => {
    const match = new RegExp(`--motion-${name}:\\s*(\\d+)ms`).exec(css);
    return Number(match?.[1]);
  };

  it("keeps durations within the ranges defined by the design contract", () => {
    expect(duration("instant")).toBeGreaterThanOrEqual(80);
    expect(duration("instant")).toBeLessThanOrEqual(120);
    expect(duration("fast")).toBeGreaterThanOrEqual(140);
    expect(duration("fast")).toBeLessThanOrEqual(180);
    expect(duration("base")).toBeGreaterThanOrEqual(200);
    expect(duration("base")).toBeLessThanOrEqual(240);
    expect(duration("slow")).toBeGreaterThanOrEqual(280);
    expect(duration("slow")).toBeLessThanOrEqual(360);
  });

  it("removes spatial movement when the user prefers reduced motion", () => {
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce[\s\S]*--motion-distance:\s*0px/);
  });
});
