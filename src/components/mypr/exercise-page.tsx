"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { MarkRecord } from "@/components/mypr/icons";
import type { Exercise, SetEntry, Workout, WorkoutExercise } from "@/lib/domain";
import { exerciseMarks, exerciseSessions } from "@/lib/exercise-detail";
import { parseWorkoutDate } from "@/lib/analytics";

const chartConfig = {
  maxLoadKg: { label: "Carga máxima", color: "#E26A45" },
  estimated1rmKg: { label: "1RM estimado", color: "#C4B49F" },
} satisfies ChartConfig;

const markLabel = { load: "Carga", estimated1rm: "1RM", reps: "Repetições" } as const;

export function ExercisePage({
  exerciseId,
  exercises,
  workouts,
  workoutExercises,
  sets,
  onBack,
}: {
  exerciseId: string;
  exercises: Exercise[];
  workouts: Workout[];
  workoutExercises: WorkoutExercise[];
  sets: SetEntry[];
  onBack: () => void;
}) {
  const exercise = exercises.find((item) => item.id === exerciseId);
  const sessions = useMemo(
    () => exerciseSessions(exerciseId, workouts, workoutExercises, sets),
    [exerciseId, sets, workoutExercises, workouts],
  );
  const marks = useMemo(() => exerciseMarks(sessions), [sessions]);
  const [showVolume, setShowVolume] = useState(false);
  const trend = [...sessions].reverse().map((session) => ({
    label: format(parseWorkoutDate(session.date), "dd/MM"),
    maxLoadKg: Math.round(session.maxLoadKg * 10) / 10,
    estimated1rmKg: Math.round(session.estimated1rmKg * 10) / 10,
    volumeKg: Math.round(session.volumeKg),
  }));

  return (
    <div className="mx-auto w-full max-w-xl space-y-8 pb-8">
      <header className="border-b border-foreground pb-4">
        <button type="button" className="mypr-kicker" onClick={onBack}>Voltar</button>
        <h1 className="mt-3 text-5xl leading-none">{exercise?.name ?? "Exercício"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{exercise?.muscleGroup ?? "Sem grupo"}</p>
      </header>

      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma série concluída neste exercício.</p>
      ) : (
        <>
          <section className="grid grid-cols-3 gap-3">
            {marks.map((mark) => (
              <div key={mark.kind} className="border-t border-foreground pt-3">
                <p className="mypr-kicker">{markLabel[mark.kind]}</p>
                <p className="mypr-num mt-2 text-2xl">
                  {mark.kind === "reps" ? mark.value : mark.value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                  <span className="ml-1 text-xs text-muted-foreground">{mark.kind === "reps" ? "reps" : "kg"}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {mark.kind === "reps" ? `${mark.loadKg.toLocaleString("pt-BR")} kg` : `${mark.reps} reps`}
                </p>
              </div>
            ))}
          </section>

          <section>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-2xl">Carga</h2>
              <button type="button" className="text-sm text-primary" onClick={() => setShowVolume((current) => !current)}>
                {showVolume ? "Ocultar volume" : "Mostrar volume"}
              </button>
            </div>
            <ChartContainer config={chartConfig} className="h-52 w-full aspect-auto">
              <LineChart data={trend} margin={{ left: 0, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} width={36} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="linear" dataKey="estimated1rmKg" stroke="var(--color-estimated1rmKg)" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
                <Line type="linear" dataKey="maxLoadKg" stroke="var(--color-maxLoadKg)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
            {showVolume ? (
              <ul className="mt-3">
                {sessions.slice(0, 8).map((session) => (
                  <li key={`${session.workoutId}-vol`} className="flex justify-between border-t border-border py-1 text-sm">
                    <span>{format(parseWorkoutDate(session.date), "d MMM", { locale: ptBR })}</span>
                    <span className="mypr-num">{session.volumeKg.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} kg</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section>
            <h2 className="text-2xl">Últimas sessões</h2>
            <ul className="mt-3">
              {sessions.slice(0, 8).map((session) => (
                <li key={session.workoutId} className="border-t border-border py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm">{format(parseWorkoutDate(session.date), "d 'de' MMMM", { locale: ptBR })}</span>
                    {marks.some((mark) => mark.date === session.date) ? <MarkRecord className="size-4 text-record" /> : null}
                  </div>
                  <p className="mypr-num mt-1 text-sm text-muted-foreground">
                    {session.sets.map((set) => `${set.loadKg.toLocaleString("pt-BR")} × ${set.reps}`).join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
