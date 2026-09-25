export type WorkoutStatus = "draft" | "in_progress" | "completed";

export type WeightUnit = "kg" | "lb";

export interface Profile {
  id: string;
  name: string;
  email?: string;
  age?: number;
  weightKg?: number;
  weightUnit: WeightUnit;
  theme: "dark" | "light";
  createdAt: string;
  updatedAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup?: string;
  source: "default" | "custom";
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workout {
  id: string;
  performedAt: string;
  status: WorkoutStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface SetEntry {
  id: string;
  workoutExerciseId: string;
  order: number;
  reps: number;
  loadKg: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface SyncOperation {
  id: string;
  entity: "exercise" | "workout_bundle" | "profile";
  recordId: string;
  action: "upsert" | "delete";
  payload: unknown;
  createdAt: string;
  syncedAt?: string;
}

export interface WorkoutBundle {
  workout: Workout;
  exercises: WorkoutExercise[];
  sets: SetEntry[];
}

export interface WorkoutTemplateSet {
  id: string;
  reps: number;
  loadKg: number;
  completed: boolean;
}

export interface WorkoutTemplateExercise {
  id: string;
  exerciseId: string;
  name: string;
  sets: WorkoutTemplateSet[];
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  items: WorkoutTemplateExercise[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSummary extends Workout {
  exerciseCount: number;
  setCount: number;
  totalReps: number;
  volumeKg: number;
  exerciseNames: string[];
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  kind: "load" | "estimated1rm" | "reps" | "sessionVolume";
  value: number;
  unit: "kg" | "reps";
  date: string;
}

export interface PeriodMetrics {
  workouts: number;
  sets: number;
  reps: number;
  volumeKg: number;
}

export interface ExerciseTrendPoint {
  date: string;
  label: string;
  maxLoadKg: number;
  estimated1rmKg: number;
  volumeKg: number;
}

export interface WorkoutDraftExercise {
  id: string;
  exerciseId: string;
  name: string;
  sets: Array<{
    id: string;
    reps: number | null;
    loadKg: number | null;
    completed: boolean;
  }>;
}
