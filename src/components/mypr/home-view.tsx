"use client";

import { useMemo } from "react";
import { format, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MarkRecord } from "@/components/mypr/icons";
import type { PersonalRecord, WorkoutSummary, WorkoutTemplate } from "@/lib/domain";
import { currentWorkoutStreak } from "@/lib/analytics";

export function HomeView({
  summaries,
  records,
  templates = [],
  onStartWorkout,
  onContinueWorkout,
  onStartRoutine,
}: {
  summaries: WorkoutSummary[];
  records: PersonalRecord[];
  templates?: WorkoutTemplate[];
  onStartWorkout: () => void;
  onContinueWorkout?: () => void;
  onStartRoutine?: (templateId: string) => void;
}) {
  const streak = useMemo(() => currentWorkoutStreak(summaries), [summaries]);
  const inProgress = summaries.find((workout) => workout.status !== "completed");
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekRecord = records.find((record) => record.kind === "load" && record.date >= weekStart);
  const todayRoutine = templates.find((template) => template.days?.includes(new Date().getDay()));
  const actionLabel = inProgress ? "Continuar" : "Começar";
  const onAction = inProgress && onContinueWorkout ? onContinueWorkout : onStartWorkout;
  const marks = Array.from({ length: 7 }, (_, index) => index < Math.min(streak, 7));

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col pb-8">
      <header className="border-b border-foreground pb-4">
        <p className="mypr-kicker">{format(new Date(), "EEEE", { locale: ptBR })}</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <h1 className="text-6xl leading-none">Hoje</h1>
          <p className="mypr-num pb-1 text-sm text-muted-foreground">{format(new Date(), "dd.MM")}</p>
        </div>
      </header>

      <button
        type="button"
        className="mt-6 h-14 w-full bg-primary text-base font-semibold text-primary-foreground"
        onClick={todayRoutine && onStartRoutine && !inProgress ? () => onStartRoutine(todayRoutine.id) : onAction}
      >
        {actionLabel}
      </button>

      {todayRoutine ? (
        <section className="mt-6 border-y border-border py-4">
          <p className="mypr-kicker">Rotina</p>
          <p className="mt-2 font-heading text-2xl">{todayRoutine.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {todayRoutine.items.map((item) => item.name).join(" · ") || "Sem exercícios"}
          </p>
        </section>
      ) : null}

      <div className="mt-8 flex items-center justify-between gap-4">
        <p className="text-sm">{streak > 0 ? `${streak} ${streak === 1 ? "dia" : "dias"}` : "Sem sequência"}</p>
        <div className="flex gap-1" aria-hidden="true">
          {marks.map((filled, index) => (
            <span key={index} className={filled ? "h-2 w-4 bg-primary" : "h-2 w-4 bg-border"} />
          ))}
        </div>
      </div>

      {weekRecord ? (
        <p className="mt-6 flex items-center gap-3 border-t border-border pt-4 text-sm">
          <MarkRecord className="size-4 text-record" />
          <span className="text-muted-foreground">Recorde da semana</span>
          <span className="ml-auto text-right">
            {weekRecord.exerciseName}
            <span className="mypr-num ml-2 font-medium text-record">
              {weekRecord.value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg
            </span>
          </span>
        </p>
      ) : null}
    </div>
  );
}
