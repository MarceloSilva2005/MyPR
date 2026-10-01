import { describe, expect, it } from "vitest";
import type { WorkoutDraftExercise } from "./domain";
import { createWorkoutTemplate, normalizeRoutineDays } from "./workout-templates";

const item: WorkoutDraftExercise = {
  id: "11111111-1111-4111-8111-111111111111",
  exerciseId: "22222222-2222-4222-8222-222222222222",
  name: "Supino reto",
  sets: [{ id: "33333333-3333-4333-8333-333333333333", reps: 8, loadKg: 60, completed: true }],
};

describe("createWorkoutTemplate", () => {
  it("exige um nome e não usa a data", () => {
    expect(() => createWorkoutTemplate("   ", [item])).toThrow(/nome/);
    expect(createWorkoutTemplate("Peito", [item]).name).toBe("Peito");
  });

  it("guarda os dias da semana sem repetir", () => {
    expect(normalizeRoutineDays([1, 1, 8, 3])).toEqual([1, 3]);
    expect(createWorkoutTemplate("Pernas", [item], [5, 1, 5]).days).toEqual([1, 5]);
  });
});
