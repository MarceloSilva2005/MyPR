"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Current time in milliseconds, rounded down to the refresh interval so the value is stable
 * between ticks. It only ticks while `active` is true; otherwise it is read on each render.
 */
export function useNow(active: boolean, intervalMs = 250): number {
  const subscribe = useCallback(
    (notify: () => void) => {
      if (!active) return () => undefined;
      const timer = window.setInterval(notify, intervalMs);
      return () => {
        window.clearInterval(timer);
      };
    },
    [active, intervalMs],
  );

  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
    () => 0,
  );
}
