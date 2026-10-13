import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { onboardingContent } from "@/content/onboarding";
import { resumeStep, stepPosition } from "@/domain/onboarding";
import { InteractiveStep } from "@/features/onboarding/interactive-step";
import { DoneStep, WelcomeStep } from "@/features/onboarding/simple-steps";
import { getCurrentProfile } from "@/server/profile";

export const metadata: Metadata = { title: onboardingContent.pageTitle };

const copy = onboardingContent;

export default async function OnboardingPage() {
  const profile = await getCurrentProfile();
  if (profile.onboarding_completed_at) redirect("/app");

  // Resumes at the step saved in the profile, on any device.
  const step = resumeStep(profile.onboarding_step);
  const { current, total } = stepPosition(step);
  const header = {
    1: { title: copy.welcome.title },
    2: { title: copy.preferences.title, description: copy.preferences.description },
    3: { title: copy.trainingProfile.title, description: copy.trainingProfile.description },
    5: { title: copy.done.title },
  }[step];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium text-fg-muted">{copy.progress(current, total)}</p>
        <h1 className="text-xl font-semibold tracking-tight text-fg">{header.title}</h1>
        {"description" in header ? (
          <p className="text-sm text-fg-muted">{header.description}</p>
        ) : null}
      </header>
      {step === 1 ? <WelcomeStep /> : null}
      {step === 2 || step === 3 ? <InteractiveStep step={step} profile={profile} /> : null}
      {step === 5 ? <DoneStep /> : null}
    </div>
  );
}
