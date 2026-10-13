"use server";

import { redirect } from "next/navigation";

import { onboardingContent } from "@/content/onboarding";
import { updateOwnProfile } from "@/data/profiles";
import {
  DEFAULT_REST_SECONDS,
  nextStep,
  previousStep,
  resumeStep,
  type OnboardingStep,
} from "@/domain/onboarding";
import type { AuthFormState } from "@/features/auth/form-state";
import { preferencesSchema, trainingProfileSchema } from "@/schemas/profile";
import { getCurrentProfile } from "@/server/profile";
import { requireUser } from "@/server/session";
import { createSupabaseServerClient } from "@/server/supabase";

const ONBOARDING_PATH = "/app/onboarding";

type Changes = Parameters<typeof updateOwnProfile>[2];

/** Saves the changes of a step, then shows the step the profile now points to. */
async function save(changes: Changes): Promise<AuthFormState<never> | undefined> {
  const user = await requireUser(ONBOARDING_PATH);
  try {
    await updateOwnProfile(await createSupabaseServerClient(), user.id, changes);
  } catch {
    return { status: "error", message: onboardingContent.errors.unavailable };
  }
  return undefined;
}

async function currentStep(): Promise<OnboardingStep> {
  return resumeStep((await getCurrentProfile()).onboarding_step);
}

export async function startOnboarding(): Promise<void> {
  await save({ onboarding_step: nextStep(1) });
  redirect(ONBOARDING_PATH);
}

export async function goBack(): Promise<void> {
  await save({ onboarding_step: previousStep(await currentStep()) });
  redirect(ONBOARDING_PATH);
}

function text(form: FormData, name: string): string | null {
  const value = form.get(name);
  return typeof value === "string" && value !== "" ? value : null;
}

export async function savePreferences(
  _previous: AuthFormState<never>,
  form: FormData,
): Promise<AuthFormState<never>> {
  const parsed = preferencesSchema.safeParse({
    weightUnit: text(form, "weightUnit"),
    theme: text(form, "theme"),
    weekStartsOn: text(form, "weekStartsOn"),
    timeZone: text(form, "timeZone") ?? "America/Sao_Paulo",
  });
  if (!parsed.success) return { status: "error", message: onboardingContent.errors.invalid };

  const failed = await save({
    weight_unit: parsed.data.weightUnit,
    theme: parsed.data.theme,
    week_starts_on: parsed.data.weekStartsOn,
    time_zone: parsed.data.timeZone,
    onboarding_step: nextStep(2),
  });
  if (failed) return failed;
  redirect(ONBOARDING_PATH);
}

export async function saveTrainingProfile(
  _previous: AuthFormState<never>,
  form: FormData,
): Promise<AuthFormState<never>> {
  const parsed = trainingProfileSchema.safeParse({
    trainingGoal: text(form, "trainingGoal"),
    experienceLevel: text(form, "experienceLevel"),
  });
  if (!parsed.success) return { status: "error", message: onboardingContent.errors.invalid };

  const { trainingGoal, experienceLevel } = parsed.data;
  const failed = await save({
    training_goal: trainingGoal,
    experience_level: experienceLevel,
    ...(trainingGoal ? { default_rest_seconds: DEFAULT_REST_SECONDS[trainingGoal] } : {}),
    onboarding_step: nextStep(3),
  });
  if (failed) return failed;
  redirect(ONBOARDING_PATH);
}

/** "Pular" keeps whatever was there and moves on. */
export async function skipTrainingProfile(): Promise<void> {
  await save({ onboarding_step: nextStep(3) });
  redirect(ONBOARDING_PATH);
}

// Where the last step may send the person. Anything else falls back to the overview.
const DESTINATIONS = new Set(["/app", "/app/routines", "/app/workout"]);

export async function completeOnboarding(form: FormData): Promise<void> {
  const destination = form.get("destination");
  await save({ onboarding_completed_at: new Date().toISOString() });
  redirect(typeof destination === "string" && DESTINATIONS.has(destination) ? destination : "/app");
}
