import { describe, expect, it } from "vitest";

import { newPasswordSchema, signInSchema, signUpSchema } from "./auth";

describe("signUpSchema", () => {
  const valid = { displayName: " Marcelo ", email: " Nome@Exemplo.COM ", password: "frase longa" };

  it("normalizes the name and the e-mail", () => {
    expect(signUpSchema.parse(valid)).toEqual({
      displayName: "Marcelo",
      email: "nome@exemplo.com",
      password: "frase longa",
    });
  });

  it("keeps the password exactly as typed", () => {
    expect(signUpSchema.parse({ ...valid, password: "  espaços  " }).password).toBe("  espaços  ");
  });

  it.each([
    ["a blank name", { displayName: "   " }],
    ["a long name", { displayName: "x".repeat(61) }],
    ["a malformed e-mail", { email: "nome@" }],
    ["a short password", { password: "1234567" }],
    ["a password over 72 bytes", { password: "é".repeat(37) }],
  ])("rejects %s", (_case, override) => {
    expect(signUpSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });

  it("accepts any characters without composition rules", () => {
    expect(newPasswordSchema.safeParse({ password: "senhasemregras" }).success).toBe(true);
  });
});

describe("signInSchema", () => {
  it("accepts any non-empty password, even old short ones", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(signInSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});
