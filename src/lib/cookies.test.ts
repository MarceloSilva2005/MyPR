import { afterEach, describe, expect, it, vi } from "vitest";

async function load(nodeEnv: string) {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", nodeEnv);
  return import("./cookies");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("cookies in production", () => {
  it("keep the session in a __Host- cookie the browser scripts cannot read", async () => {
    const { SESSION_COOKIE } = await load("production");
    expect(SESSION_COOKIE).toEqual({
      name: "__Host-mypr-session",
      path: "/",
      sameSite: "lax",
      secure: true,
      httpOnly: true,
    });
  });

  it("prefix cookies limited to one page with __Secure-", async () => {
    const { pathCookieName } = await load("production");
    expect(pathCookieName("mypr-pending-email")).toBe("__Secure-mypr-pending-email");
  });
});

describe("cookies on the development server", () => {
  it("drop the prefixes that plain HTTP does not allow", async () => {
    const { SESSION_COOKIE, pathCookieName } = await load("development");
    expect(SESSION_COOKIE.name).toBe("mypr-session");
    expect(SESSION_COOKIE.secure).toBe(false);
    expect(pathCookieName("mypr-pending-email")).toBe("mypr-pending-email");
  });
});
