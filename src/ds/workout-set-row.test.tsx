// @vitest-environment jsdom
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WorkoutSetRow, type WorkoutSetValue } from "./workout-set-row";
import { renderWithLocale } from "@/test/render";

afterEach(cleanup);

const base: WorkoutSetValue = { type: "work", load: 80, reps: 8, completed: false };

function setup(value: WorkoutSetValue = base, extra: { record?: string } = {}) {
  const onChange = vi.fn();
  renderWithLocale(
    <WorkoutSetRow
      number={2}
      unit="kg"
      value={value}
      previous={{ load: 77.5, reps: 8 }}
      onChange={onChange}
      {...extra}
    />,
  );
  return onChange;
}

describe("WorkoutSetRow", () => {
  it("marks the set as completed with a single press", async () => {
    const onChange = setup();

    await userEvent.click(screen.getByRole("button", { name: "Série 2 concluída" }));

    expect(onChange).toHaveBeenCalledWith({ ...base, completed: true });
  });

  it("reflects the completed state for assistive technology", () => {
    setup({ ...base, completed: true });
    const toggle = screen.getByRole("button", { name: "Série 2 concluída" });
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
  });

  it("accepts a decimal load typed with the Brazilian comma", async () => {
    const onChange = setup();
    const load = screen.getByRole("textbox", { name: /Carga, série 2/ });

    await userEvent.clear(load);
    await userEvent.type(load, "82,5");
    await userEvent.tab();

    expect(onChange).toHaveBeenLastCalledWith({ ...base, load: 82.5 });
  });

  it("shows the previous performance without leaving the screen", () => {
    setup();
    const line = screen.getByText(/Anterior/);
    expect(line.textContent.replace(/\s/g, " ")).toBe("Anterior: 77,5 kg × 8");
  });

  it("annotates a record objectively next to the set", () => {
    setup(base, { record: "Novo recorde: 82,5 kg" });
    expect(screen.getByText("Novo recorde: 82,5 kg")).toBeTruthy();
    expect(screen.getByText("PR")).toBeTruthy();
  });

  it("changes the set type from its menu", async () => {
    const onChange = setup();

    await userEvent.click(screen.getByRole("button", { name: /Série 2, Trabalho/ }));
    await userEvent.click(await screen.findByRole("menuitemradio", { name: "Aquecimento" }));

    expect(onChange).toHaveBeenCalledWith({ ...base, type: "warmup" });
  });
});
