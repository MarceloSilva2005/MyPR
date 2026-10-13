// @vitest-environment jsdom
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { PasswordField } from "./password-field";
import { renderWithLocale } from "@/test/render";

afterEach(cleanup);

function setup() {
  renderWithLocale(
    <PasswordField
      label="Senha"
      name="password"
      autoComplete="current-password"
      showLabel="Mostrar senha"
      hideLabel="Ocultar senha"
    />,
  );
  return screen.getByLabelText("Senha", { selector: "input" });
}

describe("PasswordField", () => {
  it("hides the password and lets password managers fill it", () => {
    const input = setup();
    expect(input.getAttribute("type")).toBe("password");
    expect(input.getAttribute("autocomplete")).toBe("current-password");
    expect(input.getAttribute("name")).toBe("password");
  });

  it("reveals and hides the value with a toggle that reports its state", async () => {
    const input = setup();

    await userEvent.type(input, "frase longa");
    await userEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));

    expect(input.getAttribute("type")).toBe("text");
    expect((input as HTMLInputElement).value).toBe("frase longa");
    const toggle = screen.getByRole("button", { name: "Ocultar senha" });
    expect(toggle.getAttribute("aria-pressed")).toBe("true");

    await userEvent.click(toggle);
    expect(input.getAttribute("type")).toBe("password");
  });
});
