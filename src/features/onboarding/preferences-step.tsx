"use client";

import { useState, useSyncExternalStore } from "react";

import { savePreferences } from "./actions";
import { SecondaryActions } from "./simple-steps";
import { onboardingContent } from "@/content/onboarding";
import type { Profile } from "@/data/profiles";
import { SegmentedControl } from "@/ds/segmented-control";
import { useThemePreference } from "@/ds/theme-client";
import { AuthForm } from "@/features/auth/auth-form";

const copy = onboardingContent;

const noSubscription = () => () => undefined;

function useBrowserTimeZone(): string {
  return useSyncExternalStore(
    noSubscription,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => "",
  );
}

type WeekStart = "0" | "1";

export function PreferencesStep({ profile }: { profile: Profile }) {
  const prefs = copy.preferences;
  const [weightUnit, setWeightUnit] = useState(profile.weight_unit === "lb" ? "lb" : "kg");
  const [weekStartsOn, setWeekStartsOn] = useState<WeekStart>(
    profile.week_starts_on === 0 ? "0" : "1",
  );
  const [theme, setTheme] = useThemePreference();
  const timeZone = useBrowserTimeZone();

  return (
    <div className="flex flex-col gap-4">
      <AuthForm action={savePreferences} submitLabel={copy.next}>
        {() => (
          <div className="flex flex-col gap-6">
            <input type="hidden" name="weightUnit" value={weightUnit} />
            <input type="hidden" name="theme" value={theme} />
            <input type="hidden" name="weekStartsOn" value={weekStartsOn} />
            {timeZone ? <input type="hidden" name="timeZone" value={timeZone} /> : null}

            <div className="flex flex-col gap-2">
              {/* The group is named for assistive technology by its own label. */}
              <p aria-hidden className="text-sm font-medium text-fg">
                {prefs.weightUnit}
              </p>
              <SegmentedControl
                className="self-start"
                label={prefs.weightUnit}
                value={weightUnit}
                onChange={setWeightUnit}
                options={[
                  { id: "kg", label: prefs.weightUnits.kg },
                  { id: "lb", label: prefs.weightUnits.lb },
                ]}
              />
            </div>
            <div className="flex flex-col gap-2">
              {/* The group is named for assistive technology by its own label. */}
              <p aria-hidden className="text-sm font-medium text-fg">
                {prefs.theme}
              </p>
              <SegmentedControl
                className="self-start"
                label={prefs.theme}
                value={theme}
                onChange={setTheme}
                options={[
                  { id: "system", label: prefs.themes.system },
                  { id: "light", label: prefs.themes.light },
                  { id: "dark", label: prefs.themes.dark },
                ]}
              />
            </div>
            <div className="flex flex-col gap-2">
              {/* The group is named for assistive technology by its own label. */}
              <p aria-hidden className="text-sm font-medium text-fg">
                {prefs.weekStartsOn}
              </p>
              <SegmentedControl
                className="self-start"
                label={prefs.weekStartsOn}
                value={weekStartsOn}
                onChange={setWeekStartsOn}
                options={[
                  { id: "1", label: prefs.weekDays["1"] },
                  { id: "0", label: prefs.weekDays["0"] },
                ]}
              />
            </div>
          </div>
        )}
      </AuthForm>
      <SecondaryActions />
    </div>
  );
}
