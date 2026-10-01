import type { Exercise, SetEntry, Workout, WorkoutExercise, WorkoutStatus } from "./domain";

export const LOG_CSV_HEADER = [
  "workoutId",
  "performedAt",
  "status",
  "routineName",
  "exerciseId",
  "exerciseName",
  "setOrder",
  "reps",
  "loadKg",
  "completed",
] as const;

export interface CsvLogRow {
  workoutId: string;
  performedAt: string;
  status: WorkoutStatus;
  routineName?: string;
  exerciseId: string;
  exerciseName: string;
  setOrder: number;
  reps: number;
  loadKg: number;
  completed: boolean;
}

function escapeCell(value: string) {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (quoted && char === '"' && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      cell = "";
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
    } else {
      cell += char;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some((value) => value.length > 0)) rows.push(row);
  }
  return rows;
}

export function logToCsv(input: {
  workouts: Workout[];
  workoutExercises: WorkoutExercise[];
  sets: SetEntry[];
  exercises: Exercise[];
}) {
  const names = new Map(input.exercises.map((exercise) => [exercise.id, exercise.name]));
  const lines = [LOG_CSV_HEADER.join(",")];
  const workouts = input.workouts.filter((workout) => !workout.deletedAt);
  for (const workout of workouts) {
    const links = input.workoutExercises
      .filter((link) => link.workoutId === workout.id && !link.deletedAt)
      .sort((a, b) => a.order - b.order);
    for (const link of links) {
      const sets = input.sets
        .filter((set) => set.workoutExerciseId === link.id && !set.deletedAt)
        .sort((a, b) => a.order - b.order);
      for (const set of sets) {
        lines.push(
          [
            workout.id,
            workout.performedAt,
            workout.status,
            workout.routineName ?? "",
            link.exerciseId,
            names.get(link.exerciseId) ?? "Exercício",
            String(set.order + 1),
            String(set.reps),
            String(set.loadKg),
            set.completed ? "true" : "false",
          ].map(escapeCell).join(","),
        );
      }
    }
  }
  return `${lines.join("\n")}\n`;
}

export function parseLogCsv(text: string): CsvLogRow[] {
  const table = parseCsv(text.trim());
  if (table.length === 0) return [];
  const header = table[0]?.map((cell) => cell.trim()) ?? [];
  const expected = LOG_CSV_HEADER.join(",");
  if (header.join(",") !== expected) throw new Error("Este CSV não é um backup do MyPR.");
  return table.slice(1).map((cells) => {
    const status = cells[2];
    if (status !== "draft" && status !== "in_progress" && status !== "completed") {
      throw new Error("Status de treino inválido no CSV.");
    }
    const setOrder = Number(cells[6]);
    const reps = Number(cells[7]);
    const loadKg = Number(cells[8]);
    if (!Number.isInteger(setOrder) || setOrder < 1 || !Number.isFinite(reps) || !Number.isFinite(loadKg)) {
      throw new Error("Série inválida no CSV.");
    }
    return {
      workoutId: cells[0] ?? "",
      performedAt: cells[1] ?? "",
      status,
      routineName: cells[3]?.trim() || undefined,
      exerciseId: cells[4] ?? "",
      exerciseName: cells[5]?.trim() || "Exercício",
      setOrder,
      reps,
      loadKg,
      completed: cells[9] === "true",
    };
  });
}
