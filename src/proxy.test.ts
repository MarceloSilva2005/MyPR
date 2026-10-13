import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getEnv = vi.hoisted(() => vi.fn<() => { ALLOW_INDEXING: boolean }>());
const session = vi.hoisted(() => ({
  claims: null as { sub: string } | null,
  refreshed: false,
}));

vi.mock("@/env", () => ({
  getEnv,
  getSupabaseEnv: () => ({
    SUPABASE_URL: "http://127.0.0.1:54321",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  }),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    options: {
      cookies: {
        setAll: (
          list: { name: string; value: string; options: object }[],
          headers: Record<string, string>,
        ) => void;
      };
    },
  ) => ({
    auth: {
      getUser: () => {
        if (session.refreshed) {
          options.cookies.setAll([{ name: "sb-auth", value: "fresh", options: {} }], {
            "Cache-Control": "private, no-store",
          });
        }
        return Promise.resolve({
          data: { user: session.claims ? { id: session.claims.sub } : null },
        });
      },
    },
  }),
}));

import { proxy } from "./proxy";

function visit(path: string): Promise<Response> {
  return proxy(new NextRequest(new URL(path, "http://localhost:3000")));
}

describe("proxy", () => {
  beforeEach(() => {
    getEnv.mockReset().mockReturnValue({ ALLOW_INDEXING: false });
    session.claims = null;
    session.refreshed = false;
  });

  it("keeps the site out of search indexes until indexing is allowed", async () => {
    expect((await visit("/")).headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("omits the indexing header once indexing is allowed", async () => {
    getEnv.mockReturnValue({ ALLOW_INDEXING: true });
    expect((await visit("/")).headers.get("x-robots-tag")).toBeNull();
  });

  it("sends a fresh nonce-based policy with every page", async () => {
    const first = (await visit("/")).headers.get("content-security-policy") ?? "";
    const second = (await visit("/")).headers.get("content-security-policy") ?? "";
    expect(first).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]{24}' 'strict-dynamic'/);
    expect(first).not.toBe(second);
  });

  it("sends visitors without a session to sign in and back", async () => {
    const response = await visit("/app/history?status=completed");
    expect(response.status).toBe(307);
    const target = new URL(response.headers.get("location") ?? "");
    expect(target.pathname).toBe("/sign-in");
    expect(target.searchParams.get("next")).toBe("/app/history?status=completed");
  });

  it("lets a signed-in person into the application", async () => {
    session.claims = { sub: "user-a" };
    const response = await visit("/app");
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("sends a signed-in person away from the sign-in page", async () => {
    session.claims = { sub: "user-a" };
    const response = await visit("/sign-in");
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/app");
  });

  it("keeps the reset page open to the person who followed a recovery link", async () => {
    session.claims = { sub: "user-a" };
    expect((await visit("/reset-password")).status).toBe(200);
  });

  it("stores a refreshed session and keeps it out of shared caches", async () => {
    session.claims = { sub: "user-a" };
    session.refreshed = true;
    const response = await visit("/app");
    expect(response.headers.get("set-cookie")).toContain("sb-auth=fresh");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("does not touch the session on public pages", async () => {
    session.refreshed = true;
    const response = await visit("/");
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
