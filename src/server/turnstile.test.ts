import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/env", () => ({
  getSupabaseEnv: () => ({ TURNSTILE_SECRET_KEY: "secret-key" }),
}));

import { verifyHuman } from "./turnstile";

function reply(body: unknown, status = 200) {
  return vi.fn<typeof fetch>(() => Promise.resolve(Response.json(body, { status })));
}

describe("verifyHuman", () => {
  it("passes a valid token issued for the same action", async () => {
    const send = reply({ success: true, action: "sign-up" });
    expect(await verifyHuman("token", "sign-up", "203.0.113.7", send)).toBe("passed");

    const [, init] = send.mock.calls[0] ?? [];
    const body = init?.body as URLSearchParams;
    expect(body.get("secret")).toBe("secret-key");
    expect(body.get("response")).toBe("token");
    expect(body.get("remoteip")).toBe("203.0.113.7");
  });

  it("refuses a token issued for another action", async () => {
    const send = reply({ success: true, action: "sign-in" });
    expect(await verifyHuman("token", "sign-up", "203.0.113.7", send)).toBe("failed");
  });

  it("refuses a token Cloudflare rejects", async () => {
    const send = reply({ success: false, "error-codes": ["timeout-or-duplicate"] });
    expect(await verifyHuman("token", "sign-up", "203.0.113.7", send)).toBe("failed");
  });

  it("reports a missing token without calling Cloudflare", async () => {
    const send = reply({ success: true });
    expect(await verifyHuman(null, "sign-up", "203.0.113.7", send)).toBe("missing");
    expect(await verifyHuman("", "sign-up", "203.0.113.7", send)).toBe("missing");
    expect(send).not.toHaveBeenCalled();
  });

  it("reports when Cloudflare cannot be reached", async () => {
    const send = vi.fn<typeof fetch>(() => Promise.reject(new Error("network down")));
    expect(await verifyHuman("token", "sign-up", "203.0.113.7", send)).toBe("unavailable");
    expect(await verifyHuman("token", "sign-up", "203.0.113.7", reply({}, 500))).toBe(
      "unavailable",
    );
  });
});
