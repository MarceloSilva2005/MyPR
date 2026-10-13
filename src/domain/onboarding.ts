import type { TrainingGoal } from "./profile";

/**
 * Onboarding steps (section 5.2 of the specification): 1 welcome, 2 preferences,
 * 3 training profile, 4 first routine, 5 done. Step 4 needs routines, which
 * arrive with stage E3, so it is not offered yet.
 */
export const ONBOARDING_STEPS = [1, 2, 3, 5] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** Maps a stored step to one that can be shown, resuming where the person stopped. */
export function resumeStep(stored: number): OnboardingStep {
  const available = ONBOARDING_STEPS.filter((step) => step <= stored);
  return available.at(-1) ?? 1;
}

export function nextStep(step: OnboardingStep): OnboardingStep {
  const index = ONBOARDING_STEPS.indexOf(step);
  return ONBOARDING_STEPS[Math.min(index + 1, ONBOARDING_STEPS.length - 1)] ?? step;
}

export function previousStep(step: OnboardingStep): OnboardingStep {
  const index = ONBOARDING_STEPS.indexOf(step);
  return ONBOARDING_STEPS[Math.max(index - 1, 0)] ?? step;
}

/** Position for "Passo 2 de 4", counting only the steps that are shown. */
export function stepPosition(step: OnboardingStep): { current: number; total: number } {
  return { current: ONBOARDING_STEPS.indexOf(step) + 1, total: ONBOARDING_STEPS.length };
}

/**
 * Default rest between sets for each goal. The goal only sets defaults like
 * this one; it never diagnoses or limits anything, and can be changed later.
 */
export const DEFAULT_REST_SECONDS: Record<TrainingGoal, number> = {
  strength: 180,
  hypertrophy: 120,
  general_fitness: 90,
};
