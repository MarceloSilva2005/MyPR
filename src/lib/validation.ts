import { z } from "zod";

const timestampSchema = z
  .string()
  .max(64)
  .refine((value) => Number.isFinite(Date.parse(value)), "Data inválida");

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const profileInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254).optional(),
  age: z.number().int().min(10).max(120).optional(),
  weightKg: z.number().finite().min(20).max(500).optional(),
  weightUnit: z.enum(["kg", "lb"]).optional(),
  theme: z.enum(["dark", "light"]).optional(),
});

export const exerciseInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  muscleGroup: z.string().trim().max(80).optional(),
});

const profileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254).optional(),
  age: z.number().int().min(10).max(120).optional(),
  weightKg: z.number().finite().min(20).max(500).optional(),
  weightUnit: z.enum(["kg", "lb"]),
  theme: z.enum(["dark", "light"]),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

const exerciseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  muscleGroup: z.string().trim().max(80).optional(),
  source: z.enum(["default", "custom"]),
  archivedAt: timestampSchema.optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

const workoutSchema = z.object({
  id: z.string().uuid(),
  performedAt: dateSchema,
  status: z.enum(["draft", "in_progress", "completed"]),
  routineName: z.string().trim().min(1).max(120).optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  deletedAt: timestampSchema.optional(),
});

const workoutExerciseSchema = z.object({
  id: z.string().uuid(),
  workoutId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  order: z.number().int().min(0).max(1000),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  deletedAt: timestampSchema.optional(),
});

const setEntrySchema = z.object({
  id: z.string().uuid(),
  workoutExerciseId: z.string().uuid(),
  order: z.number().int().min(0).max(1000),
  reps: z.number().int().min(0).max(10000),
  loadKg: z.number().finite().min(0).max(100000),
  completed: z.boolean(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  deletedAt: timestampSchema.optional(),
});

const templateSetSchema = z.object({
  id: z.string().uuid(),
  reps: z.number().int().min(0).max(10000),
  loadKg: z.number().finite().min(0).max(100000),
  completed: z.boolean(),
});

const templateExerciseSchema = z.object({
  id: z.string().uuid(),
  exerciseId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  sets: z.array(templateSetSchema).max(100),
});

const templateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  days: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  items: z.array(templateExerciseSchema).max(200),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const backupSchema = z.object({
  exportedAt: timestampSchema.optional(),
  profiles: z.array(profileSchema).max(100),
  exercises: z.array(exerciseSchema).max(10000),
  workouts: z.array(workoutSchema).max(100000),
  workoutExercises: z.array(workoutExerciseSchema).max(500000),
  setEntries: z.array(setEntrySchema).max(1000000),
  templates: z.array(templateSchema).max(1000),
});
