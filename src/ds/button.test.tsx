// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Button } from "./button";

afterEach(cleanup);

describe("Button", () => {
  it("runs the action when pressed", async () => {
    const onPress = vi.fn();
    render(<Button onPress={onPress}>Salvar treino</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Salvar treino" }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not run the action while disabled", async () => {
    const onPress = vi.fn();
    render(
      <Button isDisabled onPress={onPress}>
        Salvar treino
      </Button>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Salvar treino" }));

    expect(onPress).not.toHaveBeenCalled();
  });

  it("ignores repeated presses while an action is pending", async () => {
    const onPress = vi.fn();
    render(
      <Button isPending onPress={onPress}>
        Salvando
      </Button>,
    );

    const button = screen.getByRole("button", { name: /Salvando/ });
    await userEvent.click(button);
    await userEvent.click(button);

    expect(onPress).not.toHaveBeenCalled();
    expect(button.getAttribute("aria-disabled")).toBe("true");
  });

  it("names an icon-only button through its label", () => {
    render(
      <Button iconOnly aria-label="Remover exercício">
        <svg aria-hidden />
      </Button>,
    );

    expect(screen.getByRole("button", { name: "Remover exercício" })).toBeTruthy();
  });

  it("can be reached and activated with the keyboard", async () => {
    const onPress = vi.fn();
    render(<Button onPress={onPress}>Iniciar</Button>);

    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Iniciar" }));
    await userEvent.keyboard("{Enter}");

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
