// @vitest-environment jsdom
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { ExercisePicker, type ExerciseOption } from "./exercise-picker";
import { renderWithLocale } from "@/test/render";

afterEach(cleanup);

const exercises: ExerciseOption[] = [
  {
    id: "bench",
    name: "Supino reto",
    muscleGroup: "Peito",
    equipment: "Barra",
    aliases: ["bench press"],
  },
  {
    id: "squat",
    name: "Agachamento livre",
    muscleGroup: "Pernas",
    equipment: "Barra",
    aliases: ["squat"],
  },
  { id: "raise", name: "Elevação lateral", muscleGroup: "Ombros", equipment: "Halteres" },
];

async function search(text: string): Promise<void> {
  renderWithLocale(
    <ExercisePicker exercises={exercises} selectedId={null} onSelect={() => undefined} />,
  );
  await userEvent.type(screen.getByRole("combobox"), text);
}

function visibleOptions(): string[] {
  return screen.queryAllByRole("option").map((option) => option.textContent);
}

describe("ExercisePicker", () => {
  it("finds an exercise ignoring accents and case", async () => {
    await search("ELEVACAO");
    expect(visibleOptions()).toHaveLength(1);
    expect(visibleOptions()[0]).toContain("Elevação lateral");
  });

  it("finds an exercise by an alternative name that is never displayed", async () => {
    await search("squat");
    expect(visibleOptions()).toHaveLength(1);
    expect(visibleOptions()[0]).toContain("Agachamento livre");
    expect(screen.queryByText("squat")).toBeNull();
  });

  it("finds exercises by muscle group and by equipment", async () => {
    await search("barra");
    expect(visibleOptions()).toHaveLength(2);
  });

  it("explains when nothing matches", async () => {
    await search("zzz");
    // The listbox renders its empty message as a single disabled row.
    expect(visibleOptions()).toEqual(["Nenhum exercício encontrado."]);
  });
});
