// @vitest-environment jsdom
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { RadioGroup } from "./radio-group";
import { renderWithLocale } from "@/test/render";

afterEach(cleanup);

const options = [
  { id: "strength", label: "Força", hint: "Cargas máximas maiores." },
  { id: "hypertrophy", label: "Hipertrofia" },
] as const;

describe("RadioGroup", () => {
  it("names the group and explains each option", () => {
    renderWithLocale(<RadioGroup label="Objetivo" name="goal" options={options} />);
    const group = screen.getByRole("radiogroup", { name: "Objetivo" });
    expect(group).toBeTruthy();
    expect(screen.getByRole("radio", { name: /Força/ })).toBeTruthy();
    expect(screen.getByText("Cargas máximas maiores.")).toBeTruthy();
  });

  it("submits the chosen option with the form", async () => {
    renderWithLocale(
      <form aria-label="perfil">
        <RadioGroup label="Objetivo" name="goal" options={options} defaultValue="strength" />
      </form>,
    );
    await userEvent.click(screen.getByRole("radio", { name: /Hipertrofia/ }));

    const form = screen.getByRole<HTMLFormElement>("form", { name: "perfil" });
    expect(new FormData(form).get("goal")).toBe("hypertrophy");
  });
});
