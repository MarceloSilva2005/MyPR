import { beforeEach, describe, expect, it, vi } from "vitest";

const getEnv = vi.hoisted(() => vi.fn<() => { ALLOW_INDEXING: boolean }>());

vi.mock("@/env", () => ({ getEnv }));

import { proxy } from "./proxy";

describe("proxy", () => {
  beforeEach(() => {
    getEnv.mockReset();
  });

  it("keeps the site out of search indexes until indexing is allowed", () => {
    getEnv.mockReturnValue({ ALLOW_INDEXING: false });
    expect(proxy().headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("omits the header once indexing is allowed", () => {
    getEnv.mockReturnValue({ ALLOW_INDEXING: true });
    expect(proxy().headers.get("x-robots-tag")).toBeNull();
  });
});
