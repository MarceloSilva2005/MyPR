import { beforeEach, describe, expect, it, vi } from "vitest";

const getEnv = vi.hoisted(() => vi.fn<() => { ENABLE_DESIGN_GALLERY: boolean }>());
const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);

vi.mock("@/env", () => ({ getEnv }));
vi.mock("next/navigation", () => ({ notFound }));

import { requireDesignGallery } from "./gallery-guard";

describe("requireDesignGallery", () => {
  beforeEach(() => {
    getEnv.mockReset();
    notFound.mockClear();
  });

  it("answers 404 in any environment that does not enable the gallery", () => {
    getEnv.mockReturnValue({ ENABLE_DESIGN_GALLERY: false });
    expect(() => {
      requireDesignGallery();
    }).toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("lets the page render when the gallery is explicitly enabled", () => {
    getEnv.mockReturnValue({ ENABLE_DESIGN_GALLERY: true });
    expect(() => {
      requireDesignGallery();
    }).not.toThrow();
    expect(notFound).not.toHaveBeenCalled();
  });
});
