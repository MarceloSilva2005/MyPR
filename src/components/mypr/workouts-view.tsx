"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ChevronRight, Copy, Dumbbell, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { WorkoutSummary } from "@/lib/domain";
import { EmptyState } from "@/components/mypr/empty-state";

export function WorkoutsView({
  summaries,
  onStartWorkout,
  onOpenWorkout,
  onRepeatWorkout,
}: {
  summaries: WorkoutSummary[];
  onStartWorkout: () => void;
  onOpenWorkout: (id: string) => void;
  onRepeatWorkout: (id: string) => void;
}) {
  const [filter, setFilter] = useState<"all" | "month" | "draft">("all");
  const visible = useMemo(() => {
    const now = new Date();
    return summaries.filter((workout) => {
      if (filter === "draft") return workout.status !== "completed";
      if (filter === "month") {
        const date = parseISO(workout.performedAt);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [filter, summaries]);

  const trainedDays = new Set(summaries.filter((workout) => workout.status === "completed").map((workout) => workout.performedAt));
  const calendarDays = Array.from({ length: 35 }, (_, index) => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    return new Date(now.getFullYear(), now.getMonth(), index - offset + 1);
  });

  return (
    <div className="space-y-6 pb-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Sua consistência em um só lugar</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Treinos</h1>
        </div>
        <Button onClick={onStartWorkout}><Plus /> <span className="hidden sm:inline">Novo treino</span></Button>
      </header>

      <div className="grid gap-5 lg:grid-cols-[.8fr_1.4fr]">
        <Card className="h-fit border-border/70 bg-card/70 shadow-none">
          <CardContent className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-semibold capitalize">{format(new Date(), "MMMM yyyy", { locale: ptBR })}</p>
                <p className="text-xs text-muted-foreground">{trainedDays.size} dias treinados no histórico</p>
              </div>
              <CalendarDays className="size-5 text-primary" />
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {["S", "T", "Q", "Q", "S", "S", "D"].map((day, index) => <span key={`${day}-${index}`} className="py-1 text-[11px] text-muted-foreground">{day}</span>)}
              {calendarDays.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const inMonth = day.getMonth() === new Date().getMonth();
                const trained = trainedDays.has(key);
                return (
                  <span key={key} className={`grid aspect-square place-items-center rounded-lg text-xs ${trained ? "bg-primary font-semibold text-primary-foreground" : inMonth ? "bg-secondary/45" : "text-muted-foreground/35"}`}>
                    {format(day, "d")}
                  </span>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <section aria-labelledby="history-title">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="history-title" className="font-semibold">Histórico</h2>
            <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="month">Este mês</TabsTrigger>
                <TabsTrigger value="draft">Rascunhos</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {visible.length === 0 ? (
            <EmptyState icon={Filter} title="Nenhum treino neste filtro" description="Altere o período ou registre um novo treino." actionLabel="Novo treino" onAction={onStartWorkout} />
          ) : (
            <div className="space-y-2">
              {visible.map((workout) => (
                <Card key={workout.id} className="border-border/70 bg-card/65 shadow-none transition hover:border-primary/30">
                  <CardContent className="flex items-center gap-3 p-3 sm:p-4">
                    <button type="button" onClick={() => onOpenWorkout(workout.id)} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground"><Dumbbell className="size-4.5" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="font-medium">{format(parseISO(workout.performedAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                          {workout.status !== "completed" ? <Badge variant="secondary">Rascunho</Badge> : null}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {workout.exerciseNames.join(" · ") || "Sem exercícios"}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {workout.exerciseCount} exercícios · {workout.setCount} séries · {workout.volumeKg.toLocaleString("pt-BR")} kg
                        </span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                    {workout.status === "completed" ? (
                      <Button variant="ghost" size="icon" aria-label="Repetir treino" className="shrink-0 text-primary" onClick={() => onRepeatWorkout(workout.id)}><Copy /></Button>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
