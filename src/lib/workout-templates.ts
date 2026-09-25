import type { WorkoutDraftExercise, WorkoutTemplate } from "@/lib/domain";

export function createWorkoutTemplate(name: string, items: WorkoutDraftExercise[]): WorkoutTemplate {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: name.trim() || `Treino ${new Date().toLocaleDateString("pt-BR")}`,
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
