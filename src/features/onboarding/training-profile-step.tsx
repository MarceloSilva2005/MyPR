"use client";

import { saveTrainingProfile } from "./actions";
import { SecondaryActions } from "./simple-steps";
import { onboardingContent } from "@/content/onboarding";
import type { Profile } from "@/data/profiles";
import {
  EXPERIENCE_LEVELS,
  TRAINING_GOALS,
  type ExperienceLevel,
  type TrainingGoal,
} from "@/domain/profile";
import { RadioGroup } from "@/ds/radio-group";
import { AuthForm } from "@/features/auth/auth-form";

const copy = onboardingContent;

export function TrainingProfileStep({ profile }: { profile: Profile }) {
  const training = copy.trainingProfile;

  return (
    <div className="flex flex-col gap-4">
      <AuthForm action={saveTrainingProfile} submitLabel={copy.next}>
        {() => (
          <div className="flex flex-col gap-6">
            <RadioGroup
              label={training.goal}
              name="trainingGoal"
              defaultValue={profile.training_goal as TrainingGoal | null}
              options={TRAINING_GOALS.map((id) => ({ id, ...training.goals[id] }))}
            />
            <RadioGroup
              label={training.experience}
              name="experienceLevel"
              defaultValue={profile.experience_level as ExperienceLevel | null}
              options={EXPERIENCE_LEVELS.map((id) => ({ id, ...training.levels[id] }))}
            />
          </div>
        )}
      </AuthForm>
      <SecondaryActions skip />
    </div>
  );
}
