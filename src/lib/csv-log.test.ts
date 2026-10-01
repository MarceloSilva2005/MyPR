import { describe, expect, it } from "vitest";
import type { Exercise, SetEntry, Workout, WorkoutExercise } from "./domain";
import { logToCsv, parseLogCsv } from "./csv-log";

const exercise: Exercise = { id: "22222222-2222-4222-8222-222222222222", name: "Rosca, direta", source: "custom", createdAt: "", updatedAt: "" };
const workout: Workout = { id: "11111111-1111-4111-8111-111111111111", performedAt: "2026-10-01", status: "completed", routineName: "Braço", createdAt: "", updatedAt: "" };
const link: WorkoutExercise = { id: "33333333-3333-4333-8333-333333333333", workoutId: workout.id, exerciseId: exercise.id, order: 0, createdAt: "", updatedAt: "" };
const set: SetEntry = { id: "44444444-4444-4444-8444-444444444444", workoutExerciseId: link.id, order: 0, reps: 10, loadKg: 20, completed: true, createdAt: "", updatedAt: "" };

describe("log csv", () => {
  it("exporta e lê de volta, inclusive vírgula no nome", () => {
    const csv = logToCsv({ workouts: [workout], workoutExercises: [link], sets: [set], exercises: [exercise] });
    const rows = parseLogCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ exerciseName: "Rosca, direta", routineName: "Braço", loadKg: 20, reps: 10, completed: true });
  });

  it("recusa um CSV de outro aplicativo", () => {
    expect(() => parseLogCsv("Date,Exercise,Weight\n2026-10-01,Squat,100\n")).toThrow(/backup do MyPR/);
  });
});
