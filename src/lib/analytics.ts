import {
  endOfMonth,
  endOfWeek,
  format,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type {
  Exercise,
  ExerciseTrendPoint,
  PeriodMetrics,
  PersonalRecord,
  SetEntry,
  Workout,
  WorkoutExercise,
  WorkoutSummary,
} from "@/lib/domain";

export function parseWorkoutDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, 12, 0, 0);
}

export function isWorkoutInMonth(date: string, reference = new Date()) {
  const workoutDate = parseWorkoutDate(date);
  return workoutDate.getFullYear() === reference.getFullYear() && workoutDate.getMonth() === reference.getMonth();
}

export function estimatedOneRepMax(loadKg: number, reps: number) {
  if (loadKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return loadKg;
  return loadKg * (1 + reps / 30);
}

export function setVolume(set: Pick<SetEntry, "loadKg" | "reps" | "completed">) {
  return set.completed ? set.loadKg * set.reps : 0;
}

export function summarizeWorkouts(
  workouts: Workout[],
  workoutExercises: WorkoutExercise[],
  sets: SetEntry[],
  exercises: Exercise[],
): WorkoutSummary[] {
  const exerciseMap = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const linksByWorkout = new Map<string, WorkoutExercise[]>();
  const setsByLink = new Map<string, SetEntry[]>();

  for (const link of workoutExercises) {
    if (link.deletedAt) continue;
    const bucket = linksByWorkout.get(link.workoutId) ?? [];
    bucket.push(link);
    linksByWorkout.set(link.workoutId, bucket);
  }

  for (const set of sets) {
    if (set.deletedAt) continue;
    const bucket = setsByLink.get(set.workoutExerciseId) ?? [];
    bucket.push(set);
    setsByLink.set(set.workoutExerciseId, bucket);
  }

  return workouts
    .filter((workout) => !workout.deletedAt)
    .map((workout) => {
      const links = linksByWorkout.get(workout.id) ?? [];
      const completedSets = links.flatMap((link) => setsByLink.get(link.id) ?? []).filter((set) => set.completed);
      return {
        ...workout,
        exerciseCount: links.length,
        setCount: completedSets.length,
        totalReps: completedSets.reduce((sum, set) => sum + set.reps, 0),
        volumeKg: completedSets.reduce((sum, set) => sum + setVolume(set), 0),
        exerciseNames: links
          .sort((a, b) => a.order - b.order)
          .map((link) => exerciseMap.get(link.exerciseId)?.name)
          .filter((name): name is string => Boolean(name)),
      };
    })
    .sort((a, b) => b.performedAt.localeCompare(a.performedAt));
}

export function metricsForInterval(
  summaries: WorkoutSummary[],
  start: Date,
  end: Date,
): PeriodMetrics {
  const matching = summaries.filter(
    (workout) =>
      workout.status === "completed" &&
      isWithinInterval(new Date(`${workout.performedAt}T12:00:00`), { start, end }),
  );
  return matching.reduce<PeriodMetrics>(
    (acc, workout) => ({
      workouts: acc.workouts + 1,
      sets: acc.sets + workout.setCount,
      reps: acc.reps + workout.totalReps,
      volumeKg: acc.volumeKg + workout.volumeKg,
    }),
    { workouts: 0, sets: 0, reps: 0, volumeKg: 0 },
  );
}

export function comparisonPeriods(summaries: WorkoutSummary[], now = new Date()) {
  const weekOptions = { weekStartsOn: 1 as const };
  const previousWeekDate = subWeeks(now, 1);
  const previousMonthDate = subMonths(now, 1);
  return {
    week: {
      current: metricsForInterval(summaries, startOfWeek(now, weekOptions), endOfWeek(now, weekOptions)),
      previous: metricsForInterval(
        summaries,
        startOfWeek(previousWeekDate, weekOptions),
        endOfWeek(previousWeekDate, weekOptions),
      ),
    },
    month: {
      current: metricsForInterval(summaries, startOfMonth(now), endOfMonth(now)),
      previous: metricsForInterval(
        summaries,
        startOfMonth(previousMonthDate),
        endOfMonth(previousMonthDate),
      ),
    },
  };
}

export function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

export function currentWorkoutStreak(summaries: Pick<Workout, "performedAt" | "status" | "deletedAt">[]) {
  const workoutDates = new Set(
    summaries
      .filter((workout) => workout.status === "completed" && !workout.deletedAt)
      .map((workout) => workout.performedAt),
  );

  if (workoutDates.size === 0) return 0;

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterday = subDays(start, 1);

  const candidateDays = [start, yesterday];
  for (const day of candidateDays) {
    const key = format(day, "yyyy-MM-dd");
    if (!workoutDates.has(key)) continue;

    let streak = 1;
    let previousDay = subDays(day, 1);
    while (workoutDates.has(format(previousDay, "yyyy-MM-dd"))) {
      streak += 1;
      previousDay = subDays(previousDay, 1);
    }
    return streak;
  }

  const latestWorkout = [...workoutDates].sort((a, b) => b.localeCompare(a))[0];
  if (!latestWorkout) return 0;

  const latestDate = new Date(`${latestWorkout}T12:00:00`);
  const sameDay = format(start, "yyyy-MM-dd") === latestWorkout;
  const previousDayMatch = format(yesterday, "yyyy-MM-dd") === latestWorkout;
  if (sameDay || previousDayMatch) {
    let currentStreak = 1;
    let current = subDays(latestDate, 1);
    while (workoutDates.has(format(current, "yyyy-MM-dd"))) {
      currentStreak += 1;
      current = subDays(current, 1);
    }
    return currentStreak;
  }

  return 0;
}

export function exerciseTrend(
  exerciseId: string,
  workouts: Workout[],
  workoutExercises: WorkoutExercise[],
  sets: SetEntry[],
): ExerciseTrendPoint[] {
  const workoutMap = new Map(workouts.map((workout) => [workout.id, workout]));
  return workoutExercises
    .filter((link) => link.exerciseId === exerciseId && !link.deletedAt)
    .map((link) => {
      const workout = workoutMap.get(link.workoutId);
      const completed = sets.filter(
        (set) => set.workoutExerciseId === link.id && set.completed && !set.deletedAt,
      );
      if (!workout || workout.status !== "completed" || completed.length === 0) return null;
      return {
        date: workout.performedAt,
        label: format(new Date(`${workout.performedAt}T12:00:00`), "dd/MM", { locale: ptBR }),
        maxLoadKg: Math.max(...completed.map((set) => set.loadKg)),
        estimated1rmKg: Math.max(...completed.map((set) => estimatedOneRepMax(set.loadKg, set.reps))),
        volumeKg: completed.reduce((sum, set) => sum + setVolume(set), 0),
      };
    })
    .filter((point): point is ExerciseTrendPoint => point !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function personalRecords(
  workouts: Workout[],
  workoutExercises: WorkoutExercise[],
  sets: SetEntry[],
  exercises: Exercise[],
): PersonalRecord[] {
  const records: PersonalRecord[] = [];
  for (const exercise of exercises.filter((item) => !item.archivedAt)) {
    const trend = exerciseTrend(exercise.id, workouts, workoutExercises, sets);
    if (trend.length === 0) continue;
    const bestLoad = trend.reduce((best, point) => (point.maxLoadKg > best.maxLoadKg ? point : best));
    const bestOneRm = trend.reduce((best, point) =>
      point.estimated1rmKg > best.estimated1rmKg ? point : best,
    );
    const bestVolume = trend.reduce((best, point) => (point.volumeKg > best.volumeKg ? point : best));
    records.push(
      {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        kind: "load",
        value: bestLoad.maxLoadKg,
        unit: "kg",
        date: bestLoad.date,
      },
      {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        kind: "estimated1rm",
        value: bestOneRm.estimated1rmKg,
        unit: "kg",
        date: bestOneRm.date,
      },
      {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        kind: "sessionVolume",
        value: bestVolume.volumeKg,
        unit: "kg",
        date: bestVolume.date,
      },
    );
  }
  return records.sort((a, b) => b.date.localeCompare(a.date));
}
