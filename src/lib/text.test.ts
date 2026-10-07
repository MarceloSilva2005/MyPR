import { describe, expect, it } from "vitest";

import { matchesSearch, normalizeSearchText } from "./text";

describe("normalizeSearchText", () => {
  it("removes accents, case and surrounding spaces", () => {
    expect(normalizeSearchText("  Elevação Lateral ")).toBe("elevacao lateral");
  });
});

describe("matchesSearch", () => {
  it("ignores accents and case in both directions", () => {
    expect(matchesSearch("Elevação lateral", "ELEVACAO")).toBe(true);
    expect(matchesSearch("Supino reto", "supíno")).toBe(true);
  });

  it("requires every typed word to be present, in any order", () => {
    expect(matchesSearch("Supino reto com barra", "barra reto")).toBe(true);
    expect(matchesSearch("Supino reto com barra", "barra inclinado")).toBe(false);
  });

  it("matches everything for an empty query", () => {
    expect(matchesSearch("Qualquer exercício", "   ")).toBe(true);
  });
});
