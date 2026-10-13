// Allowed values of the profile, matching the checks in supabase/migrations.
// Plain constants so interface code can use them without the validation library.
export const WEIGHT_UNITS = ["kg", "lb"] as const;
export const THEMES = ["system", "light", "dark"] as const;
export const TRAINING_GOALS = ["hypertrophy", "strength", "general_fitness"] as const;
export const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced"] as const;

export type TrainingGoal = (typeof TRAINING_GOALS)[number];
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];
