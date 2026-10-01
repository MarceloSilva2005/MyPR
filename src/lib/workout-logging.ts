import type { SetEntry, Workout, WorkoutExercise } from "@/lib/domain";

export const LOAD_STEP_KG = 2.5;
export const REST_PRESETS_SECONDS = [60, 90, 120, 180] as const;
export const DEFAULT_REST_SECONDS = 90;

export interface LoggedSetSnapshot {
  loadKg: number;
  reps: number;
}

export interface PreviousExerciseSession {
  date: string;
  sets: LoggedSetSnapshot[];
}

export interface WorkoutLogHistory {
  workouts: Workout[];
  workoutExercises: WorkoutExercise[];
  sets: SetEntry[];
}

export type SetRecord =
  | { kind: "load"; loadKg: number; reps: number }
  | { kind: "reps"; loadKg: number; reps: number };

function roundLoad(value: number) {
  return Math.round(value * 100) / 100;
}

export function formatLoadKg(value: number) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export function formatSetSnapshot(set: LoggedSetSnapshot) {
  return `${formatLoadKg(set.loadKg)} kg × ${set.reps}`;
}

export function formatPreviousSets(sets: LoggedSetSnapshot[]) {
  return sets.map(formatSetSnapshot).join(" · ");
}

export function nextRestPreset(current: number) {
  const presets = REST_PRESETS_SECONDS as readonly number[];
  const index = presets.indexOf(current);
  if (index >= 0) return presets[(index + 1) % presets.length] ?? DEFAULT_REST_SECONDS;
  const higher = presets.find((preset) => preset > current);
  return higher ?? presets[0] ?? DEFAULT_REST_SECONDS;
}

export function stepLoad(current: number | null, direction: -1 | 1, fallback: number | null = null) {
  if (current === null) {
    if (direction < 0) return null;
    return roundLoad(Math.max(0, fallback ?? LOAD_STEP_KG));
  }
  return roundLoad(Math.max(0, current + direction * LOAD_STEP_KG));
}

export function stepReps(current: number | null, direction: -1 | 1, fallback: number | null = null) {
  if (current === null) {
    if (direction < 0) return null;
    return Math.max(0, fallback ?? 1);
  }
  return Math.max(0, current + direction);
}

export function latestSessionsByExercise(
  history: WorkoutLogHistory,
  excludeWorkoutId?: string,
): Map<string, PreviousExerciseSession> {
  const sessions = new Map<string, PreviousExerciseSession>();
  const linksByWorkout = new Map<string, WorkoutExercise[]>();
  const setsByLink = new Map<string, SetEntry[]>();

  for (const link of history.workoutExercises) {
    if (link.deletedAt) continue;
    const bucket = linksByWorkout.get(link.workoutId) ?? [];
    bucket.push(link);
    linksByWorkout.set(link.workoutId, bucket);
  }

  for (const set of history.sets) {
    if (set.deletedAt || !set.completed) continue;
    const bucket = setsByLink.get(set.workoutExerciseId) ?? [];
    bucket.push(set);
    setsByLink.set(set.workoutExerciseId, bucket);
  }

  const workouts = history.workouts
    .filter((workout) => workout.status === "completed" && !workout.deletedAt && workout.id !== excludeWorkoutId)
    .sort((a, b) => b.performedAt.localeCompare(a.performedAt) || b.updatedAt.localeCompare(a.updatedAt));

  for (const workout of workouts) {
    for (const link of linksByWorkout.get(workout.id) ?? []) {
      if (sessions.has(link.exerciseId)) continue;
      const sets = (setsByLink.get(link.id) ?? [])
        .sort((a, b) => a.order - b.order)
        .map((set) => ({ loadKg: set.loadKg, reps: set.reps }));
      if (sets.length === 0) continue;
      sessions.set(link.exerciseId, { date: workout.performedAt, sets });
    }
  }

  return sessions;
}

export function completedSetsForExercise(history: WorkoutLogHistory, exerciseId: string, excludeWorkoutId?: string) {
  const workoutIds = new Set(
    history.workouts
      .filter((workout) => workout.status === "completed" && !workout.deletedAt && workout.id !== excludeWorkoutId)
      .map((workout) => workout.id),
  );
  const linkIds = new Set(
    history.workoutExercises
      .filter((link) => !link.deletedAt && link.exerciseId === exerciseId && workoutIds.has(link.workoutId))
      .map((link) => link.id),
  );
  return history.sets
    .filter((set) => !set.deletedAt && set.completed && linkIds.has(set.workoutExerciseId))
    .map((set) => ({ loadKg: set.loadKg, reps: set.reps }));
}

function sameLoad(left: number, right: number) {
  return Math.abs(left - right) < 0.001;
}

export function recordBeatenBySet(
  set: { loadKg: number | null; reps: number | null },
  history: LoggedSetSnapshot[],
): SetRecord | null {
  const loadKg = set.loadKg;
  const reps = set.reps;
  if (history.length === 0 || loadKg === null || reps === null || loadKg <= 0 || reps <= 0) return null;

  const bestLoad = Math.max(...history.map((entry) => entry.loadKg));
  if (loadKg > bestLoad) return { kind: "load", loadKg, reps };

  const repsAtLoad = history.filter((entry) => sameLoad(entry.loadKg, loadKg)).map((entry) => entry.reps);
  if (repsAtLoad.length === 0) return null;
  const bestReps = Math.max(...repsAtLoad);
  if (reps > bestReps) return { kind: "reps", loadKg, reps };
  return null;
}

export function recordLabel(record: SetRecord) {
  if (record.kind === "load") return `Recorde · ${formatLoadKg(record.loadKg)} kg`;
  return `Recorde · ${record.reps} reps com ${formatLoadKg(record.loadKg)} kg`;
}

export function suggestNextLoad(sets: LoggedSetSnapshot[], step = LOAD_STEP_KG) {
  const working = sets.filter((set) => set.loadKg > 0 && set.reps > 0);
  if (working.length === 0) return null;
  const peak = Math.max(...working.map((set) => set.loadKg));
  const atPeak = working.filter((set) => Math.abs(set.loadKg - peak) < 0.001);
  const ready = atPeak.every((set) => set.reps >= 8);
  const loadKg = roundLoad(ready ? peak + step : peak);
  const formatted = formatLoadKg(loadKg);
  return {
    loadKg,
    sentence: ready
      ? `Sobe para ${formatted} kg. Na última sessão as séries dessa carga fecharam 8 ou mais.`
      : `Mantém ${formatted} kg.`,
  };
}
