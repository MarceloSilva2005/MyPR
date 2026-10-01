"use client";

import { useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MarkPlus } from "@/components/mypr/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PersonalRecord, WorkoutSummary } from "@/lib/domain";
import { isWorkoutInMonth, parseWorkoutDate } from "@/lib/analytics";
import { EmptyState } from "@/components/mypr/empty-state";

export function WorkoutsView({
  summaries,
  records,
  onStartWorkout,
  onOpenWorkout,
  onRepeatWorkout,
}: {
  summaries: WorkoutSummary[];
  records: PersonalRecord[];
  onStartWorkout: () => void;
  onOpenWorkout: (id: string) => void;
  onRepeatWorkout: (id: string) => void;
}) {
  const [filter, setFilter] = useState<"all" | "month" | "draft">("all");
  const recordDates = useMemo(() => new Set(records.map((record) => record.date)), [records]);
  const visible = useMemo(() => {
    const now = new Date();
    return summaries.filter((workout) => {
      if (filter === "draft") return workout.status !== "completed";
      if (filter === "month") return isWorkoutInMonth(workout.performedAt, now);
      return true;
    });
  }, [filter, summaries]);

  return (
    <div className="space-y-6 pb-5">
      <header className="flex items-end justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Histórico</h1>
        <Button onClick={onStartWorkout} className="h-11"><MarkPlus /> Novo</Button>
      </header>

      <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="month">Este mês</TabsTrigger>
          <TabsTrigger value="draft">Rascunhos</TabsTrigger>
        </TabsList>
      </Tabs>

      {visible.length === 0 ? (
        <EmptyState icon={MarkPlus} title="Nenhum treino neste filtro" description="Registre um treino para ver a lista." actionLabel="Novo treino" onAction={onStartWorkout} />
      ) : (
        <div className="space-y-2">
          {visible.map((workout) => (
            <HistoryRow
              key={workout.id}
              workout={workout}
              hasRecord={workout.status === "completed" && recordDates.has(workout.performedAt)}
              onOpen={() => onOpenWorkout(workout.id)}
              onRepeat={workout.status === "completed" ? () => onRepeatWorkout(workout.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryRow({
  workout,
  hasRecord,
  onOpen,
  onRepeat,
}: {
  workout: WorkoutSummary;
  hasRecord: boolean;
  onOpen: () => void;
  onRepeat?: () => void;
}) {
  const startX = useRef<number | null>(null);
  const title = workout.routineName?.trim() || format(parseWorkoutDate(workout.performedAt), "d 'de' MMMM", { locale: ptBR });

  return (
    <div
      className="flex items-center gap-3 border-b border-border py-3"
      onTouchStart={(event) => {
        startX.current = event.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const start = startX.current;
        const end = event.changedTouches[0]?.clientX;
        startX.current = null;
        if (start == null || end == null || !onRepeat) return;
        if (start - end > 72) onRepeat();
      }}
    >
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex items-center gap-2">
          <span className="truncate font-medium">{title}</span>
          {workout.status !== "completed" ? <Badge variant="secondary">Rascunho</Badge> : null}
          {hasRecord ? <Badge className="bg-record text-record-foreground">PR</Badge> : null}
        </span>
        <span className="mt-1 block text-sm text-muted-foreground">
          <span className="mypr-num">{workout.volumeKg.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</span> kg
          {workout.exerciseNames.length > 0 ? ` · ${workout.exerciseNames.join(" · ")}` : ""}
        </span>
      </button>
      {onRepeat ? (
        <Button variant="ghost" size="sm" className="shrink-0 text-primary" onClick={onRepeat}>
          Repetir
        </Button>
      ) : null}
    </div>
  );
}
