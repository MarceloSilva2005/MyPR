import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  resend: vi.fn(),
  verifyOtp: vi.fn(),
  getClaims: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
}));
const cookieJar = vi.hoisted(() => new Map<string, string>());

vi.mock("server-only", () => ({}));
vi.mock("@/server/supabase", () => ({
  createSupabaseServerClient: () => Promise.resolve({ auth }),
}));
vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      set: (name: string, value: string) => cookieJar.set(name, value),
      get: (name: string) =>
        cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined,
    }),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Redirect(path);
  },
}));

class Redirect extends Error {
  constructor(readonly path: string) {
    super(`redirect ${path}`);
  }
}

import { confirmEmailLink, requestPasswordReset, signIn, signUp, updatePassword } from "./actions";
import { idle } from "./form-state";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

async function redirectOf(run: Promise<unknown>): Promise<string> {
  try {
    await run;
  } catch (error) {
    if (error instanceof Redirect) return error.path;
    throw error;
  }
  throw new Error("expected a redirect");
}

const providerError = (code: string) => ({ error: { code, message: `internal ${code}` } });

beforeEach(() => {
  for (const fn of Object.values(auth)) fn.mockReset();
  cookieJar.clear();
});

describe("signUp", () => {
  const valid = { displayName: "Marcelo", email: "Nome@Exemplo.com", password: "frase longa" };

  it("creates the account with the chosen name and asks to confirm the e-mail", async () => {
    auth.signUp.mockResolvedValue({ error: null });

    expect(await redirectOf(signUp(idle, form(valid)))).toBe("/check-email");
    expect(auth.signUp).toHaveBeenCalledWith({
      email: "nome@exemplo.com",
      password: "frase longa",
      options: { data: { display_name: "Marcelo" } },
    });
    expect(cookieJar.get("mypr-pending-email")).toBe("nome@exemplo.com");
  });

  it("answers an existing e-mail exactly like a new one", async () => {
    auth.signUp.mockResolvedValue(providerError("user_already_exists"));
    expect(await redirectOf(signUp(idle, form(valid)))).toBe("/check-email");
  });

  it("keeps what was typed, except the password, when validation fails", async () => {
    const state = await signUp(idle, form({ ...valid, email: "nome@" }));

    expect(state.status).toBe("error");
    expect(Object.keys(state.fieldErrors ?? {})).toEqual(["email"]);
    expect(state.fieldErrors?.email).toContain("e-mail válido");
    expect(state.values).toEqual({ displayName: "Marcelo", email: "nome@" });
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("never shows provider details", async () => {
    auth.signUp.mockResolvedValue(providerError("unexpected_failure"));
    const state = await signUp(idle, form(valid));
    expect(state.message).toBe("Não foi possível concluir agora. Tente de novo em instantes.");
  });
});

describe("signIn", () => {
  it("returns to the requested application page", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: null });
    const data = form({ email: "a@b.co", password: "x", next: "/app/history?status=completed" });
    expect(await redirectOf(signIn(idle, data))).toBe("/app/history?status=completed");
  });

  it("ignores a return address on another site", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: null });
    const data = form({ email: "a@b.co", password: "x", next: "https://evil.example/app" });
    expect(await redirectOf(signIn(idle, data))).toBe("/app");
  });

  it("uses one message for unknown e-mails and wrong passwords", async () => {
    auth.signInWithPassword.mockResolvedValue(providerError("invalid_credentials"));
    const state = await signIn(idle, form({ email: "a@b.co", password: "x" }));
    expect(state.message).toBe("E-mail ou senha incorretos.");
    expect(state.values).toEqual({ email: "a@b.co" });
  });
});

describe("requestPasswordReset", () => {
  it("gives the same answer whether or not the account exists", async () => {
    auth.resetPasswordForEmail.mockResolvedValueOnce({ error: null });
    auth.resetPasswordForEmail.mockResolvedValueOnce(providerError("user_not_found"));

    const known = await requestPasswordReset(idle, form({ email: "a@b.co" }));
    const unknown = await requestPasswordReset(idle, form({ email: "c@d.co" }));

    expect(known.status).toBe("done");
    expect(unknown).toEqual({ ...known, values: { email: "c@d.co" } });
  });
});

describe("updatePassword", () => {
  it("refuses without the session created by the recovery link", async () => {
    auth.getClaims.mockResolvedValue({ data: null });
    const state = await updatePassword(idle, form({ password: "frase nova longa" }));
    expect(state.message).toContain("expirou");
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
});

describe("confirmEmailLink", () => {
  it("rejects malformed tokens without calling the provider", async () => {
    const path = await redirectOf(confirmEmailLink(form({ token_hash: "<x>", type: "email" })));
    expect(path).toBe("/sign-in?status=link-invalid");
    expect(auth.verifyOtp).not.toHaveBeenCalled();
  });

  it("rejects link types the application does not use", async () => {
    const path = await redirectOf(
      confirmEmailLink(form({ token_hash: "abcdefgh123", type: "magiclink" })),
    );
    expect(path).toBe("/sign-in?status=link-invalid");
  });

  it("sends a confirmed account into the application", async () => {
    auth.verifyOtp.mockResolvedValue({ error: null });
    const path = await redirectOf(
      confirmEmailLink(form({ token_hash: "abcdefgh123", type: "email" })),
    );
    expect(path).toBe("/app?status=confirmed");
  });

  it("sends a used recovery link back to request a new one", async () => {
    auth.verifyOtp.mockResolvedValue(providerError("otp_expired"));
    const path = await redirectOf(
      confirmEmailLink(form({ token_hash: "abcdefgh123", type: "recovery" })),
    );
    expect(path).toBe("/forgot-password?status=link-expired");
  });
});
