import { describe, expect, it } from "vitest";
import type { SetEntry, Workout, WorkoutExercise } from "./domain";
import { exerciseMarks, exerciseSessions } from "./exercise-detail";

const workout = (id: string, date: string): Workout => ({
  id,
  performedAt: date,
  status: "completed",
  createdAt: date,
  updatedAt: date,
});

const link = (id: string, workoutId: string): WorkoutExercise => ({
  id,
  workoutId,
  exerciseId: "ex",
  order: 0,
  createdAt: "",
  updatedAt: "",
});

const set = (id: string, linkId: string, loadKg: number, reps: number, order: number): SetEntry => ({
  id,
  workoutExerciseId: linkId,
  order,
  loadKg,
  reps,
  completed: true,
  createdAt: "",
  updatedAt: "",
});

describe("exerciseSessions", () => {
  const workouts = [workout("w1", "2026-09-01"), workout("w2", "2026-09-20")];
  const links = [link("l1", "w1"), link("l2", "w2")];
  const sets = [set("s1", "l1", 60, 8, 0), set("s2", "l2", 62.5, 6, 0), set("s3", "l2", 50, 12, 1)];

  it("lista as sessões concluídas da mais recente para a mais antiga", () => {
    const sessions = exerciseSessions("ex", workouts, links, sets);
    expect(sessions.map((session) => session.date)).toEqual(["2026-09-20", "2026-09-01"]);
    expect(sessions[0]?.maxLoadKg).toBe(62.5);
    expect(sessions[0]?.bestReps).toBe(12);
  });

  it("separa recorde de carga, 1RM e repetições", () => {
    const marks = exerciseMarks(exerciseSessions("ex", workouts, links, sets));
    expect(marks.find((mark) => mark.kind === "load")?.value).toBe(62.5);
    expect(marks.find((mark) => mark.kind === "reps")).toMatchObject({ value: 12, loadKg: 50 });
    expect(marks.find((mark) => mark.kind === "estimated1rm")?.value).toBeGreaterThan(62.5);
  });
});
