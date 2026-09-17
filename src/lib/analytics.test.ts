import { describe, expect, it } from "vitest";
import { estimatedOneRepMax, percentChange, setVolume, summarizeWorkouts } from "./analytics";
import type { Exercise, SetEntry, Workout, WorkoutExercise } from "./domain";

describe("analytics", () => {
  it("calcula o volume apenas de séries concluídas", () => {
    expect(setVolume({ loadKg: 40, reps: 10, completed: true })).toBe(400);
    expect(setVolume({ loadKg: 40, reps: 10, completed: false })).toBe(0);
  });

  it("calcula o 1RM estimado com a fórmula de Epley", () => {
    expect(estimatedOneRepMax(100, 1)).toBe(100);
    expect(estimatedOneRepMax(60, 10)).toBeCloseTo(80);
  });

  it("calcula variação percentual com base zero", () => {
    expect(percentChange(0, 0)).toBe(0);
    expect(percentChange(3, 0)).toBe(100);
    expect(percentChange(75, 100)).toBe(-25);
  });

  it("resume treino ignorando séries pendentes", () => {
    const now = "2026-09-17T12:00:00.000Z";
    const exercises: Exercise[] = [{ id: "e1", name: "Supino", source: "custom", createdAt: now, updatedAt: now }];
    const workouts: Workout[] = [{ id: "w1", performedAt: "2026-09-17", status: "completed", createdAt: now, updatedAt: now }];
    const links: WorkoutExercise[] = [{ id: "we1", workoutId: "w1", exerciseId: "e1", order: 0, createdAt: now, updatedAt: now }];
    const sets: SetEntry[] = [
      { id: "s1", workoutExerciseId: "we1", order: 0, reps: 10, loadKg: 30, completed: true, createdAt: now, updatedAt: now },
      { id: "s2", workoutExerciseId: "we1", order: 1, reps: 12, loadKg: 30, completed: false, createdAt: now, updatedAt: now },
    ];
    expect(summarizeWorkouts(workouts, links, sets, exercises)[0]).toMatchObject({ setCount: 1, totalReps: 10, volumeKg: 300 });
  });
});
