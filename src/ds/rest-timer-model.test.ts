import { describe, expect, it } from "vitest";

import {
  addRestTime,
  elapsedFraction,
  finishRest,
  isFinished,
  pauseRest,
  remainingMs,
  resumeRest,
  startRest,
} from "./rest-timer-model";

const T0 = 1_000_000;

describe("rest timer model", () => {
  it("counts down from the instant the rest ends", () => {
    const state = startRest(T0, 90_000);
    expect(remainingMs(state, T0)).toBe(90_000);
    expect(remainingMs(state, T0 + 30_000)).toBe(60_000);
  });

  it("stays correct after a long gap, as when the tab was in the background", () => {
    const state = startRest(T0, 90_000);
    expect(remainingMs(state, T0 + 600_000)).toBe(0);
    expect(isFinished(state, T0 + 600_000)).toBe(true);
  });

  it("never reports negative time", () => {
    expect(remainingMs(startRest(T0, 1_000), T0 + 5_000)).toBe(0);
  });

  it("reports progress between 0 and 1", () => {
    const state = startRest(T0, 100_000);
    expect(elapsedFraction(state, T0)).toBe(0);
    expect(elapsedFraction(state, T0 + 25_000)).toBeCloseTo(0.25);
    expect(elapsedFraction(state, T0 + 999_999)).toBe(1);
  });

  it("treats a zero-length rest as already complete", () => {
    expect(elapsedFraction({ status: "done", totalMs: 0 }, T0)).toBe(1);
  });

  it("freezes the remaining time while paused and resumes from it", () => {
    const paused = pauseRest(startRest(T0, 90_000), T0 + 30_000);
    expect(paused).toEqual({ status: "paused", remainingMs: 60_000, totalMs: 90_000 });
    expect(remainingMs(paused, T0 + 500_000)).toBe(60_000);

    const resumed = resumeRest(paused, T0 + 500_000);
    expect(remainingMs(resumed, T0 + 510_000)).toBe(50_000);
  });

  it("ignores pause and resume in states where they do not apply", () => {
    const done = finishRest(startRest(T0, 1_000));
    expect(pauseRest(done, T0)).toBe(done);
    const running = startRest(T0, 1_000);
    expect(resumeRest(running, T0)).toBe(running);
  });

  it("extends a running rest and its total", () => {
    const state = addRestTime(startRest(T0, 60_000), T0 + 10_000, 15_000);
    expect(remainingMs(state, T0 + 10_000)).toBe(65_000);
    expect(state.totalMs).toBe(75_000);
  });

  it("extends a paused rest without starting it", () => {
    const paused = pauseRest(startRest(T0, 60_000), T0 + 20_000);
    const extended = addRestTime(paused, T0 + 20_000, 30_000);
    expect(extended.status).toBe("paused");
    expect(remainingMs(extended, T0 + 99_999)).toBe(70_000);
  });

  it("restarts a finished rest with only the added time", () => {
    const done = finishRest(startRest(T0, 60_000));
    const restarted = addRestTime(done, T0 + 90_000, 15_000);
    expect(restarted).toEqual({ status: "running", endsAt: T0 + 105_000, totalMs: 15_000 });
  });

  it("is finished only once the end instant is reached", () => {
    const state = startRest(T0, 10_000);
    expect(isFinished(state, T0 + 9_999)).toBe(false);
    expect(isFinished(state, T0 + 10_000)).toBe(true);
    expect(isFinished(pauseRest(state, T0 + 1_000), T0 + 999_999)).toBe(false);
  });
});
