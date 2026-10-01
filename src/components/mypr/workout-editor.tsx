"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import {
  MarkBar,
  MarkCheck,
  MarkClose,
  MarkCopy,
  MarkDown,
  MarkMinus,
  MarkPlus,
  MarkSearch,
  MarkTimer,
  MarkTrash,
  MarkUp,
} from "@/components/mypr/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Exercise, WorkoutBundle, WorkoutDraftExercise, WorkoutTemplate } from "@/lib/domain";
import { saveExercise, saveWorkoutBundle, saveWorkoutTemplate, workoutBundle } from "@/lib/db";
import { createWorkoutTemplate } from "@/lib/workout-templates";
import {
  DEFAULT_REST_SECONDS,
  completedSetsForExercise,
  formatLoadKg,
  formatPreviousSets,
  formatSetSnapshot,
  latestSessionsByExercise,
  nextRestPreset,
  recordBeatenBySet,
  recordLabel,
  stepLoad,
  stepReps,
  type WorkoutLogHistory,
} from "@/lib/workout-logging";

type EditorSource = { workoutId?: string; repeat?: boolean; templateId?: string };
const REST_STORAGE_KEY = "mypr-rest-seconds";

function readRestSeconds(exerciseId: string) {
  if (typeof window === "undefined") return DEFAULT_REST_SECONDS;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(REST_STORAGE_KEY) ?? "{}") as Record<string, unknown>;
    const value = parsed[exerciseId];
    return typeof value === "number" && value >= 15 && value <= 600 ? value : DEFAULT_REST_SECONDS;
  } catch {
    return DEFAULT_REST_SECONDS;
  }
}

function writeRestSeconds(exerciseId: string, seconds: number) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(REST_STORAGE_KEY) ?? "{}") as Record<string, number>;
    parsed[exerciseId] = seconds;
    window.localStorage.setItem(REST_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // A preferência de descanso fica neste aparelho. O treino segue sem ela.
  }
}

function shortDate(date: string) {
  return format(new Date(`${date}T12:00:00`), "dd/MM");
}

function formatClock(milliseconds: number) {
  const total = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function newSet(loadKg: number | null = null, reps: number | null = null, completed = false) {
  return { id: crypto.randomUUID(), loadKg, reps, completed };
}

export function WorkoutEditor({
  open,
  source,
  exercises,
  templates,
  history,
  onOpenChange,
}: {
  open: boolean;
  source: EditorSource;
  exercises: Exercise[];
  templates: WorkoutTemplate[];
  history: WorkoutLogHistory;
  onOpenChange: (open: boolean) => void;
}) {
  const [workoutId, setWorkoutId] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [items, setItems] = useState<WorkoutDraftExercise[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customName, setCustomName] = useState("");
  const [customGroup, setCustomGroup] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [restByExercise, setRestByExercise] = useState<Record<string, number>>({});
  const [timer, setTimer] = useState<{ exerciseName: string; endsAt: number; durationMs: number } | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const [timerNote, setTimerNote] = useState("");
  const [prBanner, setPrBanner] = useState<string | null>(null);
  const exercisesRef = useRef(exercises);
  const historyRef = useRef(history);
  const prToken = useRef(0);

  useEffect(() => {
    exercisesRef.current = exercises;
  }, [exercises]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  const previousSessions = useMemo(
    () => latestSessionsByExercise(history, workoutId || undefined),
    [history, workoutId],
  );

  useEffect(() => {
    if (open) return;
    setTimer(null);
    setPrBanner(null);
    setTimerNote("");
  }, [open]);

  useEffect(() => {
    if (!timer) return;
    let cancelled = false;
    const tick = window.setInterval(() => {
      setRemainingMs(Math.max(0, timer.endsAt - Date.now()));
    }, 200);
    setRemainingMs(Math.max(0, timer.endsAt - Date.now()));
    const remaining = Math.max(0, timer.endsAt - Date.now());
    const finish = window.setTimeout(() => {
      if (cancelled) return;
      setTimerNote("Descanso acabou");
      navigator.vibrate?.(200);
    }, remaining);
    const hide = window.setTimeout(() => {
      if (cancelled) return;
      setTimer((current) => (current?.endsAt === timer.endsAt ? null : current));
    }, remaining + 1200);
    return () => {
      cancelled = true;
      window.clearInterval(tick);
      window.clearTimeout(finish);
      window.clearTimeout(hide);
    };
  }, [timer]);

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
          setCreatedAt(source.repeat ? new Date().toISOString() : bundle.workout.createdAt);
          setDate(source.repeat ? format(new Date(), "yyyy-MM-dd") : bundle.workout.performedAt);
          setItems(nextItems);
        }
      } else if (!cancelled) {
        setWorkoutId(crypto.randomUUID());
        setCreatedAt(new Date().toISOString());
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
          createdAt: createdAt || now,
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
            reps: Math.max(0, Number(set.reps ?? 0)),
            loadKg: Math.max(0, Number(set.loadKg ?? 0)),
            completed: set.completed,
            createdAt: now,
            updatedAt: now,
          })),
        ),
      };
    },
    [createdAt, date, items, workoutId],
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

  function applyTemplate(template: WorkoutTemplate) {
    setItems(
      template.items.map((item) => ({
        id: crypto.randomUUID(),
        exerciseId: item.exerciseId,
        name: item.name,
        sets: item.sets.map((set) => ({ id: crypto.randomUUID(), reps: set.reps, loadKg: set.loadKg, completed: false })),
      })),
    );
    setPickerOpen(false);
    setSearch("");
  }

  async function saveCurrentTemplate() {
    if (items.length === 0) {
      toast.error("Adicione pelo menos um exercício antes de salvar o modelo.");
      return;
    }
    const template = createWorkoutTemplate(`Treino ${format(new Date(), "dd/MM")}`, items);
    const saved = await saveWorkoutTemplate(template);
    toast.success("Modelo salvo", { description: saved.name });
    setPickerOpen(false);
  }

  function updateSetValue(itemId: string, setId: string, field: "loadKg" | "reps", rawValue: string) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          sets: item.sets.map((set) => {
            if (set.id !== setId) return set;
            const parsed = rawValue === "" ? null : Number(rawValue);
            return {
              ...set,
              [field]: Number.isFinite(parsed) ? parsed : null,
            };
          }),
        };
      }),
    );
  }

  function restSecondsFor(exerciseId: string) {
    return restByExercise[exerciseId] ?? readRestSeconds(exerciseId);
  }

  function cycleRest(exerciseId: string) {
    const next = nextRestPreset(restSecondsFor(exerciseId));
    writeRestSeconds(exerciseId, next);
    setRestByExercise((current) => ({ ...current, [exerciseId]: next }));
  }

  function startRest(exerciseName: string, seconds: number) {
    const durationMs = seconds * 1000;
    setTimer({ exerciseName, endsAt: Date.now() + durationMs, durationMs });
    setRemainingMs(durationMs);
    setTimerNote(`Descanso de ${seconds} segundos`);
  }

  function extendRest() {
    setTimerNote("Mais 30 segundos de descanso");
    setTimer((current) =>
      current ? { ...current, endsAt: current.endsAt + 30_000, durationMs: current.durationMs + 30_000 } : current,
    );
  }

  function showRecord(label: string) {
    const token = prToken.current + 1;
    prToken.current = token;
    setPrBanner(label);
    window.setTimeout(() => {
      if (prToken.current === token) setPrBanner(null);
    }, 2000);
  }

  function updateSetCompletion(item: WorkoutDraftExercise, setId: string, completed: boolean) {
    const target = item.sets.find((set) => set.id === setId);
    setItems((current) =>
      current.map((entry) => {
        if (entry.id !== item.id) return entry;
        return {
          ...entry,
          sets: entry.sets.map((set) => (set.id === setId ? { ...set, completed } : set)),
        };
      }),
    );
    if (!completed || !target) return;
    const hasEffort = (target.loadKg ?? 0) > 0 || (target.reps ?? 0) > 0;
    if (!hasEffort) return;
    const priorSets = completedSetsForExercise(historyRef.current, item.exerciseId, workoutId || undefined);
    const record = recordBeatenBySet(target, priorSets);
    if (record) {
      showRecord(recordLabel(record));
      navigator.vibrate?.([20, 40, 20]);
    } else {
      navigator.vibrate?.(12);
    }
    startRest(item.name, restSecondsFor(item.exerciseId));
  }

  function changeSetByStep(itemId: string, setId: string, field: "loadKg" | "reps", direction: -1 | 1, fallback: number | null) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          sets: item.sets.map((set) => {
            if (set.id !== setId) return set;
            const next = field === "loadKg" ? stepLoad(set.loadKg, direction, fallback) : stepReps(set.reps, direction, fallback);
            return { ...set, [field]: next };
          }),
        };
      }),
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
    try {
      await saveWorkoutBundle(buildBundle("completed"));
      toast.success("Treino concluído", { description: "Seu histórico e recordes foram atualizados." });
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o treino.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col gap-0 rounded-none border-0 bg-background p-0 sm:h-[92dvh] sm:max-h-[900px] sm:max-w-3xl sm:rounded-3xl sm:border">
        <DialogHeader className="border-b border-border/70 px-4 py-4 pr-14 sm:px-6">
          <div className="flex items-center gap-3">
            <MarkBar className="size-7 text-primary" />
            <div>
              <DialogTitle className="text-lg">{source.repeat ? "Repetir treino" : source.workoutId ? "Editar treino" : "Registrar treino"}</DialogTitle>
              <DialogDescription>Salvo automaticamente neste dispositivo</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <p className="sr-only" aria-live="polite">{prBanner ?? timerNote}</p>
        {prBanner ? (
          <div className="border-b border-record bg-record px-4 py-2 text-center text-sm font-semibold text-record-foreground">
            {prBanner}
          </div>
        ) : null}
        {timer ? (
          <div className="border-b border-primary/20 bg-primary/10 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <MarkTimer className="size-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-muted-foreground">Descanso · {timer.exerciseName}</p>
                <p className="mypr-num text-4xl" aria-hidden="true">{formatClock(remainingMs)}</p>
              </div>
              <Button type="button" variant="secondary" className="h-11 px-3" onClick={extendRest}>+30 s</Button>
              <Button type="button" variant="ghost" className="h-11 px-3" onClick={() => setTimer(null)}>Pular</Button>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-primary/15">
              <div
                className="h-full bg-primary transition-[width] duration-150"
                style={{ width: `${timer.durationMs === 0 ? 0 : Math.min(100, (remainingMs / timer.durationMs) * 100)}%` }}
              />
            </div>
          </div>
        ) : null}

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
                      {previousSessions.get(item.exerciseId) ? (
                        <p className="truncate text-xs text-muted-foreground">
                          Última vez · {shortDate(previousSessions.get(item.exerciseId)!.date)} · {formatPreviousSets(previousSessions.get(item.exerciseId)!.sets)}
                        </p>
                      ) : null}
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="h-9 shrink-0 px-2 text-muted-foreground" aria-label={`Descanso de ${restSecondsFor(item.exerciseId)} segundos. Toque para alterar.`} onClick={() => cycleRest(item.exerciseId)}>
                      {restSecondsFor(item.exerciseId)} s
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Mover exercício para cima" disabled={itemIndex === 0} onClick={() => moveItem(itemIndex, -1)}><MarkUp /></Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Mover exercício para baixo" disabled={itemIndex === items.length - 1} onClick={() => moveItem(itemIndex, 1)}><MarkDown /></Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Remover exercício" className="text-muted-foreground hover:text-destructive" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}><MarkTrash /></Button>
                  </div>
                  <div className="px-3 py-2 sm:px-4">
                    <div className="grid grid-cols-[32px_1fr_1fr_44px] items-end gap-2 px-1 pb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      <span>Série</span><span>Carga</span><span>Reps</span><span className="sr-only">Concluir</span>
                    </div>
                    <div className="space-y-2">
                      {item.sets.map((set, setIndex) => {
                        const previousSet = previousSessions.get(item.exerciseId)?.sets[setIndex];
                        return (
                          <div
                            key={set.id}
                            className={`rounded-xl p-1 transition duration-150 ${set.completed ? "bg-emerald-400/10" : "bg-secondary/35"}`}
                            onClick={() => updateSetCompletion(item, set.id, !set.completed)}
                          >
                            <div className="grid grid-cols-[32px_1fr_1fr_44px] items-center gap-2">
                              <div className="text-center">
                                <span className="font-mono text-sm text-muted-foreground">{setIndex + 1}</span>
                                <Button type="button" variant="ghost" size="icon-sm" className="mt-1 text-muted-foreground" aria-label={`Duplicar série ${setIndex + 1}`} onClick={(event) => { event.stopPropagation(); duplicateSet(item.id, set.id); }}><MarkCopy /></Button>
                              </div>
                              <div className="space-y-1" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
                                <Input aria-label={`Carga da série ${setIndex + 1}`} inputMode="decimal" type="number" min="0" step="2.5" value={set.loadKg ?? ""} onChange={(event) => updateSetValue(item.id, set.id, "loadKg", event.target.value)} className="h-11 bg-background/70 px-2 text-center font-mono text-lg" placeholder={previousSet ? formatLoadKg(previousSet.loadKg) : "0"} />
                                <div className="grid grid-cols-2 gap-1">
                                  <Button type="button" variant="outline" className="h-9" aria-label={`Diminuir carga da série ${setIndex + 1}`} onClick={() => changeSetByStep(item.id, set.id, "loadKg", -1, previousSet?.loadKg ?? null)}><MarkMinus /></Button>
                                  <Button type="button" variant="outline" className="h-9" aria-label={`Aumentar carga da série ${setIndex + 1}`} onClick={() => changeSetByStep(item.id, set.id, "loadKg", 1, previousSet?.loadKg ?? null)}><MarkPlus /></Button>
                                </div>
                              </div>
                              <div className="space-y-1" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
                                <Input aria-label={`Repetições da série ${setIndex + 1}`} inputMode="numeric" type="number" min="0" step="1" value={set.reps ?? ""} onChange={(event) => updateSetValue(item.id, set.id, "reps", event.target.value)} className="h-11 bg-background/70 px-2 text-center font-mono text-lg" placeholder={previousSet ? String(previousSet.reps) : "10"} />
                                <div className="grid grid-cols-2 gap-1">
                                  <Button type="button" variant="outline" className="h-9" aria-label={`Diminuir repetições da série ${setIndex + 1}`} onClick={() => changeSetByStep(item.id, set.id, "reps", -1, previousSet?.reps ?? null)}><MarkMinus /></Button>
                                  <Button type="button" variant="outline" className="h-9" aria-label={`Aumentar repetições da série ${setIndex + 1}`} onClick={() => changeSetByStep(item.id, set.id, "reps", 1, previousSet?.reps ?? null)}><MarkPlus /></Button>
                                </div>
                              </div>
                              <div className="flex h-full items-center justify-center" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()}>
                                <Checkbox aria-label={`Marcar série ${setIndex + 1} como concluída`} checked={set.completed} onCheckedChange={(checked) => updateSetCompletion(item, set.id, checked === true)} className="size-7 data-[state=checked]:border-record data-[state=checked]:bg-record data-[state=checked]:text-record-foreground" />
                              </div>
                            </div>
                            {previousSet ? <p className="px-1 pt-1 text-xs text-muted-foreground">Última · {formatSetSnapshot(previousSet)}</p> : null}
                          </div>
                        );
                      })}
                    </div>
                    <Button variant="ghost" size="sm" className="mt-2 h-11 w-full text-primary" onClick={() => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, sets: [...entry.sets, newSet(entry.sets.at(-1)?.loadKg ?? null, entry.sets.at(-1)?.reps ?? null)] } : entry))}>
                      <MarkPlus /> série
                    </Button>
                  </div>
                </section>
              ))}

              {pickerOpen ? (
                <section className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold">Adicionar exercício</h3>
                    <Button variant="ghost" size="icon-sm" aria-label="Fechar busca" onClick={() => setPickerOpen(false)}><MarkClose /></Button>
                  </div>
                  <div className="relative mt-3">
                    <MarkSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar exercício" className="h-11 bg-background pl-9" autoFocus />
                  </div>
                  <div className="mt-3 max-h-52 space-y-1 overflow-y-auto">
                    {filteredExercises.map((exercise) => (
                      <button key={exercise.id} type="button" onClick={() => addExercise(exercise)} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition hover:bg-primary/10 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <span><span className="block text-sm font-medium">{exercise.name}</span><span className="block text-xs text-muted-foreground">{exercise.muscleGroup ?? "Sem grupo"}</span></span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/8 px-2 py-1 text-[11px] font-medium text-primary">Adicionar</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 border-t border-border/70 pt-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Modelos salvos</p>
                      <Button variant="secondary" size="sm" onClick={saveCurrentTemplate}>Salvar modelo</Button>
                    </div>
                    {templates.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum modelo salvo ainda.</p>
                    ) : (
                      <div className="space-y-2">
                        {templates.map((template) => (
                          <button key={template.id} type="button" onClick={() => applyTemplate(template)} className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-left hover:border-primary/40 hover:bg-primary/5">
                            <span>
                              <span className="block text-sm font-medium">{template.name}</span>
                              <span className="block text-xs text-muted-foreground">{template.items.length} exercícios</span>
                            </span>
                            <span className="text-xs text-primary">Usar</span>
                          </button>
                        ))}
                      </div>
                    )}
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
                <div className="space-y-3">
                  <Button variant="outline" className="h-12 w-full border-dashed border-primary/45 text-primary hover:bg-primary/8" onClick={() => setPickerOpen(true)}>
                    <MarkPlus /> Adicionar exercício
                  </Button>
                  {templates.length > 0 ? (
                    <Button variant="secondary" className="h-10 w-full" onClick={() => setPickerOpen(true)}>
                      Usar modelo salvo
                    </Button>
                  ) : null}
                </div>
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
              <MarkCheck /> {saving ? "Salvando…" : "Concluir treino"}
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
