"use client";

import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Activity, CloudOff, Dumbbell, Home, LoaderCircle, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Brand } from "@/components/mypr/brand";
import { HomeView } from "@/components/mypr/home-view";
import { WorkoutsView } from "@/components/mypr/workouts-view";
import { AnalyticsView } from "@/components/mypr/analytics-view";
import { ProfileView } from "@/components/mypr/profile-view";
import { WorkoutEditor } from "@/components/mypr/workout-editor";
import { WorkoutDetails } from "@/components/mypr/workout-details";
import { PwaRegister } from "@/components/mypr/pwa-register";
import { UserSetup } from "@/components/mypr/user-setup";
import { useMyPrData } from "@/hooks/use-mypr-data";
import { db, getStoredActiveProfileId, setStoredActiveProfileId } from "@/lib/db";
import { cn } from "@/lib/utils";

type View = "home" | "workouts" | "analytics" | "profile";
type EditorState = { open: boolean; workoutId?: string; repeat?: boolean };

const navigation = [
  { id: "home" as const, label: "Início", icon: Home },
  { id: "workouts" as const, label: "Treinos", icon: Dumbbell },
  { id: "analytics" as const, label: "Evolução", icon: Activity },
  { id: "profile" as const, label: "Perfil", icon: UserRound },
];

export function AppShell() {
  const data = useMyPrData();
  const profiles = useLiveQuery(() => db.profiles.toArray(), []);
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(null);
  const [view, setView] = useState<View>("home");
  const [editor, setEditor] = useState<EditorState>({ open: false });
  const [detailsId, setDetailsId] = useState<string>();
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
    if (!activeProfile) return;
    document.documentElement.classList.toggle("dark", activeProfile.theme === "dark");
  }, [activeProfile]);

  const openEditor = (state?: Omit<EditorState, "open">) => {
    setDetailsId(undefined);
    setEditor({ open: true, ...state });
  };

  const content = useMemo(() => {
    if (!data) return null;
    if (view === "workouts") {
      return <WorkoutsView summaries={data.summaries} onStartWorkout={() => openEditor()} onOpenWorkout={setDetailsId} onRepeatWorkout={(workoutId) => openEditor({ workoutId, repeat: true })} />;
    }
    if (view === "analytics") {
      return <AnalyticsView exercises={data.exercises} workouts={data.workouts} workoutExercises={data.workoutExercises} sets={data.sets} summaries={data.summaries} records={data.records} />;
    }
    if (view === "profile") {
      return <ProfileView exercises={data.exercises} pendingSync={data.pendingSync} quickAdd={quickAddExercise} onQuickAddConsumed={() => setQuickAddExercise(false)} />;
    }
    const lastCompletedWorkout = [...data.summaries]
      .filter((workout) => workout.status === "completed")
      .sort((a, b) => b.performedAt.localeCompare(a.performedAt))[0];
    const quickStart = lastCompletedWorkout ? () => openEditor({ workoutId: lastCompletedWorkout.id, repeat: true }) : () => openEditor();

    return <HomeView summaries={data.summaries} records={data.records} onStartWorkout={() => openEditor()} onOpenWorkout={setDetailsId} onViewHistory={() => setView("workouts")} onRepeatLastWorkout={lastCompletedWorkout ? () => openEditor({ workoutId: lastCompletedWorkout.id, repeat: true }) : undefined} onViewProfile={() => { setQuickAddExercise(true); setView("profile"); }} onQuickStart={quickStart} />;
  }, [data, quickAddExercise, view]);

  if (!data || !profiles) {
    return (
      <div className="grid min-h-dvh place-items-center text-center">
        <div><LoaderCircle className="mx-auto size-7 animate-spin text-primary" /><p className="mt-3 text-sm text-muted-foreground">Preparando seu histórico…</p></div>
      </div>
    );
  }

  if (!activeProfile) {
    return <UserSetup onComplete={(profile) => setActiveProfileIdState(profile.id)} />;
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <PwaRegister />
      <div className="mx-auto flex min-h-dvh max-w-[1600px]">
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-border/70 bg-[linear-gradient(180deg,rgba(13,25,45,.96),rgba(7,16,30,.98))] p-5 lg:flex lg:flex-col">
          <Brand />
          <nav className="mt-10 space-y-1" aria-label="Navegação principal">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <Button key={item.id} variant="ghost" onClick={() => setView(item.id)} className={cn("h-11 w-full justify-start gap-3 px-3 text-muted-foreground", active && "bg-primary/12 text-primary hover:bg-primary/15 hover:text-primary")}>
                  <Icon className="size-4.5" /> {item.label}
                  {active ? <span className="ml-auto h-5 w-1 rounded-full bg-primary" /> : null}
                </Button>
              );
            })}
          </nav>
          {hasHistory ? (
            <div className="mt-auto rounded-2xl border border-border/70 bg-card/55 p-4">
              <div className="flex items-center gap-2 text-sm font-medium"><CloudOff className="size-4 text-primary" /> Offline-first</div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Registre agora. Sincronize quando estiver conectado.</p>
              {data ? <Badge variant="secondary" className="mt-3">{data.pendingSync} alterações locais</Badge> : null}
            </div>
          ) : null}
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/88 px-4 backdrop-blur-xl lg:px-8">
            <div className="lg:hidden"><Brand compact /></div>
            <p className="hidden text-sm font-medium text-muted-foreground lg:block">{hasHistory ? activeLabel : ""}</p>
            <div className="flex items-center gap-2">
              {hasHistory ? (
                <Badge variant="outline" className="border-emerald-400/20 bg-emerald-400/8 text-emerald-300"><span className="mr-1.5 size-1.5 rounded-full bg-emerald-400" />Dados salvos</Badge>
              ) : null}
              {hasHistory ? (
                <Button variant="ghost" size="icon" className="hidden rounded-full sm:inline-flex" onClick={() => setView("profile")} aria-label="Abrir perfil"><UserRound /></Button>
              ) : null}
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {content}
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/94 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden" aria-label="Navegação principal">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button key={item.id} type="button" onClick={() => setView(item.id)} className={cn("flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium text-muted-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", active && "bg-primary/10 text-primary")}>
                <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} /> {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {data ? (
        <>
          <WorkoutEditor open={editor.open} source={{ workoutId: editor.workoutId, repeat: editor.repeat }} exercises={data.exercises} templates={data.templates} onOpenChange={(open) => setEditor((current) => ({ ...current, open }))} />
          <WorkoutDetails workoutId={detailsId} exercises={data.exercises} onClose={() => setDetailsId(undefined)} onEdit={(workoutId) => openEditor({ workoutId })} onRepeat={(workoutId) => openEditor({ workoutId, repeat: true })} />
        </>
      ) : null}
      <Toaster richColors position="top-center" />
    </div>
  );
}
