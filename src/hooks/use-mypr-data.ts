"use client";

import { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { initializeDatabase, db } from "@/lib/db";
import { personalRecords, summarizeWorkouts } from "@/lib/analytics";

export function useMyPrData() {
  useEffect(() => {
    void initializeDatabase();
  }, []);

  const data = useLiveQuery(async () => {
    const [exercises, workouts, workoutExercises, sets, pendingSync] = await Promise.all([
      db.exercises.toArray(),
      db.workouts.toArray(),
      db.workoutExercises.toArray(),
      db.setEntries.toArray(),
      db.syncOperations.filter((operation) => !operation.syncedAt).count(),
    ]);
    const summaries = summarizeWorkouts(workouts, workoutExercises, sets, exercises);
    return {
      exercises,
      workouts,
      workoutExercises,
      sets,
      summaries,
      records: personalRecords(workouts, workoutExercises, sets, exercises),
      pendingSync,
    };
  });

  return data;
}
