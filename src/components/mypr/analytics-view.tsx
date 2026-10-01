"use client";

import { useMemo, useState } from "react";
import { MarkBar, MarkLedger, MarkRecord, MarkRepeat, MarkTrend } from "@/components/mypr/icons";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { Exercise, PersonalRecord, SetEntry, Workout, WorkoutExercise, WorkoutSummary } from "@/lib/domain";
import { comparisonPeriods, exerciseTrend, percentChange } from "@/lib/analytics";
import { MetricCard } from "@/components/mypr/metric-card";
import { EmptyState } from "@/components/mypr/empty-state";

const loadConfig = {
  maxLoadKg: { label: "Carga máxima", color: "#E26A45" },
  estimated1rmKg: { label: "1RM estimado", color: "#C4B49F" },
} satisfies ChartConfig;

const volumeConfig = {
  volumeKg: { label: "Volume", color: "#1F6B4A" },
} satisfies ChartConfig;

export function AnalyticsView({
  exercises,
  workouts,
  workoutExercises,
  sets,
  summaries,
  records,
  onBack,
  onOpenExercise,
}: {
  exercises: Exercise[];
  workouts: Workout[];
  workoutExercises: WorkoutExercise[];
  sets: SetEntry[];
  summaries: WorkoutSummary[];
  records: PersonalRecord[];
  onBack?: () => void;
  onOpenExercise?: (exerciseId: string) => void;
}) {
  const available = exercises.filter((exercise) =>
    workoutExercises.some((link) => link.exerciseId === exercise.id),
  );
  const [selectedExercise, setSelectedExercise] = useState(available[0]?.id ?? "");
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [showVolume, setShowVolume] = useState(false);
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
          <p className="mypr-kicker">Carga e 1RM</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Evolução</h1>
          {onBack ? <button type="button" className="mt-2 text-sm text-primary" onClick={onBack}>Voltar para Você</button> : null}
        </div>
        <Tabs value={period} onValueChange={(value) => setPeriod(value as typeof period)}>
          <TabsList>
            <TabsTrigger value="week">Semanal</TabsTrigger>
            <TabsTrigger value="month">Mensal</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Treinos" value={metrics.current.workouts} icon={MarkBar} change={percentChange(metrics.current.workouts, metrics.previous.workouts)} />
        <MetricCard label="Volume total" value={metrics.current.volumeKg.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} suffix="kg" icon={MarkTrend} change={percentChange(metrics.current.volumeKg, metrics.previous.volumeKg)} />
        <MetricCard label="Séries" value={metrics.current.sets} icon={MarkRepeat} change={percentChange(metrics.current.sets, metrics.previous.sets)} />
        <MetricCard label="Repetições" value={metrics.current.reps} icon={MarkLedger} change={percentChange(metrics.current.reps, metrics.previous.reps)} />
      </div>

      {available.length === 0 ? (
        <EmptyState icon={MarkTrend} title="Ainda não há evolução para mostrar" description="Finalize um treino para gerar gráficos, comparações e recordes." />
      ) : (
        <>
          <Card className="border-border/70 bg-card/70 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
              <div>
                <CardTitle className="text-base">Desempenho por exercício</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Somente séries concluídas entram nos cálculos</p>
              </div>
              <div className="flex items-center gap-2">
                {onOpenExercise && selectedExercise ? (
                  <button type="button" className="text-sm text-primary" onClick={() => onOpenExercise(selectedExercise)}>Página</button>
                ) : null}
                <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                  <SelectTrigger className="h-10 w-44 bg-background sm:w-56"><SelectValue placeholder="Exercício" /></SelectTrigger>
                  <SelectContent>
                    {available.map((exercise) => <SelectItem key={exercise.id} value={exercise.id}>{exercise.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={loadConfig} className="h-64 w-full aspect-auto">
                <LineChart data={trend} margin={{ left: -14, right: 8, top: 16 }}>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} width={48} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="estimated1rmKg" stroke="var(--color-estimated1rmKg)" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="maxLoadKg" stroke="var(--color-maxLoadKg)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <button type="button" className="text-sm text-primary" onClick={() => setShowVolume((current) => !current)}>
              {showVolume ? "Ocultar volume" : "Mostrar volume"}
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
            {showVolume ? <Card className="border-border bg-card shadow-none">
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
            </Card> : null}

            <Card className="border-record/40 bg-card shadow-none">
              <CardHeader>
                <MarkRecord className="mb-2 size-5 text-record" />
                <CardTitle className="text-base">Recordes · {selected?.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedRecords.map((record) => (
                  <div key={`${record.kind}-${record.date}`} className="flex items-center justify-between rounded-xl bg-background/35 p-3">
                    <span className="text-sm text-muted-foreground">{record.kind === "load" ? "Maior carga" : record.kind === "estimated1rm" ? "1RM estimado" : "Maior volume"}</span>
                    <span className="mypr-num font-bold text-record">{record.value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} {record.unit}</span>
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
