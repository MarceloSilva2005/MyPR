import { describe, expect, it } from "vitest";

import { usesContextWords } from "./password";

describe("usesContextWords", () => {
  it("rejects the product name in any case", () => {
    expect(usesContextWords("minhasenhaMyPR2026")).toBe(true);
    expect(usesContextWords("my pr é o melhor")).toBe(true);
  });

  it("rejects the e-mail name and the display name, ignoring accents", () => {
    const context = { email: "marcelo.silva@exemplo.com", displayName: "Marcelo Conceição" };
    expect(usesContextWords("xx-marcelo.silva-xx", context)).toBe(true);
    expect(usesContextWords("frase da conceicao longa", context)).toBe(true);
  });

  it("ignores short fragments that would reject unrelated passwords", () => {
    expect(usesContextWords("frase bem longa", { displayName: "Ana" })).toBe(false);
  });

  it("accepts an unrelated passphrase", () => {
    const context = { email: "pessoa@exemplo.com", displayName: "Pessoa" };
    expect(usesContextWords("cavalo bateria grampo correto", context)).toBe(false);
  });
});
