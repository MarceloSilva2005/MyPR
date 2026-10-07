"use client";

import { appPages } from "@/content/app-pages";
import { SegmentedControl } from "@/ds/segmented-control";
import { useThemePreference } from "@/ds/theme-client";
import { THEME_PREFERENCES } from "@/ds/theme";

/** Theme choice. It is stored on this device until preferences are tied to the account. */
export function InterfaceSettings() {
  const copy = appPages.settings;
  const [preference, setPreference] = useThemePreference();

  return (
    <section aria-labelledby="interface-heading" className="space-y-4">
      <h2 id="interface-heading" className="text-base font-medium tracking-tight">
        {copy.interface}
      </h2>
      <div className="space-y-2">
        <p className="text-sm font-medium">{copy.theme}</p>
        <SegmentedControl
          label={copy.theme}
          value={preference}
          onChange={setPreference}
          options={THEME_PREFERENCES.map((id) => ({ id, label: copy.themeOptions[id] }))}
        />
        <p className="text-xs text-fg-muted">{copy.themeDescription}</p>
      </div>
    </section>
  );
}
