import { describe, expect, it } from "vitest";

import { findDesignViolations } from "./design-guards.ts";

const rules = (path: string, text: string): string[] =>
  findDesignViolations(path, text).map((violation) => violation.rule);

describe("design guards: allowed code", () => {
  it("accepts token based utilities and the spacing scale", () => {
    const code =
      '<div className="bg-surface text-fg border border-line p-4 gap-2 rounded-md shadow-float">';
    expect(rules("src/ds/example.tsx", code)).toEqual([]);
  });

  it("accepts CSS variables and anchors that merely look like hex values", () => {
    expect(rules("src/ds/example.tsx", 'stroke="var(--color-line)" href="#feedback"')).toEqual([]);
  });

  it("accepts the standard motion utilities backed by tokens", () => {
    expect(rules("src/ds/example.tsx", "transition-colors animate-fade-in animate-spin")).toEqual(
      [],
    );
  });

  it("lets the token file define colors and shadows", () => {
    const css = "--color-bg: oklch(0.99 0 0); --shadow-float: 0 4px 16px oklch(0 0 0 / 0.1);";
    expect(rules("src/ds/tokens.css", css)).toEqual([]);
  });

  it("honors an explicit, line-level exception", () => {
    expect(rules("src/ds/example.tsx", 'color: "#fff" // guard-allow third-party embed')).toEqual(
      [],
    );
  });
});

describe("design guards: violations", () => {
  it("rejects color literals outside the token file", () => {
    expect(rules("src/ds/example.tsx", 'style={{ color: "#3b4ed8" }}')).toContain(
      "color literal outside the token file",
    );
    expect(rules("src/app/page.tsx", "color: rgb(0 0 0)")).toContain(
      "color literal outside the token file",
    );
  });

  it("rejects default palette colors and arbitrary values", () => {
    expect(rules("src/ds/example.tsx", "bg-blue-500")).toContain(
      "default palette color instead of a design token",
    );
    expect(rules("src/ds/example.tsx", "text-[#123456]")).toContain(
      "arbitrary color, shadow or radius value",
    );
  });

  it("rejects glass, gradients and unlisted shadows", () => {
    expect(rules("src/ds/example.tsx", "backdrop-blur-md")).toContain("backdrop effect (glass)");
    expect(rules("src/ds/example.tsx", "bg-gradient-to-r from-accent")).toContain(
      "decorative gradient",
    );
    expect(rules("src/ds/example.tsx", "shadow-lg")).toContain(
      "shadow outside the floating-layer tokens",
    );
  });

  it("rejects oversized radii and pills outside status indicators", () => {
    expect(rules("src/ds/example.tsx", "rounded-3xl")).toContain("oversized radius");
    expect(rules("src/ds/example.tsx", "rounded-full")).toContain(
      "pill shape outside status indicators",
    );
    expect(rules("src/ds/sync-status.tsx", "rounded-full")).toEqual([]);
  });

  it("rejects motion that bypasses the tokens", () => {
    expect(rules("src/ds/example.tsx", "duration-500")).toContain(
      "motion outside the motion tokens",
    );
    expect(rules("src/ds/example.tsx", "transition-all")).toContain(
      "motion outside the motion tokens",
    );
    expect(rules("src/ds/example.tsx", "animate-bounce")).toContain(
      "motion outside the motion tokens",
    );
  });

  it("rejects spacing outside the 4 px scale", () => {
    expect(rules("src/ds/example.tsx", "p-5 gap-7")).toEqual([
      "spacing outside the 4 px scale",
      "spacing outside the 4 px scale",
    ]);
    expect(rules("src/ds/example.tsx", "p-4 gap-1.5 mt-0.5")).toEqual([]);
  });

  it("rejects generic motivational copy", () => {
    expect(rules("src/content/example.ts", "Bem-vindo de volta, campeão")).toContain(
      "generic or promotional copy",
    );
    expect(rules("src/content/example.ts", "Oops! Algo deu errado")).toContain(
      "generic or promotional copy",
    );
  });

  it("reports the line and the offending snippet", () => {
    const [violation] = findDesignViolations("src/ds/example.tsx", 'ok\nclass="bg-gradient-to-b"');
    expect(violation).toMatchObject({ line: 2, snippet: "bg-gradient" });
  });
});
