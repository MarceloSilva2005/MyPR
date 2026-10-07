"use client";

import { useCallback, useSyncExternalStore } from "react";

import { THEME_STORAGE_KEY, parseThemePreference, type ThemePreference } from "./theme";

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readPreference(): ThemePreference {
  try {
    return parseThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "system";
  }
}

function applyPreference(preference: ThemePreference): void {
  if (preference === "system") {
    delete document.documentElement.dataset["theme"];
  } else {
    document.documentElement.dataset["theme"] = preference;
  }
}

/** Reads and updates the interface theme. Storage failures degrade to following the system. */
export function useThemePreference(): readonly [ThemePreference, (next: ThemePreference) => void] {
  const preference = useSyncExternalStore(subscribe, readPreference, () => "system" as const);

  const setPreference = useCallback((next: ThemePreference) => {
    try {
      if (next === "system") window.localStorage.removeItem(THEME_STORAGE_KEY);
      else window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // The choice still applies for this visit even when it cannot be remembered.
    }
    applyPreference(next);
    listeners.forEach((listener) => {
      listener();
    });
  }, []);

  return [preference, setPreference] as const;
}
