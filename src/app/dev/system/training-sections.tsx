"use client";

import { useState } from "react";

import { Section, Specimen } from "./sections";
import { Button } from "@/ds/button";
import { ExercisePicker, type ExerciseOption } from "@/ds/exercise-picker";
import { PRBadge } from "@/ds/pr-badge";
import { RestTimer } from "@/ds/rest-timer";
import {
  addRestTime,
  finishRest,
  pauseRest,
  resumeRest,
  startRest,
  type RestTimerState,
} from "@/ds/rest-timer-model";
import { SyncStatus, type SyncState } from "@/ds/sync-status";
import { WorkoutSetRow, type WorkoutSetValue } from "@/ds/workout-set-row";

const EXERCISES: ExerciseOption[] = [
  {
    id: "bench",
    name: "Supino reto",
    muscleGroup: "Peito",
    equipment: "Barra",
    aliases: ["bench press"],
  },
  { id: "incline", name: "Supino inclinado", muscleGroup: "Peito", equipment: "Halteres" },
  {
    id: "squat",
    name: "Agachamento livre",
    muscleGroup: "Pernas",
    equipment: "Barra",
    aliases: ["squat"],
  },
  { id: "row", name: "Remada curvada", muscleGroup: "Costas", equipment: "Barra" },
  { id: "raise", name: "Elevação lateral", muscleGroup: "Ombros", equipment: "Halteres" },
];

const SYNC_STATES: SyncState[] = ["saved-local", "syncing", "synced", "unsynced", "offline"];

const INITIAL_SETS: WorkoutSetValue[] = [
  { type: "warmup", load: 40, reps: 10, completed: true },
  { type: "work", load: 80, reps: 8, completed: true },
  { type: "work", load: 82.5, reps: 8, completed: false },
  { type: "work", load: null, reps: null, completed: false },
];

export function TrainingSections() {
  const [sets, setSets] = useState(INITIAL_SETS);
  const [exercise, setExercise] = useState<string | null>(null);

  return (
    <Section
      id="training"
      title="Componentes de treino"
      description="A linha de série e o descanso são usados durante o esforço: alvos de 44 px ou mais e nenhuma animação bloqueia a entrada."
    >
      <Specimen label="Série" className="block max-w-2xl">
        <div className="mb-1 grid grid-cols-[3rem_1fr_1fr_3rem] gap-2 px-1 text-xs text-fg-muted md:grid-cols-[3.5rem_1fr_1fr_3rem] md:gap-3">
          <span>Série</span>
          <span>Carga</span>
          <span>Repetições</span>
          <span className="sr-only">Concluída</span>
        </div>
        <div className="border-t border-line">
          {sets.map((value, index) => (
            <WorkoutSetRow
              key={index}
              number={index + 1}
              unit="kg"
              value={value}
              {...(index === 1 ? { previous: { load: 77.5, reps: 8 } } : {})}
              {...(index === 2
                ? { previous: { load: 80, reps: 8 }, record: "Novo recorde: 82,5 kg" }
                : {})}
              onChange={(next) => {
                setSets((current) => current.map((item, i) => (i === index ? next : item)));
              }}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4">
          <PRBadge>Novo recorde de 1RM estimado: 104,5 kg</PRBadge>
        </div>
      </Specimen>

      <RestTimerSpecimens />

      <Specimen label="Sincronização">
        {SYNC_STATES.map((state) => (
          <div key={state} className="min-w-44 rounded-md border border-line px-3 py-2">
            <SyncStatus
              state={state}
              {...(state === "unsynced" ? { onRetry: () => undefined } : {})}
            />
          </div>
        ))}
      </Specimen>

      <Specimen id="exercise-picker" label="Seletor de exercício" className="block max-w-md">
        <ExercisePicker exercises={EXERCISES} selectedId={exercise} onSelect={setExercise} />
      </Specimen>
    </Section>
  );
}

const REST_TOTAL_MS = 90_000;

function RestTimerSpecimens() {
  const [live, setLive] = useState<RestTimerState>({
    status: "paused",
    remainingMs: 72_000,
    totalMs: REST_TOTAL_MS,
  });
  const [minimized, setMinimized] = useState(false);

  return (
    <Specimen label="Descanso" className="grid max-w-3xl gap-4 md:grid-cols-2">
      <div className="space-y-3">
        <RestTimer
          state={live}
          minimized={minimized}
          onPause={() => {
            setLive((current) => pauseRest(current, Date.now()));
          }}
          onResume={() => {
            setLive((current) => resumeRest(current, Date.now()));
          }}
          onAddTime={(seconds) => {
            setLive((current) => addRestTime(current, Date.now(), seconds * 1000));
          }}
          onDismiss={() => {
            setLive(finishRest(startRest(Date.now(), 0)));
          }}
          onFinish={() => {
            setLive((current) => finishRest(current));
          }}
          onMinimizedChange={setMinimized}
        />
        <Button
          size="sm"
          onPress={() => {
            setLive(startRest(Date.now(), REST_TOTAL_MS));
          }}
        >
          Iniciar descanso de 90 s
        </Button>
      </div>
      <div className="space-y-3">
        <RestTimer
          state={{ status: "done", totalMs: REST_TOTAL_MS }}
          onPause={() => undefined}
          onResume={() => undefined}
          onAddTime={() => undefined}
          onDismiss={() => undefined}
          onFinish={() => undefined}
          onMinimizedChange={() => undefined}
        />
        <RestTimer
          state={{ status: "paused", remainingMs: 38_000, totalMs: REST_TOTAL_MS }}
          minimized
          onPause={() => undefined}
          onResume={() => undefined}
          onAddTime={() => undefined}
          onDismiss={() => undefined}
          onFinish={() => undefined}
          onMinimizedChange={() => undefined}
        />
      </div>
    </Specimen>
  );
}
