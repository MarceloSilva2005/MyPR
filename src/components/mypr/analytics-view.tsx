"use client";

import { useMemo, useState } from "react";
import { Activity, CalendarCheck2, Dumbbell, Repeat2, Trophy } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { Exercise, PersonalRecord, SetEntry, Workout, WorkoutExercise, WorkoutSummary } from "@/lib/domain";
import { comparisonPeriods, exerciseTrend, percentChange } from "@/lib/analytics";
import { MetricCard } from "@/components/mypr/metric-card";
import { EmptyState } from "@/components/mypr/empty-state";

const loadConfig = {
  maxLoadKg: { label: "Carga máxima", color: "#2f83ff" },
  estimated1rmKg: { label: "1RM estimado", color: "#7bb3ff" },
} satisfies ChartConfig;

const volumeConfig = {
  volumeKg: { label: "Volume", color: "#2f83ff" },
} satisfies ChartConfig;

export function AnalyticsView({
  exercises,
  workouts,
  workoutExercises,
  sets,
  summaries,
  records,
}: {
  exercises: Exercise[];
  workouts: Workout[];
  workoutExercises: WorkoutExercise[];
  sets: SetEntry[];
  summaries: WorkoutSummary[];
  records: PersonalRecord[];
}) {
  const available = exercises.filter((exercise) =>
    workoutExercises.some((link) => link.exerciseId === exercise.id),
  );
  const [selectedExercise, setSelectedExercise] = useState(available[0]?.id ?? "");
  const [period, setPeriod] = useState<"week" | "month">("week");
  const periods = useMemo(() => comparisonPeriods(summaries), [summaries]);
  const metrics = periods[period];
  const trend = useMemo(
    () => exerciseTrend(selectedExercise, workouts, workoutExercises, sets),
    [selectedExercise, workouts, workoutExercises, sets],
  );
  const selected = exercises.find((exercise) => exercise.id === selectedExercise);
  const selectedRecords = records.filter((record) => record.exerciseId === selectedExercise);

  return (
    <div className="space-y-6 pb-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Veja o que mudou, não apenas o que treinou</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Evolução</h1>
        </div>
        <Tabs value={period} onValueChange={(value) => setPeriod(value as typeof period)}>
          <TabsList>
            <TabsTrigger value="week">Semanal</TabsTrigger>
            <TabsTrigger value="month">Mensal</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Treinos" value={metrics.current.workouts} icon={Dumbbell} change={percentChange(metrics.current.workouts, metrics.previous.workouts)} />
        <MetricCard label="Volume total" value={metrics.current.volumeKg.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} suffix="kg" icon={Activity} change={percentChange(metrics.current.volumeKg, metrics.previous.volumeKg)} />
        <MetricCard label="Séries" value={metrics.current.sets} icon={Repeat2} change={percentChange(metrics.current.sets, metrics.previous.sets)} />
        <MetricCard label="Repetições" value={metrics.current.reps} icon={CalendarCheck2} change={percentChange(metrics.current.reps, metrics.previous.reps)} />
      </div>

      {available.length === 0 ? (
        <EmptyState icon={Activity} title="Ainda não há evolução para mostrar" description="Finalize um treino para gerar gráficos, comparações e recordes." />
      ) : (
        <>
          <Card className="border-border/70 bg-card/70 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
              <div>
                <CardTitle className="text-base">Desempenho por exercício</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Somente séries concluídas entram nos cálculos</p>
              </div>
              <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                <SelectTrigger className="h-10 w-44 bg-background sm:w-56"><SelectValue placeholder="Exercício" /></SelectTrigger>
                <SelectContent>
                  {available.map((exercise) => <SelectItem key={exercise.id} value={exercise.id}>{exercise.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <ChartContainer config={loadConfig} className="h-64 w-full aspect-auto">
                <AreaChart data={trend} margin={{ left: -14, right: 8, top: 16 }}>
                  <defs>
                    <linearGradient id="loadFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-maxLoadKg)" stopOpacity={0.38} /><stop offset="100%" stopColor="var(--color-maxLoadKg)" stopOpacity={0.02} /></linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value} kg`} width={48} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="estimated1rmKg" stroke="var(--color-estimated1rmKg)" fill="transparent" strokeDasharray="4 4" strokeWidth={2} />
                  <Area type="monotone" dataKey="maxLoadKg" stroke="var(--color-maxLoadKg)" fill="url(#loadFill)" strokeWidth={2.5} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
            <Card className="border-border/70 bg-card/70 shadow-none">
              <CardHeader><CardTitle className="text-base">Volume por sessão</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={volumeConfig} className="h-56 w-full aspect-auto">
                  <BarChart data={trend} margin={{ left: -6, right: 6 }}>
                    <CartesianGrid vertical={false} strokeDasharray="4 4" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
                    <YAxis tickLine={false} axisLine={false} width={52} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="volumeKg" fill="var(--color-volumeKg)" radius={[6, 6, 2, 2]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="border-amber-400/20 bg-[linear-gradient(145deg,rgba(245,158,11,.1),rgba(16,27,49,.7))] shadow-none">
              <CardHeader>
                <span className="mb-1 grid size-10 place-items-center rounded-xl bg-amber-400/15 text-amber-300"><Trophy className="size-5" /></span>
                <CardTitle className="text-base">Recordes · {selected?.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedRecords.map((record) => (
                  <div key={`${record.kind}-${record.date}`} className="flex items-center justify-between rounded-xl bg-background/35 p-3">
                    <span className="text-sm text-muted-foreground">{record.kind === "load" ? "Maior carga" : record.kind === "estimated1rm" ? "1RM estimado" : "Maior volume"}</span>
                    <span className="font-mono font-bold text-amber-300">{record.value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} {record.unit}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
