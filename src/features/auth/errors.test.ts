import { describe, expect, it } from "vitest";

import { messageForAuthError, revealsAccount } from "./errors";

describe("messageForAuthError", () => {
  it("uses one message for an unknown e-mail and a wrong password", () => {
    expect(messageForAuthError("invalid_credentials")).toBe("E-mail ou senha incorretos.");
  });

  it("explains rate limits without exposing provider details", () => {
    expect(messageForAuthError("over_request_rate_limit")).toContain("Aguarde");
    expect(messageForAuthError("over_email_send_rate_limit")).toContain("Aguarde");
  });

  it("falls back to a neutral message for anything unexpected", () => {
    for (const code of [undefined, "unexpected_failure", "request_timeout"]) {
      const message = messageForAuthError(code);
      expect(message).toBe("Não foi possível concluir agora. Tente de novo em instantes.");
    }
  });
});

describe("revealsAccount", () => {
  it("flags errors that would confirm an account exists", () => {
    expect(revealsAccount("user_already_exists")).toBe(true);
    expect(revealsAccount("email_exists")).toBe(true);
    expect(revealsAccount("invalid_credentials")).toBe(false);
  });
});
