import { describe, expect, it } from "vitest";

import { nextStep, previousStep, resumeStep, stepPosition } from "./onboarding";

describe("onboarding steps", () => {
  it("resumes at the stored step", () => {
    expect(resumeStep(1)).toBe(1);
    expect(resumeStep(3)).toBe(3);
    expect(resumeStep(5)).toBe(5);
  });

  it("never resumes at the step that is not offered yet", () => {
    expect(resumeStep(4)).toBe(3);
  });

  it("skips the routine step in both directions", () => {
    expect(nextStep(3)).toBe(5);
    expect(previousStep(5)).toBe(3);
  });

  it("stays within the first and last steps", () => {
    expect(previousStep(1)).toBe(1);
    expect(nextStep(5)).toBe(5);
  });

  it("counts only the steps that are shown", () => {
    expect(stepPosition(1)).toEqual({ current: 1, total: 4 });
    expect(stepPosition(5)).toEqual({ current: 4, total: 4 });
  });
});
