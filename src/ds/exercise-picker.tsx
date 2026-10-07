"use client";

import { useMemo } from "react";

import { ComboBox } from "./combo-box";

export interface ExerciseOption {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  /** Alternative names. They are searchable but never displayed. */
  aliases?: readonly string[];
}

interface ExercisePickerProps {
  exercises: readonly ExerciseOption[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  label?: string;
  error?: string;
}

/** Searches by name, alias, muscle group and equipment, ignoring accents. */
export function ExercisePicker({
  exercises,
  selectedId,
  onSelect,
  label = "Exercício",
  error,
}: ExercisePickerProps) {
  const options = useMemo(
    () =>
      exercises.map((exercise) => ({
        id: exercise.id,
        label: exercise.name,
        detail: `${exercise.muscleGroup} · ${exercise.equipment}`,
        keywords: [exercise.muscleGroup, exercise.equipment, ...(exercise.aliases ?? [])],
      })),
    [exercises],
  );

  return (
    <ComboBox
      label={label}
      options={options}
      selectedId={selectedId}
      onSelect={onSelect}
      placeholder="Buscar exercício"
      description="Busque por nome, grupo muscular ou equipamento."
      emptyMessage="Nenhum exercício encontrado."
      {...(error ? { error } : {})}
    />
  );
}
