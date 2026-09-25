import { format } from "date-fns";
import { describe, expect, it } from "vitest";
import { currentWorkoutStreak, estimatedOneRepMax, isWorkoutInMonth, percentChange, setVolume, summarizeWorkouts } from "./analytics";
import { buildProfileRecord, getDefaultExerciseCatalog } from "./db";
import type { Exercise, SetEntry, Workout, WorkoutExercise } from "./domain";
import { createWorkoutTemplate } from "./workout-templates";

describe("analytics", () => {
  it("cria um modelo de treino reutilizável a partir de exercícios e séries", () => {
    const template = createWorkoutTemplate("Supino + Tríceps", [
      { id: "item-1", exerciseId: "e1", name: "Supino", sets: [{ id: "s1", reps: 8, loadKg: 60, completed: true }, { id: "s2", reps: 8, loadKg: 60, completed: true }] },
      { id: "item-2", exerciseId: "e2", name: "Tríceps", sets: [{ id: "s3", reps: 12, loadKg: 20, completed: true }] },
    ]);

    expect(template.name).toBe("Supino + Tríceps");
    expect(template.items).toHaveLength(2);
    expect(template.items[0].sets).toHaveLength(2);
    expect(template.items[1].exerciseId).toBe("e2");
  });

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

  it("calcula a sequência ativa de treinos consecutivos", () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    const workouts: Workout[] = [
      { id: "w1", performedAt: formatDateString(twoDaysAgo), status: "completed", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
      { id: "w2", performedAt: formatDateString(yesterday), status: "completed", createdAt: "2026-01-02", updatedAt: "2026-01-02" },
      { id: "w3", performedAt: formatDateString(today), status: "completed", createdAt: "2026-01-03", updatedAt: "2026-01-03" },
    ];

    expect(currentWorkoutStreak(workouts)).toBe(3);
    expect(currentWorkoutStreak([{ ...workouts[0], performedAt: formatDateString(twoDaysAgo) }])).toBe(0);
  });

  it("cria um catálogo base de exercícios com musculação por grupo muscular", () => {
    const exercises = getDefaultExerciseCatalog();

    expect(exercises.length).toBeGreaterThan(30);
    expect(exercises.some((exercise) => exercise.name === "Supino reto" && exercise.muscleGroup === "Peito")).toBe(true);
    expect(exercises.some((exercise) => exercise.name === "Agachamento" && exercise.muscleGroup === "Pernas")).toBe(true);
    expect(exercises.every((exercise) => exercise.source === "default")).toBe(true);
  });

  it("cria o perfil do usuário com valores padrão e dados limpos", () => {
    const profile = buildProfileRecord({ name: "  Ana  ", email: " ana@email.com ", age: 28, weightKg: 68.5 });

    expect(profile.name).toBe("Ana");
    expect(profile.email).toBe("ana@email.com");
    expect(profile.age).toBe(28);
    expect(profile.weightKg).toBe(68.5);
    expect(profile.weightUnit).toBe("kg");
    expect(profile.theme).toBe("dark");
  });

  it("mantém a comparação mensal correta sem ficar preso em um único mês", () => {
    const reference = new Date(2026, 8, 25);

    expect(isWorkoutInMonth("2026-09-15", reference)).toBe(true);
    expect(isWorkoutInMonth("2026-10-01", reference)).toBe(false);
    expect(isWorkoutInMonth("2026-09-30", reference)).toBe(true);
  });
});

function formatDateString(date: Date) {
  return format(date, "yyyy-MM-dd");
}
