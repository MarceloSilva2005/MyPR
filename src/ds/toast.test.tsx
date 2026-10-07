// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ToastProvider, useToast } from "./toast";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function Trigger({ message }: { message: string }) {
  const toast = useToast();
  return (
    <button
      type="button"
      onClick={() => {
        toast.show({ message, tone: "success", durationMs: 3000 });
      }}
    >
      mostrar
    </button>
  );
}

function setup(message = "Treino salvo.") {
  render(
    <ToastProvider>
      <Trigger message={message} />
    </ToastProvider>,
  );
}

describe("toast", () => {
  it("confirms an outcome inside a polite live region", async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: "mostrar" }));

    const region = screen.getByRole("region", { name: "Notificações" });
    expect(region.getAttribute("aria-live")).toBe("polite");
    expect(region.textContent).toContain("Treino salvo.");
  });

  it("can be dismissed by the person", async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: "mostrar" }));
    await userEvent.click(screen.getByRole("button", { name: "Dispensar" }));

    expect(screen.queryByText("Treino salvo.")).toBeNull();
  });

  it("leaves on its own after the duration", () => {
    vi.useFakeTimers();
    setup();
    act(() => {
      screen.getByRole("button", { name: "mostrar" }).click();
    });
    expect(screen.getByText("Treino salvo.")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(3100);
    });

    expect(screen.queryByText("Treino salvo.")).toBeNull();
  });

  it("keeps at most three notifications on screen", async () => {
    render(
      <ToastProvider>
        <Trigger message="Mensagem" />
      </ToastProvider>,
    );
    const trigger = screen.getByRole("button", { name: "mostrar" });
    for (let i = 0; i < 5; i += 1) await userEvent.click(trigger);

    expect(screen.getAllByText("Mensagem")).toHaveLength(3);
  });

  it("refuses to be used outside its provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Trigger message="x" />)).toThrow("ToastProvider");
    spy.mockRestore();
  });
});
