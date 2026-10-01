import { describe, expect, it } from "vitest";
import type { SetEntry, Workout, WorkoutExercise } from "./domain";
import {
  completedSetsForExercise,
  formatPreviousSets,
  latestSessionsByExercise,
  nextRestPreset,
  recordBeatenBySet,
  recordLabel,
  stepLoad,
  stepReps,
  suggestNextLoad,
} from "./workout-logging";

const now = "2026-09-01T12:00:00.000Z";

function workout(id: string, performedAt: string, status: Workout["status"] = "completed"): Workout {
  return { id, performedAt, status, createdAt: now, updatedAt: `${performedAt}T12:00:00.000Z` };
}

function link(id: string, workoutId: string, exerciseId: string): WorkoutExercise {
  return { id, workoutId, exerciseId, order: 0, createdAt: now, updatedAt: now };
}

function set(id: string, workoutExerciseId: string, order: number, loadKg: number, reps: number, completed = true): SetEntry {
  return { id, workoutExerciseId, order, loadKg, reps, completed, createdAt: now, updatedAt: now };
}

describe("registro de treino", () => {
  it("mostra a última sessão concluída de cada exercício, sem o treino aberto", () => {
    const history = {
      workouts: [
        workout("old", "2026-08-01"),
        workout("latest", "2026-09-10"),
        workout("draft", "2026-09-20", "in_progress"),
        workout("current", "2026-09-21"),
      ],
      workoutExercises: [
        link("l-old", "old", "bench"),
        link("l-latest", "latest", "bench"),
        link("l-draft", "draft", "bench"),
        link("l-current", "current", "bench"),
      ],
      sets: [
        set("s-old", "l-old", 0, 50, 8),
        set("s-latest-1", "l-latest", 0, 60, 8),
        set("s-latest-2", "l-latest", 1, 57.5, 8),
        set("s-latest-skip", "l-latest", 2, 40, 12, false),
        set("s-draft", "l-draft", 0, 80, 3),
        set("s-current", "l-current", 0, 70, 5),
      ],
    };

    const sessions = latestSessionsByExercise(history, "current");
    expect(sessions.get("bench")).toEqual({
      date: "2026-09-10",
      sets: [
        { loadKg: 60, reps: 8 },
        { loadKg: 57.5, reps: 8 },
      ],
    });
    expect(formatPreviousSets(sessions.get("bench")?.sets ?? [])).toBe("60 kg × 8 · 57,5 kg × 8");
  });

  it("ignora treino e série apagados", () => {
    const history = {
      workouts: [{ ...workout("gone", "2026-09-12"), deletedAt: now }, workout("kept", "2026-09-01")],
      workoutExercises: [
        { ...link("gone-link", "gone", "squat"), deletedAt: now },
        link("kept-link", "kept", "squat"),
      ],
      sets: [
        { ...set("gone-set", "gone-link", 0, 100, 5), deletedAt: now },
        set("kept-set", "kept-link", 0, 80, 6),
      ],
    };

    expect(latestSessionsByExercise(history).get("squat")?.sets).toEqual([{ loadKg: 80, reps: 6 }]);
  });

  it("reconhece recorde de carga e, na mesma carga, recorde de repetições", () => {
    const history = [
      { loadKg: 60, reps: 8 },
      { loadKg: 60, reps: 6 },
      { loadKg: 40, reps: 15 },
    ];

    expect(recordBeatenBySet({ loadKg: 60, reps: 8 }, [])).toBeNull();
    expect(recordBeatenBySet({ loadKg: 60, reps: 8 }, history)).toBeNull();
    expect(recordBeatenBySet({ loadKg: null, reps: 10 }, history)).toBeNull();
    expect(recordLabel(recordBeatenBySet({ loadKg: 62.5, reps: 5 }, history)!)).toBe("Recorde · 62,5 kg");
    expect(recordLabel(recordBeatenBySet({ loadKg: 60, reps: 9 }, history)!)).toBe("Recorde · 9 reps com 60 kg");
    expect(recordBeatenBySet({ loadKg: 50, reps: 20 }, history)).toBeNull();
  });

  it("usa o histórico concluído do exercício, fora do treino aberto", () => {
    const history = {
      workouts: [workout("done", "2026-09-01"), workout("open", "2026-09-02", "in_progress")],
      workoutExercises: [link("done-link", "done", "row"), link("open-link", "open", "row")],
      sets: [set("done-set", "done-link", 0, 30, 10), set("open-set", "open-link", 0, 100, 1)],
    };

    expect(completedSetsForExercise(history, "row", "open")).toEqual([{ loadKg: 30, reps: 10 }]);
  });

  it("ajusta carga e repetições em passos fixos", () => {
    expect(stepLoad(null, 1, 60)).toBe(60);
    expect(stepLoad(60, 1)).toBe(62.5);
    expect(stepLoad(2.5, -1)).toBe(0);
    expect(stepLoad(0, -1)).toBe(0);
    expect(stepLoad(null, -1, 60)).toBeNull();
    expect(stepLoad(0.1, 1)).toBe(2.6);
    expect(stepReps(null, 1, 8)).toBe(8);
    expect(stepReps(8, 1)).toBe(9);
    expect(stepReps(0, -1)).toBe(0);
  });

  it("percorre os tempos de descanso", () => {
    expect(nextRestPreset(90)).toBe(120);
    expect(nextRestPreset(180)).toBe(60);
    expect(nextRestPreset(100)).toBe(120);
  });

  it("sobe 2,5 kg só quando as séries da carga máxima fecharam 8", () => {
    expect(suggestNextLoad([])).toBeNull();
    expect(suggestNextLoad([{ loadKg: 60, reps: 8 }, { loadKg: 60, reps: 8 }])).toMatchObject({ loadKg: 62.5 });
    expect(suggestNextLoad([{ loadKg: 60, reps: 8 }, { loadKg: 60, reps: 7 }])?.loadKg).toBe(60);
    expect(suggestNextLoad([{ loadKg: 60, reps: 6 }, { loadKg: 40, reps: 12 }])?.sentence.startsWith("Mantém")).toBe(true);
  });
});
