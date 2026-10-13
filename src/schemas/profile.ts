import { z } from "zod";

import { EXPERIENCE_LEVELS, THEMES, TRAINING_GOALS, WEIGHT_UNITS } from "@/domain/profile";

export const preferencesSchema = z.object({
  weightUnit: z.enum(WEIGHT_UNITS),
  theme: z.enum(THEMES),
  // 0 = Sunday ... 6 = Saturday.
  weekStartsOn: z.coerce.number().int().min(0).max(6),
  // IANA name reported by the browser; the database rejects unknown zones.
  timeZone: z
    .string()
    .max(64)
    .regex(/^[A-Za-z][A-Za-z0-9_+\-/]*$/),
});

// Both answers are optional: leaving them blank never blocks the product.
export const trainingProfileSchema = z.object({
  trainingGoal: z.enum(TRAINING_GOALS).nullable(),
  experienceLevel: z.enum(EXPERIENCE_LEVELS).nullable(),
});
