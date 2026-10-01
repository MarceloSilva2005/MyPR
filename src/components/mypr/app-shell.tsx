"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { MarkLedger, MarkToday, MarkWait, MarkYou } from "@/components/mypr/icons";
import { Toaster } from "@/components/ui/sonner";
import { Brand } from "@/components/mypr/brand";
import { HomeView } from "@/components/mypr/home-view";
import { WorkoutsView } from "@/components/mypr/workouts-view";
import { AnalyticsView } from "@/components/mypr/analytics-view";
import { ProfileView } from "@/components/mypr/profile-view";
import { WorkoutEditor } from "@/components/mypr/workout-editor";
import { WorkoutDetails } from "@/components/mypr/workout-details";
import { ExercisePage } from "@/components/mypr/exercise-page";
import { PwaRegister } from "@/components/mypr/pwa-register";
import { useMyPrData } from "@/hooks/use-mypr-data";
import { db, getStoredActiveProfileId, getStoredTheme, setStoredActiveProfileId } from "@/lib/db";
import { cn } from "@/lib/utils";

type View = "home" | "history" | "you" | "analytics";
type EditorState = { open: boolean; workoutId?: string; repeat?: boolean; templateId?: string };

const navigation = [
  { id: "home" as const, label: "Hoje", icon: MarkToday },
  { id: "history" as const, label: "Histórico", icon: MarkLedger },
  { id: "you" as const, label: "Você", icon: MarkYou },
];

export function AppShell() {
  const data = useMyPrData();
  const profiles = useLiveQuery(() => db.profiles.toArray(), []);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null);
  const [view, setView] = useState<View>("home");
  const [editor, setEditor] = useState<EditorState>({ open: false });
  const [detailsId, setDetailsId] = useState<string>();
  const [exerciseFocus, setExerciseFocus] = useState<{ id: string; from: View } | null>(null);
  const [quickAddExercise, setQuickAddExercise] = useState(false);
  const activeLabel = navigation.find((item) => item.id === view)?.label;
  const hasHistory = Boolean(data && data.summaries.some((workout) => workout.status === "completed"));

  useEffect(() => {
    setActiveProfileIdState(getStoredActiveProfileId());
  }, []);

  useEffect(() => {
    if (!profiles || profiles.length === 0) {
      if (activeProfileId) {
        setStoredActiveProfileId(null);
      }
      return;
    }

    const selectedExists = activeProfileId && profiles.some((profile) => profile.id === activeProfileId);
    if (!selectedExists) {
      const fallback = profiles[0];
      setActiveProfileIdState(fallback.id);
      setStoredActiveProfileId(fallback.id);
    } else {
      setStoredActiveProfileId(activeProfileId);
    }
  }, [activeProfileId, profiles]);

  const activeProfile = profiles?.find((profile) => profile.id === activeProfileId) ?? profiles?.[0] ?? null;

  useEffect(() => {
    const theme = activeProfile?.theme ?? getStoredTheme();
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#1A1613" : "#E6DCCB");
  }, [activeProfile]);

  useEffect(() => {
    document.body.classList.toggle("mypr-training", editor.open);
    return () => document.body.classList.remove("mypr-training");
  }, [editor.open]);

  useEffect(() => {
    if (!data) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("treino") !== "1") return;
    window.history.replaceState({}, "", "/");
    setEditor({ open: true });
  }, [data]);

  const openEditor = (state?: Omit<EditorState, "open">) => {
    setDetailsId(undefined);
    setEditor({ open: true, ...state });
  };

  const content = useMemo(() => {
    if (!data) return null;
    if (exerciseFocus) {
      return (
        <ExercisePage
          exerciseId={exerciseFocus.id}
          exercises={data.exercises}
          workouts={data.workouts}
          workoutExercises={data.workoutExercises}
          sets={data.sets}
          onBack={() => setExerciseFocus(null)}
        />
      );
    }
    if (view === "history") {
      return <WorkoutsView summaries={data.summaries} records={data.records} onStartWorkout={() => openEditor()} onOpenWorkout={setDetailsId} onRepeatWorkout={(workoutId) => openEditor({ workoutId, repeat: true })} />;
    }
    if (view === "analytics") {
      return <AnalyticsView exercises={data.exercises} workouts={data.workouts} workoutExercises={data.workoutExercises} sets={data.sets} summaries={data.summaries} records={data.records} onBack={() => setView("you")} onOpenExercise={(id) => setExerciseFocus({ id, from: view })} />;
    }
    if (view === "you") {
      return <ProfileView exercises={data.exercises} pendingSync={data.pendingSync} quickAdd={quickAddExercise} onQuickAddConsumed={() => setQuickAddExercise(false)} onOpenAnalytics={() => setView("analytics")} templates={data.templates} />;
    }
    const inProgress = data.summaries.find((workout) => workout.status !== "completed");
    const lastCompletedWorkout = data.summaries.find((workout) => workout.status === "completed");

    return (
      <HomeView
        summaries={data.summaries}
        records={data.records}
        templates={data.templates}
        onStartWorkout={() => openEditor(lastCompletedWorkout ? { workoutId: lastCompletedWorkout.id, repeat: true } : undefined)}
        onContinueWorkout={inProgress ? () => openEditor({ workoutId: inProgress.id }) : undefined}
        onStartRoutine={(templateId) => openEditor({ templateId })}
      />
    );
  }, [data, exerciseFocus, quickAddExercise, view]);

  if (!data || !profiles) {
    return (
      <div className="grid min-h-dvh place-items-center text-center">
        <div><MarkWait className="mx-auto size-7 animate-spin text-primary" /><p className="mt-3 text-sm text-muted-foreground">Preparando seu histórico…</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <PwaRegister completedCount={data.summaries.filter((workout) => workout.status === "completed").length} hidden={editor.open} />
      <div className="mx-auto flex min-h-dvh max-w-[1600px]">
        <aside className={cn("sticky top-0 hidden h-dvh w-56 shrink-0 border-r border-border bg-background p-6 lg:flex lg:flex-col", editor.open && "lg:hidden")}>
          <Brand />
          <nav className="mt-12 flex flex-col" aria-label="Navegação principal">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = view === item.id || (item.id === "you" && view === "analytics");
              return (
                <button key={item.id} type="button" onClick={() => setView(item.id)} className={cn("flex h-12 items-center gap-3 border-l-2 border-transparent pl-3 text-left text-sm text-muted-foreground", active && "border-primary text-foreground")}>
                  <Icon className="size-4" /> {item.label}
                </button>
              );
            })}
          </nav>
          {hasHistory ? (
            <p className="mt-auto text-xs text-muted-foreground">{data.pendingSync} alterações neste aparelho</p>
          ) : null}
        </aside>

        <div className="min-w-0 flex-1">
          <header className={cn("sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:px-8", editor.open && "hidden")}>
            <div className="lg:hidden"><Brand compact /></div>
            <p className="hidden text-sm font-medium text-muted-foreground lg:block">{activeLabel ?? (view === "analytics" ? "Evolução" : "")}</p>
            <p className="text-xs text-muted-foreground">{hasHistory ? "Neste aparelho" : ""}</p>
          </header>

          <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {content}
          </main>
        </div>
      </div>

      <nav className={cn("fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 lg:hidden", editor.open && "hidden")} aria-label="Navegação principal">
        <div className="mx-auto grid max-w-lg grid-cols-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = view === item.id || (item.id === "you" && view === "analytics");
            return (
              <button key={item.id} type="button" onClick={() => setView(item.id)} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 border-t-2 border-transparent text-[11px] font-medium text-muted-foreground", active && "border-primary text-foreground")}>
                <Icon className="size-4" /> {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {data ? (
        <>
          <WorkoutEditor open={editor.open} source={{ workoutId: editor.workoutId, repeat: editor.repeat, templateId: editor.templateId }} exercises={data.exercises} templates={data.templates} history={{ workouts: data.workouts, workoutExercises: data.workoutExercises, sets: data.sets }} onOpenChange={(open) => setEditor((current) => ({ ...current, open }))} />
          <WorkoutDetails workoutId={detailsId} exercises={data.exercises} onClose={() => setDetailsId(undefined)} onEdit={(workoutId) => openEditor({ workoutId })} onRepeat={(workoutId) => openEditor({ workoutId, repeat: true })} onOpenExercise={(id) => { setDetailsId(undefined); setExerciseFocus({ id, from: view }); }} />
        </>
      ) : null}
      <Toaster richColors position="top-center" />
    </div>
  );
}
