"use client";

import Dexie, { type EntityTable } from "dexie";
import { format, subDays } from "date-fns";
import type {
  Exercise,
  Profile,
  SetEntry,
  SyncOperation,
  Workout,
  WorkoutBundle,
  WorkoutExercise,
} from "@/lib/domain";

class MyPrDatabase extends Dexie {
  profiles!: EntityTable<Profile, "id">;
  exercises!: EntityTable<Exercise, "id">;
  workouts!: EntityTable<Workout, "id">;
  workoutExercises!: EntityTable<WorkoutExercise, "id">;
  setEntries!: EntityTable<SetEntry, "id">;
  syncOperations!: EntityTable<SyncOperation, "id">;

  constructor() {
    super("mypr");
    this.version(1).stores({
      profiles: "id, updatedAt",
      exercises: "id, name, source, archivedAt, updatedAt",
      workouts: "id, performedAt, status, updatedAt, deletedAt",
      workoutExercises: "id, workoutId, exerciseId, order, updatedAt, deletedAt",
      setEntries: "id, workoutExerciseId, order, completed, updatedAt, deletedAt",
      syncOperations: "id, entity, recordId, createdAt, syncedAt",
    });
  }
}

export const db = new MyPrDatabase();

const defaultExercises = [
  ["00000000-0000-4000-8000-000000000001", "Supino reto", "Peito"],
  ["00000000-0000-4000-8000-000000000002", "Supino inclinado", "Peito"],
  ["00000000-0000-4000-8000-000000000003", "Crucifixo", "Peito"],
  ["00000000-0000-4000-8000-000000000004", "Tríceps pulley", "Tríceps"],
  ["00000000-0000-4000-8000-000000000005", "Agachamento livre", "Pernas"],
  ["00000000-0000-4000-8000-000000000006", "Leg press", "Pernas"],
  ["00000000-0000-4000-8000-000000000007", "Puxada frontal", "Costas"],
  ["00000000-0000-4000-8000-000000000008", "Remada baixa", "Costas"],
  ["00000000-0000-4000-8000-000000000009", "Rosca direta", "Bíceps"],
  ["00000000-0000-4000-8000-000000000010", "Desenvolvimento", "Ombros"],
] as const;

let initializationPromise: Promise<void> | undefined;

export function initializeDatabase() {
  initializationPromise ??= initializeDatabaseOnce();
  return initializationPromise;
}

async function initializeDatabaseOnce() {
  if ((await db.exercises.count()) > 0) return;
  const now = new Date().toISOString();
  const exercises: Exercise[] = defaultExercises.map(([id, name, muscleGroup]) => ({
    id,
    name,
    muscleGroup,
    source: "default",
    createdAt: now,
    updatedAt: now,
  }));
  await db.exercises.bulkAdd(exercises);

  const sampleDates = [subDays(new Date(), 2), subDays(new Date(), 5), subDays(new Date(), 9), subDays(new Date(), 14)];
  const loads = [32, 30, 27.5, 25];
  const workouts: Workout[] = [];
  const links: WorkoutExercise[] = [];
  const entries: SetEntry[] = [];

  sampleDates.forEach((date, index) => {
    const workoutId = crypto.randomUUID();
    const timestamp = date.toISOString();
    workouts.push({
      id: workoutId,
      performedAt: format(date, "yyyy-MM-dd"),
      status: "completed",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    exercises.slice(0, index % 2 === 0 ? 4 : 3).forEach((exercise, exerciseIndex) => {
      const linkId = crypto.randomUUID();
      links.push({
        id: linkId,
        workoutId,
        exerciseId: exercise.id,
        order: exerciseIndex,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      for (let setIndex = 0; setIndex < 3; setIndex += 1) {
        entries.push({
          id: crypto.randomUUID(),
          workoutExerciseId: linkId,
          order: setIndex,
          reps: exerciseIndex < 2 ? 10 : 12,
          loadKg: Math.max(8, loads[index] - exerciseIndex * 5),
          completed: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
    });
  });

  await db.transaction("rw", [db.workouts, db.workoutExercises, db.setEntries], async () => {
    await db.workouts.bulkAdd(workouts);
    await db.workoutExercises.bulkAdd(links);
    await db.setEntries.bulkAdd(entries);
  });
}

export async function saveExercise(input: { id?: string; name: string; muscleGroup?: string }) {
  const now = new Date().toISOString();
  const existing = input.id ? await db.exercises.get(input.id) : undefined;
  const exercise: Exercise = {
    id: existing?.id ?? crypto.randomUUID(),
    name: input.name.trim(),
    muscleGroup: input.muscleGroup?.trim() || undefined,
    source: existing?.source ?? "custom",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await db.transaction("rw", [db.exercises, db.syncOperations], async () => {
    await db.exercises.put(exercise);
    await db.syncOperations.where("recordId").equals(exercise.id).filter((operation) => !operation.syncedAt).delete();
    await db.syncOperations.add({
      id: crypto.randomUUID(),
      entity: "exercise",
      recordId: exercise.id,
      action: "upsert",
      payload: exercise,
      createdAt: now,
    });
  });
  return exercise;
}

export async function archiveExercise(id: string) {
  const exercise = await db.exercises.get(id);
  if (!exercise) return;
  const now = new Date().toISOString();
  const archived = { ...exercise, archivedAt: now, updatedAt: now };
  await db.transaction("rw", [db.exercises, db.syncOperations], async () => {
    await db.exercises.put(archived);
    await db.syncOperations.where("recordId").equals(id).filter((operation) => !operation.syncedAt).delete();
    await db.syncOperations.add({
      id: crypto.randomUUID(),
      entity: "exercise",
      recordId: id,
      action: "upsert",
      payload: archived,
      createdAt: now,
    });
  });
}

export async function saveWorkoutBundle(bundle: WorkoutBundle) {
  const now = new Date().toISOString();
  await db.transaction(
    "rw",
    [db.workouts, db.workoutExercises, db.setEntries, db.syncOperations],
    async () => {
      const oldLinks = await db.workoutExercises.where("workoutId").equals(bundle.workout.id).toArray();
      const oldLinkIds = oldLinks.map((link) => link.id);
      await db.workouts.put(bundle.workout);
      await db.workoutExercises.where("workoutId").equals(bundle.workout.id).delete();
      if (oldLinkIds.length > 0) {
        await db.setEntries.where("workoutExerciseId").anyOf(oldLinkIds).delete();
      }
      await db.workoutExercises.bulkPut(bundle.exercises);
      await db.setEntries.bulkPut(bundle.sets);
      await db.syncOperations.where("recordId").equals(bundle.workout.id).filter((operation) => !operation.syncedAt).delete();
      await db.syncOperations.add({
        id: crypto.randomUUID(),
        entity: "workout_bundle",
        recordId: bundle.workout.id,
        action: "upsert",
        payload: bundle,
        createdAt: now,
      });
    },
  );
}

export async function workoutBundle(id: string): Promise<WorkoutBundle | undefined> {
  const workout = await db.workouts.get(id);
  if (!workout) return undefined;
  const exercises = await db.workoutExercises.where("workoutId").equals(id).sortBy("order");
  const sets =
    exercises.length === 0
      ? []
      : await db.setEntries.where("workoutExerciseId").anyOf(exercises.map((item) => item.id)).toArray();
  return { workout, exercises, sets };
}

export async function resetLocalData() {
  await db.delete();
  await db.open();
  initializationPromise = undefined;
  await initializeDatabase();
}

export async function exportLocalData() {
  const [profiles, exercises, workouts, workoutExercises, setEntries] = await Promise.all([
    db.profiles.toArray(),
    db.exercises.toArray(),
    db.workouts.toArray(),
    db.workoutExercises.toArray(),
    db.setEntries.toArray(),
  ]);
  return { exportedAt: new Date().toISOString(), profiles, exercises, workouts, workoutExercises, setEntries };
}
