"use client";

import dynamic from "next/dynamic";

import type { Profile } from "@/data/profiles";

// Each interactive step loads its own code, so a step never downloads the
// controls of another. Splitting only works from a client component.
const PreferencesStep = dynamic(() =>
  import("./preferences-step").then((module) => module.PreferencesStep),
);
const TrainingProfileStep = dynamic(() =>
  import("./training-profile-step").then((module) => module.TrainingProfileStep),
);

export function InteractiveStep({ step, profile }: { step: 2 | 3; profile: Profile }) {
  return step === 2 ? (
    <PreferencesStep profile={profile} />
  ) : (
    <TrainingProfileStep profile={profile} />
  );
}
