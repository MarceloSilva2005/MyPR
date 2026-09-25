"use client";

import Dexie, { type EntityTable } from "dexie";
import type {
  Exercise,
  Profile,
  SetEntry,
  SyncOperation,
  Workout,
  WorkoutBundle,
  WorkoutExercise,
  WorkoutTemplate,
} from "@/lib/domain";

export const ACTIVE_PROFILE_STORAGE_KEY = "mypr-active-profile-id";

const LEGACY_DEFAULT_EXERCISE_IDS: Record<string, string> = {
  "default-peito-1": "85dfc248-f912-5096-8974-5bd4172b4db5",
  "default-peito-2": "883ec47a-7abd-55ae-8763-84dd0c415cf2",
  "default-peito-3": "cbae4717-29be-5f7c-8802-9eae87f0e999",
  "default-peito-4": "807318be-c748-55fd-b509-d8fa9a63e6d7",
  "default-ombros-1": "79283cb0-d94b-5f42-be58-e205d59866bb",
  "default-ombros-2": "d11768c5-7f12-523e-8fd6-83305e61b490",
  "default-ombros-3": "2f5cc3aa-cb7e-5da6-9cfe-a2b584cacb89",
  "default-ombros-4": "0570f2d8-15cb-59c7-b887-376160dad548",
  "default-costas-1": "3a44271a-2a61-51d0-8500-e53f347c3db8",
  "default-costas-2": "37a4d6fe-fa20-5524-976c-3e5998e53fc9",
  "default-costas-3": "90e3874d-7921-5dff-8394-9c6aef03cb8f",
  "default-costas-4": "30f443a0-607a-5098-b847-792f277a56e5",
  "default-biceps-1": "47431cd3-e73d-5069-aea0-66f2d4d53bf7",
  "default-biceps-2": "020b01b3-2a2b-51b8-bc99-049d53de89ec",
  "default-biceps-3": "8f03ebb5-6bfe-5db9-82d0-32d8a9be97fc",
  "default-triceps-1": "653ebec2-1031-5743-9690-7b35a61bd3d0",
  "default-triceps-2": "4902852c-7185-5c34-851f-9b4f69084586",
  "default-triceps-3": "21eb2c54-0a77-5c5d-9838-20de698f4d9c",
  "default-pernas-1": "8c67716f-5e17-51d0-9758-6a97f9ceca71",
  "default-pernas-2": "21641e4e-977c-543e-adfe-249af3e3d882",
  "default-pernas-3": "c18ea930-a69c-5a0d-96f6-b108b159950b",
  "default-pernas-4": "e74ba0ac-ac2f-5bf8-bb21-5ea25419dae9",
  "default-pernas-5": "9851a49c-30c1-5838-b7ab-95558bd8fa3a",
  "default-pernas-6": "45732894-e029-5a2b-8878-3cd766ae2019",
  "default-gluteos-1": "7569a1ff-a1de-55c8-9c4c-b7f545c41c65",
  "default-gluteos-2": "ee88285c-c74f-5c0a-8417-143af6f6fed5",
  "default-core-1": "e9d8ea7c-9991-5f55-9b31-4c31f5b4bce7",
  "default-core-2": "d6450a48-2531-51c9-9ac1-362cd2003c76",
  "default-core-3": "9b128051-8567-5a35-b204-c97b4ad544b2",
  "default-core-4": "e02c73fa-5d4f-5907-a257-b79ced05f27b",
  "default-cardio-1": "dbb199ab-4797-52fc-94cd-8c9ab67ed659",
  "default-cardio-2": "5ae8c59e-f2d7-5429-9625-6d5aaf787d98",
  "default-cardio-3": "42ce5ea1-2add-5c55-aae7-6a3fe3cfb0f2",
  "default-antebracos-1": "b73226b5-05a2-5c37-aae9-06c990260b48",
  "default-antebracos-2": "3bf8de31-aeca-5fbf-8ffd-2c6686fb9063",
  "default-panturrilha-1": "fae18161-6ec2-5a37-9bf4-6b700d05185e",
  "default-panturrilha-2": "ad59f90e-d630-50ea-8654-e86cbbf57805",
  "default-ombros-5": "25b300c4-a820-51c2-9deb-100fe86dc81a",
  "default-costas-5": "9ff1b44c-a0bb-53cf-ab92-6266e7020e9a",
  "default-peito-5": "f5b5cc3d-822c-55ab-9a8c-467b6598f7b3",
};

class MyPrDatabase extends Dexie {
  profiles!: EntityTable<Profile, "id">;
  exercises!: EntityTable<Exercise, "id">;
  workouts!: EntityTable<Workout, "id">;
  workoutExercises!: EntityTable<WorkoutExercise, "id">;
  setEntries!: EntityTable<SetEntry, "id">;
  syncOperations!: EntityTable<SyncOperation, "id">;
  templates!: EntityTable<WorkoutTemplate, "id">;

  constructor() {
    super("mypr");
    this.version(2).stores({
      profiles: "id, updatedAt",
      exercises: "id, name, source, archivedAt, updatedAt",
      workouts: "id, performedAt, status, updatedAt, deletedAt",
      workoutExercises: "id, workoutId, exerciseId, order, updatedAt, deletedAt",
      setEntries: "id, workoutExerciseId, order, completed, updatedAt, deletedAt",
      syncOperations: "id, entity, recordId, createdAt, syncedAt",
      templates: "id, name, updatedAt",
    });

    this.version(3)
      .stores({
        profiles: "id, updatedAt",
        exercises: "id, name, source, archivedAt, updatedAt",
        workouts: "id, performedAt, status, updatedAt, deletedAt",
        workoutExercises: "id, workoutId, exerciseId, order, updatedAt, deletedAt",
        setEntries: "id, workoutExerciseId, order, completed, updatedAt, deletedAt",
        syncOperations: "id, entity, recordId, createdAt, syncedAt",
        templates: "id, name, updatedAt",
      })
      .upgrade(async (transaction) => {
        const exercises = transaction.table<Exercise, string>("exercises");
        const workoutExercises = transaction.table<WorkoutExercise, string>("workoutExercises");
        const templates = transaction.table<WorkoutTemplate, string>("templates");
        const syncOperations = transaction.table<SyncOperation, string>("syncOperations");

        for (const [legacyId, uuid] of Object.entries(LEGACY_DEFAULT_EXERCISE_IDS)) {
          const exercise = await exercises.get(legacyId);
          if (!exercise) continue;

          await exercises.put({ ...exercise, id: uuid });
          await workoutExercises.where("exerciseId").equals(legacyId).modify({ exerciseId: uuid });
          await exercises.delete(legacyId);
        }

        const savedTemplates = await templates.toArray();
        for (const template of savedTemplates) {
          const items = template.items.map((item) => ({
            ...item,
            exerciseId: LEGACY_DEFAULT_EXERCISE_IDS[item.exerciseId] ?? item.exerciseId,
          }));
          await templates.put({ ...template, items });
        }

        const operations = await syncOperations.toArray();
        for (const operation of operations) {
          if (operation.entity === "exercise") {
            const payload = operation.payload as Exercise;
            const nextId = LEGACY_DEFAULT_EXERCISE_IDS[payload.id];
            if (nextId) {
              await syncOperations.put({
                ...operation,
                recordId: nextId,
                payload: { ...payload, id: nextId },
              });
            }
            continue;
          }

          if (operation.entity === "workout_bundle") {
            const payload = operation.payload as WorkoutBundle;
            const exercises = payload.exercises.map((item) => ({
              ...item,
              exerciseId: LEGACY_DEFAULT_EXERCISE_IDS[item.exerciseId] ?? item.exerciseId,
            }));
            await syncOperations.put({ ...operation, payload: { ...payload, exercises } });
          }
        }
      });
  }
}

export const db = new MyPrDatabase();

let initializationPromise: Promise<void> | undefined;

const DEFAULT_EXERCISES: ReadonlyArray<
  Omit<Exercise, "id" | "createdAt" | "updatedAt"> & { id: string; createdAt: string; updatedAt: string }
> = [
  { id: "85dfc248-f912-5096-8974-5bd4172b4db5", name: "Supino reto", muscleGroup: "Peito", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "883ec47a-7abd-55ae-8763-84dd0c415cf2", name: "Supino inclinado", muscleGroup: "Peito", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "cbae4717-29be-5f7c-8802-9eae87f0e999", name: "Supino declinado", muscleGroup: "Peito", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "807318be-c748-55fd-b509-d8fa9a63e6d7", name: "Crucifixo", muscleGroup: "Peito", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "79283cb0-d94b-5f42-be58-e205d59866bb", name: "Desenvolvimento militar", muscleGroup: "Ombros", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "d11768c5-7f12-523e-8fd6-83305e61b490", name: "Elevação lateral", muscleGroup: "Ombros", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "2f5cc3aa-cb7e-5da6-9cfe-a2b584cacb89", name: "Elevação frontal", muscleGroup: "Ombros", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "0570f2d8-15cb-59c7-b887-376160dad548", name: "Remada alta", muscleGroup: "Ombros", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "3a44271a-2a61-51d0-8500-e53f347c3db8", name: "Puxada por cima", muscleGroup: "Costas", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "37a4d6fe-fa20-5524-976c-3e5998e53fc9", name: "Remada curta", muscleGroup: "Costas", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "90e3874d-7921-5dff-8394-9c6aef03cb8f", name: "Remada baixa", muscleGroup: "Costas", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "30f443a0-607a-5098-b847-792f277a56e5", name: "Levantamento terra", muscleGroup: "Costas", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "47431cd3-e73d-5069-aea0-66f2d4d53bf7", name: "Rosca direta", muscleGroup: "Bíceps", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "020b01b3-2a2b-51b8-bc99-049d53de89ec", name: "Rosca alternada", muscleGroup: "Bíceps", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "8f03ebb5-6bfe-5db9-82d0-32d8a9be97fc", name: "Rosca martelo", muscleGroup: "Bíceps", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "653ebec2-1031-5743-9690-7b35a61bd3d0", name: "Tríceps francês", muscleGroup: "Tríceps", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "4902852c-7185-5c34-851f-9b4f69084586", name: "Extensão de tríceps na corda", muscleGroup: "Tríceps", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "21eb2c54-0a77-5c5d-9838-20de698f4d9c", name: "Dips", muscleGroup: "Tríceps", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "8c67716f-5e17-51d0-9758-6a97f9ceca71", name: "Agachamento", muscleGroup: "Pernas", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "21641e4e-977c-543e-adfe-249af3e3d882", name: "Leg press", muscleGroup: "Pernas", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "c18ea930-a69c-5a0d-96f6-b108b159950b", name: "Afundo", muscleGroup: "Pernas", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "e74ba0ac-ac2f-5bf8-bb21-5ea25419dae9", name: "Extensão de perna", muscleGroup: "Pernas", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "9851a49c-30c1-5838-b7ab-95558bd8fa3a", name: "Flexão de perna", muscleGroup: "Pernas", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "45732894-e029-5a2b-8878-3cd766ae2019", name: "Panturrilha em pé", muscleGroup: "Pernas", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "7569a1ff-a1de-55c8-9c4c-b7f545c41c65", name: "Hip thrust", muscleGroup: "Glúteos", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "ee88285c-c74f-5c0a-8417-143af6f6fed5", name: "Prensa de pernas", muscleGroup: "Glúteos", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "e9d8ea7c-9991-5f55-9b31-4c31f5b4bce7", name: "Abdominal", muscleGroup: "Core", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "d6450a48-2531-51c9-9ac1-362cd2003c76", name: "Prancha", muscleGroup: "Core", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "9b128051-8567-5a35-b204-c97b4ad544b2", name: "Russian twist", muscleGroup: "Core", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "e02c73fa-5d4f-5907-a257-b79ced05f27b", name: "Levantamento de pernas", muscleGroup: "Core", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "dbb199ab-4797-52fc-94cd-8c9ab67ed659", name: "Bike", muscleGroup: "Cardio", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "5ae8c59e-f2d7-5429-9625-6d5aaf787d98", name: "Corrida", muscleGroup: "Cardio", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "42ce5ea1-2add-5c55-aae7-6a3fe3cfb0f2", name: "Elíptico", muscleGroup: "Cardio", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "b73226b5-05a2-5c37-aae9-06c990260b48", name: "Rosca inversa", muscleGroup: "Antebraço", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "3bf8de31-aeca-5fbf-8ffd-2c6686fb9063", name: "Pronação", muscleGroup: "Antebraço", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "fae18161-6ec2-5a37-9bf4-6b700d05185e", name: "Panturrilha sentada", muscleGroup: "Panturrilha", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "ad59f90e-d630-50ea-8654-e86cbbf57805", name: "Panturrilha em máquina", muscleGroup: "Panturrilha", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "25b300c4-a820-51c2-9deb-100fe86dc81a", name: "Retração de ombros", muscleGroup: "Ombros", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "9ff1b44c-a0bb-53cf-ab92-6266e7020e9a", name: "Puxada direta", muscleGroup: "Costas", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "f5b5cc3d-822c-55ab-9a8c-467b6598f7b3", name: "Press de peito máquina", muscleGroup: "Peito", source: "default", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
];

export function getDefaultExerciseCatalog(): Exercise[] {
  return DEFAULT_EXERCISES.map((exercise) => ({ ...exercise }));
}

export function initializeDatabase() {
  initializationPromise ??= initializeDatabaseOnce();
  return initializationPromise;
}

export function getStoredActiveProfileId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY);
}

export function setStoredActiveProfileId(profileId: string | null) {
  if (typeof window === "undefined") return;
  if (profileId) {
    window.localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, profileId);
    return;
  }
  window.localStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY);
}

async function initializeDatabaseOnce() {
  await db.transaction(
    "rw",
    [db.profiles, db.exercises, db.workouts, db.workoutExercises, db.setEntries, db.syncOperations, db.templates],
    async () => {
      const hasExercises = (await db.exercises.count()) > 0;
      if (!hasExercises) {
        await db.exercises.bulkPut(getDefaultExerciseCatalog());
      }
    },
  );
}

export function buildProfileRecord(
  input: {
    id?: string;
    name: string;
    email?: string;
    age?: number;
    weightKg?: number;
    weightUnit?: Profile["weightUnit"];
    theme?: Profile["theme"];
  },
  now = new Date().toISOString(),
  existing?: Profile,
): Profile {
  return {
    id: existing?.id ?? input.id ?? crypto.randomUUID(),
    name: input.name.trim(),
    email: input.email?.trim() || undefined,
    age: typeof input.age === "number" && Number.isFinite(input.age) ? input.age : existing?.age,
    weightKg: typeof input.weightKg === "number" && Number.isFinite(input.weightKg) ? input.weightKg : existing?.weightKg,
    weightUnit: input.weightUnit ?? existing?.weightUnit ?? "kg",
    theme: input.theme ?? existing?.theme ?? "dark",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export async function saveProfile(input: {
  id?: string;
  name: string;
  email?: string;
  age?: number;
  weightKg?: number;
  weightUnit?: Profile["weightUnit"];
  theme?: Profile["theme"];
}) {
  const now = new Date().toISOString();
  const existing = input.id ? await db.profiles.get(input.id) : undefined;
  const profile = buildProfileRecord(input, now, existing);

  await db.transaction("rw", [db.profiles, db.syncOperations], async () => {
    await db.profiles.put(profile);
    await db.syncOperations
      .where("recordId")
      .equals(profile.id)
      .filter((operation) => operation.entity === "profile" && !operation.syncedAt)
      .delete();
    await db.syncOperations.add({
      id: crypto.randomUUID(),
      entity: "profile",
      recordId: profile.id,
      action: "upsert",
      payload: profile,
      createdAt: now,
    });
  });

  return profile;
}

export async function listProfiles() {
  return db.profiles.orderBy("updatedAt").reverse().toArray();
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

export async function saveWorkoutTemplate(template: WorkoutTemplate) {
  const now = new Date().toISOString();
  const next = {
    ...template,
    updatedAt: now,
    createdAt: template.createdAt || now,
  };
  await db.templates.put(next);
  return next;
}

export async function listWorkoutTemplates() {
  return db.templates.orderBy("updatedAt").reverse().toArray();
}

export async function restoreLocalData(payload: unknown) {
  const data = payload as {
    profiles?: unknown[];
    exercises?: unknown[];
    workouts?: unknown[];
    workoutExercises?: unknown[];
    setEntries?: unknown[];
    templates?: unknown[];
  };

  await db.transaction(
    "rw",
    [db.profiles, db.exercises, db.workouts, db.workoutExercises, db.setEntries, db.syncOperations, db.templates],
    async () => {
      await db.profiles.clear();
      await db.exercises.clear();
      await db.workouts.clear();
      await db.workoutExercises.clear();
      await db.setEntries.clear();
      await db.syncOperations.clear();
      await db.templates.clear();

      if (data.profiles?.length) await db.profiles.bulkPut(data.profiles as never[]);
      if (data.exercises?.length) await db.exercises.bulkPut(data.exercises as never[]);
      if (data.workouts?.length) await db.workouts.bulkPut(data.workouts as never[]);
      if (data.workoutExercises?.length) await db.workoutExercises.bulkPut(data.workoutExercises as never[]);
      if (data.setEntries?.length) await db.setEntries.bulkPut(data.setEntries as never[]);
      if (data.templates?.length) await db.templates.bulkPut(data.templates as never[]);
    },
  );
}

export async function exportLocalData() {
  const [profiles, exercises, workouts, workoutExercises, setEntries, templates] = await Promise.all([
    db.profiles.toArray(),
    db.exercises.toArray(),
    db.workouts.toArray(),
    db.workoutExercises.toArray(),
    db.setEntries.toArray(),
    db.templates.toArray(),
  ]);
  return { exportedAt: new Date().toISOString(), profiles, exercises, workouts, workoutExercises, setEntries, templates };
}
