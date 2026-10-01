import type { SetEntry, Workout, WorkoutExercise } from "./domain";

export interface ExerciseSession {
  workoutId: string;
  date: string;
  sets: Array<{ loadKg: number; reps: number }>;
  maxLoadKg: number;
  estimated1rmKg: number;
  bestReps: number;
  volumeKg: number;
}

export interface ExerciseMark {
  kind: "load" | "estimated1rm" | "reps";
  value: number;
  loadKg: number;
  reps: number;
  date: string;
}

export function estimatedOneRepMax(loadKg: number, reps: number) {
  if (loadKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return loadKg;
  return loadKg * (1 + reps / 30);
}

export function exerciseSessions(
  exerciseId: string,
  workouts: Workout[],
  workoutExercises: WorkoutExercise[],
  sets: SetEntry[],
): ExerciseSession[] {
  const workoutMap = new Map(workouts.map((workout) => [workout.id, workout]));
  const sessions: ExerciseSession[] = [];
  for (const link of workoutExercises) {
    if (link.exerciseId !== exerciseId || link.deletedAt) continue;
    const workout = workoutMap.get(link.workoutId);
    if (!workout || workout.deletedAt || workout.status !== "completed") continue;
    const completed = sets
      .filter((set) => set.workoutExerciseId === link.id && set.completed && !set.deletedAt && set.loadKg > 0 && set.reps > 0)
      .sort((a, b) => a.order - b.order);
    if (completed.length === 0) continue;
    const loads = completed.map((set) => ({ loadKg: set.loadKg, reps: set.reps }));
    sessions.push({
      workoutId: workout.id,
      date: workout.performedAt,
      sets: loads,
      maxLoadKg: Math.max(...loads.map((set) => set.loadKg)),
      estimated1rmKg: Math.max(...loads.map((set) => estimatedOneRepMax(set.loadKg, set.reps))),
      bestReps: Math.max(...loads.map((set) => set.reps)),
      volumeKg: loads.reduce((sum, set) => sum + set.loadKg * set.reps, 0),
    });
  }
  return sessions.sort((a, b) => b.date.localeCompare(a.date) || b.workoutId.localeCompare(a.workoutId));
}

export function exerciseMarks(sessions: ExerciseSession[]): ExerciseMark[] {
  if (sessions.length === 0) return [];
  const sets = sessions.flatMap((session) => session.sets.map((set) => ({ ...set, date: session.date })));
  const bestLoad = sets.reduce((best, set) => (set.loadKg > best.loadKg || (set.loadKg === best.loadKg && set.reps > best.reps) ? set : best));
  const bestOneRm = sets.reduce((best, set) => {
    const value = estimatedOneRepMax(set.loadKg, set.reps);
    const bestValue = estimatedOneRepMax(best.loadKg, best.reps);
    return value > bestValue ? set : best;
  });
  const bestReps = sets.reduce((best, set) => (set.reps > best.reps || (set.reps === best.reps && set.loadKg > best.loadKg) ? set : best));
  return [
    { kind: "load", value: bestLoad.loadKg, loadKg: bestLoad.loadKg, reps: bestLoad.reps, date: bestLoad.date },
    { kind: "estimated1rm", value: estimatedOneRepMax(bestOneRm.loadKg, bestOneRm.reps), loadKg: bestOneRm.loadKg, reps: bestOneRm.reps, date: bestOneRm.date },
    { kind: "reps", value: bestReps.reps, loadKg: bestReps.loadKg, reps: bestReps.reps, date: bestReps.date },
  ];
}
