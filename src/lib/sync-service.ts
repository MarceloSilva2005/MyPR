"use client";

import { db } from "@/lib/db";
import type { Exercise, Profile, WorkoutBundle } from "@/lib/domain";
import { getSupabaseClient } from "@/lib/supabase";

function exerciseRow(exercise: Exercise, userId: string) {
  return {
    id: exercise.id,
    user_id: userId,
    name: exercise.name,
    muscle_group: exercise.muscleGroup ?? null,
    source: exercise.source,
    archived_at: exercise.archivedAt ?? null,
    created_at: exercise.createdAt,
    updated_at: exercise.updatedAt,
  };
}

function profileRow(profile: Profile, userId: string) {
  return {
    user_id: userId,
    display_name: profile.name,
    weight_unit: profile.weightUnit,
    theme: profile.theme,
    updated_at: profile.updatedAt,
  };
}

async function pushWorkoutBundle(bundle: WorkoutBundle, userId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase não configurado");

  const { error: workoutError } = await supabase.from("workouts").upsert({
    id: bundle.workout.id,
    user_id: userId,
    performed_at: bundle.workout.performedAt,
    status: bundle.workout.status,
    created_at: bundle.workout.createdAt,
    updated_at: bundle.workout.updatedAt,
    deleted_at: bundle.workout.deletedAt ?? null,
  });
  if (workoutError) throw workoutError;

  if (bundle.exercises.length > 0) {
    const { error } = await supabase.from("workout_exercises").upsert(
      bundle.exercises.map((item) => ({
        id: item.id,
        user_id: userId,
        workout_id: item.workoutId,
        exercise_id: item.exerciseId,
        position: item.order,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
        deleted_at: item.deletedAt ?? null,
      })),
    );
    if (error) throw error;
  }

  if (bundle.sets.length > 0) {
    const { error } = await supabase.from("set_entries").upsert(
      bundle.sets.map((item) => ({
        id: item.id,
        user_id: userId,
        workout_exercise_id: item.workoutExerciseId,
        position: item.order,
        reps: item.reps,
        load_kg: item.loadKg,
        completed: item.completed,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
        deleted_at: item.deletedAt ?? null,
      })),
    );
    if (error) throw error;
  }
}

async function pullRemoteData(userId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const [exerciseResult, workoutResult, linkResult, setResult] = await Promise.all([
    supabase.from("exercises").select("*").eq("user_id", userId),
    supabase.from("workouts").select("*").eq("user_id", userId),
    supabase.from("workout_exercises").select("*").eq("user_id", userId),
    supabase.from("set_entries").select("*").eq("user_id", userId),
  ]);
  const error = exerciseResult.error ?? workoutResult.error ?? linkResult.error ?? setResult.error;
  if (error) throw error;

  await db.transaction("rw", [db.exercises, db.workouts, db.workoutExercises, db.setEntries], async () => {
    await db.exercises.bulkPut((exerciseResult.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      muscleGroup: row.muscle_group ?? undefined,
      source: row.source,
      archivedAt: row.archived_at ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })));
    await db.workouts.bulkPut((workoutResult.data ?? []).map((row) => ({
      id: row.id,
      performedAt: row.performed_at,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at ?? undefined,
    })));
    await db.workoutExercises.bulkPut((linkResult.data ?? []).map((row) => ({
      id: row.id,
      workoutId: row.workout_id,
      exerciseId: row.exercise_id,
      order: row.position,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at ?? undefined,
    })));
    await db.setEntries.bulkPut((setResult.data ?? []).map((row) => ({
      id: row.id,
      workoutExerciseId: row.workout_exercise_id,
      order: row.position,
      reps: row.reps,
      loadKg: Number(row.load_kg),
      completed: row.completed,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at ?? undefined,
    })));
  });
}

export async function syncNow() {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Configure as variáveis do Supabase para ativar a sincronização.");
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error("Entre na sua conta para sincronizar.");
  const userId = authData.user.id;
  const localExercises = await db.exercises.toArray();
  if (localExercises.length > 0) {
    const { error } = await supabase.from("exercises").upsert(
      localExercises.map((exercise) => exerciseRow(exercise, userId)),
    );
    if (error) throw error;
  }
  const pending = await db.syncOperations.filter((operation) => !operation.syncedAt).sortBy("createdAt");

  for (const operation of pending) {
    if (operation.entity === "exercise") {
      const { error } = await supabase
        .from("exercises")
        .upsert(exerciseRow(operation.payload as Exercise, userId));
      if (error) throw error;
    } else if (operation.entity === "profile") {
      const { error } = await supabase
        .from("profiles")
        .upsert(profileRow(operation.payload as Profile, userId));
      if (error) throw error;
    } else if (operation.entity === "workout_bundle") {
      await pushWorkoutBundle(operation.payload as WorkoutBundle, userId);
    }
    await db.syncOperations.update(operation.id, { syncedAt: new Date().toISOString() });
  }

  await pullRemoteData(userId);

  return pending.length;
}
