import type { WorkoutDraftExercise, WorkoutTemplate } from "./domain";

export const WEEKDAYS = [
  { day: 0, short: "D", label: "Domingo" },
  { day: 1, short: "S", label: "Segunda" },
  { day: 2, short: "T", label: "Terça" },
  { day: 3, short: "Q", label: "Quarta" },
  { day: 4, short: "Q", label: "Quinta" },
  { day: 5, short: "S", label: "Sexta" },
  { day: 6, short: "S", label: "Sábado" },
] as const;

export function normalizeRoutineDays(days: number[]) {
  return [...new Set(days.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))].sort((a, b) => a - b);
}

export function createWorkoutTemplate(name: string, items: WorkoutDraftExercise[], days: number[] = []): WorkoutTemplate {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("A rotina precisa de um nome.");
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: trimmed,
    days: normalizeRoutineDays(days),
    items: items.map((item) => ({
      id: crypto.randomUUID(),
      exerciseId: item.exerciseId,
      name: item.name,
      sets: item.sets.map((set) => ({
        id: crypto.randomUUID(),
        reps: Math.max(0, Number(set.reps) || 0),
        loadKg: Math.max(0, Number(set.loadKg) || 0),
        completed: Boolean(set.completed),
      })),
    })),
    createdAt: now,
    updatedAt: now,
  };
}

export function routineDayLabel(days: number[] | undefined) {
  if (!days?.length) return "Sem dia fixo";
  return days.map((day) => WEEKDAYS.find((entry) => entry.day === day)?.label ?? "").filter(Boolean).join(", ");
}
