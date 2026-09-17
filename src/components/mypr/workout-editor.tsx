"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Dumbbell,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Exercise, WorkoutBundle, WorkoutDraftExercise } from "@/lib/domain";
import { saveExercise, saveWorkoutBundle, workoutBundle } from "@/lib/db";

type EditorSource = { workoutId?: string; repeat?: boolean };

function newSet(loadKg = 0, reps = 10, completed = false) {
  return { id: crypto.randomUUID(), loadKg, reps, completed };
}

export function WorkoutEditor({
  open,
  source,
  exercises,
  onOpenChange,
}: {
  open: boolean;
  source: EditorSource;
  exercises: Exercise[];
  onOpenChange: (open: boolean) => void;
}) {
  const [workoutId, setWorkoutId] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [items, setItems] = useState<WorkoutDraftExercise[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customName, setCustomName] = useState("");
  const [customGroup, setCustomGroup] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const exercisesRef = useRef(exercises);

  useEffect(() => {
    exercisesRef.current = exercises;
  }, [exercises]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      setReady(false);
      if (source.workoutId) {
        const bundle = await workoutBundle(source.workoutId);
        if (bundle && !cancelled) {
          const exerciseMap = new Map(exercisesRef.current.map((exercise) => [exercise.id, exercise]));
          const nextItems = bundle.exercises
            .sort((a, b) => a.order - b.order)
            .map((link) => ({
              id: source.repeat ? crypto.randomUUID() : link.id,
              exerciseId: link.exerciseId,
              name: exerciseMap.get(link.exerciseId)?.name ?? "Exercício",
              sets: bundle.sets
                .filter((set) => set.workoutExerciseId === link.id)
                .sort((a, b) => a.order - b.order)
                .map((set) => ({
                  id: source.repeat ? crypto.randomUUID() : set.id,
                  reps: set.reps,
                  loadKg: set.loadKg,
                  completed: source.repeat ? false : set.completed,
                })),
            }));
          setWorkoutId(source.repeat ? crypto.randomUUID() : bundle.workout.id);
          setDate(source.repeat ? format(new Date(), "yyyy-MM-dd") : bundle.workout.performedAt);
          setItems(nextItems);
        }
      } else if (!cancelled) {
        setWorkoutId(crypto.randomUUID());
        setDate(format(new Date(), "yyyy-MM-dd"));
        setItems([]);
      }
      if (!cancelled) setReady(true);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, source.workoutId, source.repeat]);

  const buildBundle = useCallback(
    (status: "in_progress" | "completed"): WorkoutBundle => {
      const now = new Date().toISOString();
      return {
        workout: {
          id: workoutId,
          performedAt: date,
          status,
          createdAt: now,
          updatedAt: now,
        },
        exercises: items.map((item, index) => ({
          id: item.id,
          workoutId,
          exerciseId: item.exerciseId,
          order: index,
          createdAt: now,
          updatedAt: now,
        })),
        sets: items.flatMap((item) =>
          item.sets.map((set, index) => ({
            id: set.id,
            workoutExerciseId: item.id,
            order: index,
            reps: Math.max(0, Number(set.reps) || 0),
            loadKg: Math.max(0, Number(set.loadKg) || 0),
            completed: set.completed,
            createdAt: now,
            updatedAt: now,
          })),
        ),
      };
    },
    [date, items, workoutId],
  );

  useEffect(() => {
    if (!open || !ready || !workoutId || (items.length === 0 && !source.workoutId)) return;
    const timeout = window.setTimeout(() => {
      void saveWorkoutBundle(buildBundle("in_progress"));
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [buildBundle, items.length, open, ready, source.workoutId, workoutId]);

  const filteredExercises = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("pt-BR");
    return exercises
      .filter((exercise) => !exercise.archivedAt && !items.some((item) => item.exerciseId === exercise.id))
      .filter((exercise) => !normalized || exercise.name.toLocaleLowerCase("pt-BR").includes(normalized));
  }, [exercises, items, search]);

  function addExercise(exercise: Exercise) {
    setItems((current) => [
      ...current,
      { id: crypto.randomUUID(), exerciseId: exercise.id, name: exercise.name, sets: [newSet()] },
    ]);
    setPickerOpen(false);
    setSearch("");
  }

  async function createCustomExercise() {
    if (!customName.trim()) return;
    const created = await saveExercise({ name: customName, muscleGroup: customGroup });
    addExercise(created);
    setCustomName("");
    setCustomGroup("");
    toast.success("Exercício criado");
  }

  function updateSet(itemId: string, setId: string, changes: Partial<WorkoutDraftExercise["sets"][number]>) {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId
          ? { ...item, sets: item.sets.map((set) => (set.id === setId ? { ...set, ...changes } : set)) }
          : item,
      ),
    );
  }

  function duplicateSet(itemId: string, setId: string) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== itemId) return item;
        const index = item.sets.findIndex((set) => set.id === setId);
        const sourceSet = item.sets[index];
        const next = [...item.sets];
        next.splice(index + 1, 0, { ...sourceSet, id: crypto.randomUUID(), completed: false });
        return { ...item, sets: next };
      }),
    );
  }

  function moveItem(index: number, direction: -1 | 1) {
    setItems((current) => {
      const destination = index + direction;
      if (destination < 0 || destination >= current.length) return current;
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }

  async function finishWorkout() {
    const completedSets = items.flatMap((item) => item.sets).filter((set) => set.completed);
    if (items.length === 0 || completedSets.length === 0) {
      toast.error("Adicione e conclua ao menos uma série.");
      return;
    }
    setSaving(true);
    await saveWorkoutBundle(buildBundle("completed"));
    setSaving(false);
    toast.success("Treino concluído", { description: "Seu histórico e recordes foram atualizados." });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col gap-0 rounded-none border-0 bg-background p-0 sm:h-[92dvh] sm:max-h-[900px] sm:max-w-3xl sm:rounded-3xl sm:border">
        <DialogHeader className="border-b border-border/70 px-4 py-4 pr-14 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Dumbbell className="size-5" /></span>
            <div>
              <DialogTitle className="text-lg">{source.repeat ? "Repetir treino" : source.workoutId ? "Editar treino" : "Registrar treino"}</DialogTitle>
              <DialogDescription>Salvo automaticamente neste dispositivo</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {!ready ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Carregando treino…</p>
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="workout-date">Data do treino</Label>
                <Input id="workout-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-11 bg-card" />
              </div>

              {items.map((item, itemIndex) => (
                <section key={item.id} className="overflow-hidden rounded-2xl border border-border/80 bg-card/70">
                  <div className="flex items-center gap-2 border-b border-border/60 px-3 py-3 sm:px-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">{item.sets.filter((set) => set.completed).length}/{item.sets.length} séries concluídas</p>
                    </div>
                    <Button variant="ghost" size="icon-sm" aria-label="Mover exercício para cima" disabled={itemIndex === 0} onClick={() => moveItem(itemIndex, -1)}><ArrowUp /></Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Mover exercício para baixo" disabled={itemIndex === items.length - 1} onClick={() => moveItem(itemIndex, 1)}><ArrowDown /></Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Remover exercício" className="text-muted-foreground hover:text-destructive" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}><Trash2 /></Button>
                  </div>
                  <div className="px-3 py-2 sm:px-4">
                    <div className="grid grid-cols-[36px_1fr_1fr_34px_34px] items-center gap-2 px-1 pb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      <span>Série</span><span>Carga</span><span>Reps</span><span className="sr-only">Concluir</span><span className="sr-only">Ações</span>
                    </div>
                    <div className="space-y-2">
                      {item.sets.map((set, setIndex) => (
                        <div key={set.id} className={`grid grid-cols-[36px_1fr_1fr_34px_34px] items-center gap-2 rounded-xl p-1 transition ${set.completed ? "bg-emerald-400/8" : "bg-secondary/35"}`}>
                          <span className="text-center font-mono text-sm text-muted-foreground">{setIndex + 1}</span>
                          <Input aria-label={`Carga da série ${setIndex + 1}`} inputMode="decimal" type="number" min="0" step="0.5" value={set.loadKg} onChange={(event) => updateSet(item.id, set.id, { loadKg: Number(event.target.value) })} className="h-10 bg-background/60 px-2" />
                          <Input aria-label={`Repetições da série ${setIndex + 1}`} inputMode="numeric" type="number" min="0" value={set.reps} onChange={(event) => updateSet(item.id, set.id, { reps: Number(event.target.value) })} className="h-10 bg-background/60 px-2" />
                          <Checkbox aria-label={`Marcar série ${setIndex + 1} como concluída`} checked={set.completed} onCheckedChange={(checked) => updateSet(item.id, set.id, { completed: checked === true })} className="size-6 rounded-lg data-[state=checked]:border-emerald-400 data-[state=checked]:bg-emerald-400" />
                          <Button variant="ghost" size="icon-sm" aria-label={`Duplicar série ${setIndex + 1}`} onClick={() => duplicateSet(item.id, set.id)}><Copy /></Button>
                        </div>
                      ))}
                    </div>
                    <Button variant="ghost" size="sm" className="mt-2 w-full text-primary" onClick={() => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, sets: [...entry.sets, newSet(entry.sets.at(-1)?.loadKg, entry.sets.at(-1)?.reps)] } : entry))}>
                      <Plus /> Adicionar série
                    </Button>
                  </div>
                </section>
              ))}

              {pickerOpen ? (
                <section className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold">Adicionar exercício</h3>
                    <Button variant="ghost" size="icon-sm" aria-label="Fechar busca" onClick={() => setPickerOpen(false)}><X /></Button>
                  </div>
                  <div className="relative mt-3">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar exercício" className="h-11 bg-background pl-9" autoFocus />
                  </div>
                  <div className="mt-3 max-h-52 space-y-1 overflow-y-auto">
                    {filteredExercises.map((exercise) => (
                      <button key={exercise.id} type="button" onClick={() => addExercise(exercise)} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <span><span className="block text-sm font-medium">{exercise.name}</span><span className="block text-xs text-muted-foreground">{exercise.muscleGroup ?? "Sem grupo"}</span></span>
                        <Plus className="size-4 text-primary" />
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 border-t border-border/70 pt-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Cadastrar novo</p>
                    <div className="grid gap-2 sm:grid-cols-[1fr_.7fr_auto]">
                      <Input value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder="Nome do exercício" className="bg-background" />
                      <Input value={customGroup} onChange={(event) => setCustomGroup(event.target.value)} placeholder="Grupo muscular" className="bg-background" />
                      <Button variant="secondary" onClick={createCustomExercise} disabled={!customName.trim()}>Criar</Button>
                    </div>
                  </div>
                </section>
              ) : (
                <Button variant="outline" className="h-12 w-full border-dashed border-primary/45 text-primary hover:bg-primary/8" onClick={() => setPickerOpen(true)}>
                  <Plus /> Adicionar exercício
                </Button>
              )}

              {items.length === 0 ? (
                <div className="py-5 text-center text-sm text-muted-foreground">
                  Adicione o primeiro exercício para começar.
                </div>
              ) : null}
            </div>
          )}
        </div>

        <footer className="border-t border-border/70 bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="secondary" className="hidden sm:flex">{items.flatMap((item) => item.sets).filter((set) => set.completed).length} séries concluídas</Badge>
            <Button className="h-11 flex-1 sm:max-w-56" onClick={finishWorkout} disabled={saving || !ready}>
              <Check /> {saving ? "Salvando…" : "Concluir treino"}
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
