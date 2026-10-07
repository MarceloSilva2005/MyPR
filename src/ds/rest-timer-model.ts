/**
 * Rest timer state. It stores the instant the rest ends, not a counter, so the remaining time is
 * correct after a reload or after the tab spent time in the background.
 */
export type RestTimerState =
  | { status: "running"; endsAt: number; totalMs: number }
  | { status: "paused"; remainingMs: number; totalMs: number }
  | { status: "done"; totalMs: number };

export function startRest(now: number, totalMs: number): RestTimerState {
  return { status: "running", endsAt: now + totalMs, totalMs };
}

export function remainingMs(state: RestTimerState, now: number): number {
  switch (state.status) {
    case "running":
      return Math.max(0, state.endsAt - now);
    case "paused":
      return state.remainingMs;
    case "done":
      return 0;
  }
}

/** Fraction of the rest already elapsed, from 0 to 1. */
export function elapsedFraction(state: RestTimerState, now: number): number {
  if (state.totalMs <= 0) return 1;
  return Math.min(1, Math.max(0, 1 - remainingMs(state, now) / state.totalMs));
}

export function isFinished(state: RestTimerState, now: number): boolean {
  return state.status === "done" || (state.status === "running" && now >= state.endsAt);
}

export function pauseRest(state: RestTimerState, now: number): RestTimerState {
  if (state.status !== "running") return state;
  return { status: "paused", remainingMs: remainingMs(state, now), totalMs: state.totalMs };
}

export function resumeRest(state: RestTimerState, now: number): RestTimerState {
  if (state.status !== "paused") return state;
  return { status: "running", endsAt: now + state.remainingMs, totalMs: state.totalMs };
}

/** Adds time to a running or paused rest. A finished rest starts again with the added time. */
export function addRestTime(state: RestTimerState, now: number, addedMs: number): RestTimerState {
  switch (state.status) {
    case "running":
      return {
        status: "running",
        endsAt: state.endsAt + addedMs,
        totalMs: state.totalMs + addedMs,
      };
    case "paused":
      return {
        status: "paused",
        remainingMs: state.remainingMs + addedMs,
        totalMs: state.totalMs + addedMs,
      };
    case "done":
      return startRest(now, addedMs);
  }
}

export function finishRest(state: RestTimerState): RestTimerState {
  return { status: "done", totalMs: state.totalMs };
}
