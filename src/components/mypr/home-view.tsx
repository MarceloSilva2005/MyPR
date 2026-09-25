"use client";

import { useMemo } from "react";
import { format, isSameDay, startOfWeek, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Activity,
  CalendarDays,
  ChevronRight,
  Dumbbell,
  Flame,
  Plus,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PersonalRecord, WorkoutSummary } from "@/lib/domain";
import { comparisonPeriods, currentWorkoutStreak } from "@/lib/analytics";
import { MetricCard } from "@/components/mypr/metric-card";
import { EmptyState } from "@/components/mypr/empty-state";

export function HomeView({
  summaries,
  records,
  onStartWorkout,
  onOpenWorkout,
  onViewHistory,
  onRepeatLastWorkout,
  onViewProfile,
  onQuickStart,
}: {
  summaries: WorkoutSummary[];
  records: PersonalRecord[];
  onStartWorkout: () => void;
  onOpenWorkout: (id: string) => void;
  onViewHistory: () => void;
  onRepeatLastWorkout?: () => void;
  onViewProfile?: () => void;
  onQuickStart?: () => void;
}) {
  const week = useMemo(() => comparisonPeriods(summaries).week.current, [summaries]);
  const streak = useMemo(() => currentWorkoutStreak(summaries), [summaries]);
  const completedDates = useMemo(
    () => new Set(summaries.filter((workout) => workout.status === "completed").map((workout) => workout.performedAt)),
    [summaries],
  );
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const recent = summaries.filter((workout) => workout.status === "completed").slice(0, 3);
  const recentPr = records.find((record) => record.kind === "load");
  const lastWorkout = recent[0];
  const suggestedExercises = lastWorkout?.exerciseNames.slice(0, 3) ?? [];
  const hasHistory = summaries.length > 0 && summaries.some((workout) => workout.status === "completed");

  if (!hasHistory) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center pb-8">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-3xl bg-primary/10 text-primary shadow-[0_12px_30px_rgba(27,97,255,0.15)]">
            <Dumbbell className="size-10" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight">Comece do zero</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Crie seu primeiro treino e construa seu histórico pessoal.
          </p>
          <div className="mt-6 rounded-2xl border border-border/70 bg-card/60 p-4 text-left">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Próximos passos</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>• cadastre seu primeiro exercício</li>
              <li>• registre o treino em minutos</li>
              <li>• acompanhe sua evolução depois</li>
            </ul>
          </div>
          <div className="mt-8 space-y-3">
            {onViewProfile ? (
              <Button variant="outline" size="lg" className="w-full" onClick={onViewProfile}>
                Adicionar exercício
              </Button>
            ) : null}
            <Button size="lg" className="w-full" onClick={onStartWorkout}>
              <Plus className="size-5" /> Registrar treino
            </Button>
            {onRepeatLastWorkout ? (
              <Button variant="outline" size="lg" className="w-full" onClick={onRepeatLastWorkout}>
                Repetir último treino
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Olá! Pronto para evoluir?</h1>
        </div>
        <Badge variant="outline" className="hidden border-primary/20 bg-primary/10 px-3 py-1 text-primary sm:flex">
          <Flame className="mr-1 size-3.5" />
          {streak > 0 ? `${streak} dias em sequência` : "Comece hoje"}
        </Badge>
      </header>

      <Card className="overflow-hidden border-primary/25 bg-[linear-gradient(135deg,rgba(26,99,255,.22),rgba(16,27,49,.92)_55%)] shadow-[0_18px_60px_rgba(0,0,0,.25)]">
        <CardContent className="relative p-5 sm:p-6">
          <div className="absolute -right-8 -top-10 size-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary-foreground/75">TREINO DE HOJE</p>
              <h2 className="mt-1 text-2xl font-bold">Registre cada série em segundos</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Carga, repetições e volume ficam salvos automaticamente, mesmo sem internet.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <Button size="lg" className="h-12 shrink-0 px-5 shadow-[0_10px_30px_rgba(40,124,255,.28)]" onClick={onQuickStart ?? onStartWorkout}>
                <Plus className="size-5" /> {lastWorkout ? "Treino rápido" : "Registrar treino"}
              </Button>
              {onRepeatLastWorkout ? (
                <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={onRepeatLastWorkout}>
                  Repetir último treino
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {suggestedExercises.length > 0 ? (
        <section aria-labelledby="quick-start-title" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="quick-start-title" className="font-semibold">Começar rápido</h2>
            <span className="text-xs text-muted-foreground">Baseado no último treino</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedExercises.map((exerciseName) => (
              <Button key={exerciseName} variant="secondary" size="sm" onClick={onQuickStart ?? onStartWorkout} className="rounded-full border border-primary/15 bg-primary/8 text-primary hover:bg-primary/12">
                {exerciseName}
              </Button>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="week-title">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="week-title" className="font-semibold">Sua semana</h2>
          <span className="text-xs text-muted-foreground">Seg — Dom</span>
        </div>
        <Card className="border-border/70 bg-card/65 shadow-none">
          <CardContent className="grid grid-cols-7 gap-1 p-3 sm:gap-2 sm:p-4">
            {days.map((day) => {
              const trained = completedDates.has(format(day, "yyyy-MM-dd"));
              const today = isSameDay(day, new Date());
              return (
                <div key={day.toISOString()} className="flex flex-col items-center gap-2 text-center">
                  <span className="text-[11px] font-medium uppercase text-muted-foreground">{format(day, "EEEEE", { locale: ptBR })}</span>
                  <span
                    className={`grid size-9 place-items-center rounded-xl text-sm font-semibold transition-colors ${
                      trained
                        ? "bg-primary text-primary-foreground shadow-[0_6px_18px_rgba(42,127,255,.22)]"
                        : today
                          ? "border border-primary/60 bg-primary/10 text-primary"
                          : "bg-secondary/65 text-muted-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  <span className={`size-1 rounded-full ${trained ? "bg-emerald-400" : "bg-transparent"}`} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Treinos" value={week.workouts} icon={Dumbbell} />
        <MetricCard label="Volume" value={week.volumeKg.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} suffix="kg" icon={Activity} />
        <MetricCard label="Séries" value={week.sets} icon={Trophy} />
      </div>

      <section className="grid gap-3 lg:grid-cols-3">
        <Card className="border-border/70 bg-card/70 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Maior carga</p>
            <p className="mt-3 text-2xl font-bold text-primary">{recentPr ? `${recentPr.value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg` : "—"}</p>
            <p className="mt-1 text-xs text-muted-foreground">{recentPr ? recentPr.exerciseName : "Ainda sem recorde"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/70 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Último treino</p>
            <p className="mt-3 text-2xl font-bold">{lastWorkout ? `${lastWorkout.volumeKg.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} kg` : "—"}</p>
            <p className="mt-1 text-xs text-muted-foreground">{lastWorkout ? `${lastWorkout.exerciseCount} exercícios · ${lastWorkout.setCount} séries` : "Sem treino concluído"}</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-card/70 shadow-none">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Treino sugerido</p>
            <p className="mt-3 text-base font-bold leading-relaxed text-primary">
              {suggestedExercises.length > 0 ? suggestedExercises.join(" · ") : "Comece com o seu primeiro treino"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Baseado no seu histórico recente</p>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_.8fr]">
        <section aria-labelledby="recent-title">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="recent-title" className="font-semibold">Últimos treinos</h2>
            <Button variant="ghost" size="sm" className="text-primary" onClick={onViewHistory}>
              Ver todos <ChevronRight className="size-4" />
            </Button>
          </div>
          {recent.length === 0 ? (
            <EmptyState icon={Dumbbell} title="Seu histórico começa aqui" description="Finalize seu primeiro treino para acompanhar a evolução." actionLabel="Registrar treino" onAction={onStartWorkout} />
          ) : (
            <div className="space-y-2">
              {recent.map((workout) => (
                <button
                  key={workout.id}
                  type="button"
                  onClick={() => onOpenWorkout(workout.id)}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-card/65 p-4 text-left transition hover:border-primary/35 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
                    <CalendarDays className="size-4.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{format(new Date(`${workout.performedAt}T12:00:00`), "d 'de' MMMM", { locale: ptBR })}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {workout.exerciseCount} exercícios · {workout.setCount} séries · {workout.volumeKg.toLocaleString("pt-BR")} kg
                    </span>
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="pr-title">
          <h2 id="pr-title" className="mb-3 font-semibold">PR em destaque</h2>
          <Card className="h-full min-h-40 border-amber-400/20 bg-[linear-gradient(145deg,rgba(245,158,11,.11),rgba(16,27,49,.7))] shadow-none">
            <CardHeader className="pb-2">
              <span className="grid size-10 place-items-center rounded-xl bg-amber-400/15 text-amber-300">
                <Trophy className="size-5" />
              </span>
              <CardTitle className="text-sm text-muted-foreground">Maior carga</CardTitle>
            </CardHeader>
            <CardContent>
              {recentPr ? (
                <>
                  <p className="truncate text-base font-semibold">{recentPr.exerciseName}</p>
                  <p className="mt-1 font-mono text-3xl font-bold text-amber-300">{recentPr.value.toFixed(recentPr.value % 1 ? 1 : 0)} kg</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Seus recordes aparecerão após o primeiro treino.</p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
