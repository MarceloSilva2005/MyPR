export const THEME_STORAGE_KEY = "mypr-theme";

export const THEME_PREFERENCES = ["system", "light", "dark"] as const;

export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export function parseThemePreference(value: unknown): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}

/**
 * Runs before first paint so an explicit choice never flashes the other theme.
 * "System" needs no script: the stylesheet follows prefers-color-scheme by itself.
 *
 * It is a fixed string, never built from other values. A test keeps its storage key identical to
 * THEME_STORAGE_KEY, which the client hook uses.
 */
export const themeInitScript =
  '(function(){try{var t=localStorage.getItem("mypr-theme");if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t;}}catch(e){}})();';
