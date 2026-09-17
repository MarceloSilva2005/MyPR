"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Copy, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Exercise, WorkoutBundle } from "@/lib/domain";
import { workoutBundle } from "@/lib/db";

export function WorkoutDetails({
  workoutId,
  exercises,
  onClose,
  onEdit,
  onRepeat,
}: {
  workoutId?: string;
  exercises: Exercise[];
  onClose: () => void;
  onEdit: (id: string) => void;
  onRepeat: (id: string) => void;
}) {
  const [bundle, setBundle] = useState<WorkoutBundle>();

  useEffect(() => {
    if (!workoutId) return;
    void workoutBundle(workoutId).then(setBundle);
  }, [workoutId]);

  const exerciseMap = new Map(exercises.map((exercise) => [exercise.id, exercise.name]));
  return (
    <Dialog open={Boolean(workoutId)} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalhes do treino</DialogTitle>
          <DialogDescription>
            {bundle ? format(parseISO(bundle.workout.performedAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Carregando…"}
          </DialogDescription>
        </DialogHeader>
        {bundle ? (
          <div className="space-y-3">
            {bundle.exercises.sort((a, b) => a.order - b.order).map((link) => {
              const sets = bundle.sets.filter((set) => set.workoutExerciseId === link.id).sort((a, b) => a.order - b.order);
              return (
                <section key={link.id} className="rounded-2xl border border-border/70 bg-card/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold">{exerciseMap.get(link.exerciseId) ?? "Exercício"}</h3>
                    <CheckCircle2 className="size-4.5 text-emerald-400" />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    {sets.map((set) => (
                      <div key={set.id} className="rounded-xl bg-secondary/50 px-2 py-2 text-center">
                        <span className="block text-[11px]">Série {set.order + 1}</span>
                        <span className="mt-0.5 block font-mono text-sm font-semibold text-foreground">{set.loadKg} kg × {set.reps}</span>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button variant="outline" onClick={() => onRepeat(bundle.workout.id)}><Copy /> Repetir</Button>
              <Button onClick={() => onEdit(bundle.workout.id)}><Pencil /> Editar</Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
