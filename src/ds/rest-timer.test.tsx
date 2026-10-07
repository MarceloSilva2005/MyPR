// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RestTimer } from "./rest-timer";
import type { RestTimerState } from "./rest-timer-model";

afterEach(cleanup);

const NOW = 5_000_000;

function setup(state: RestTimerState, options: { minimized?: boolean } = {}) {
  const handlers = {
    onPause: vi.fn(),
    onResume: vi.fn(),
    onAddTime: vi.fn(),
    onDismiss: vi.fn(),
    onFinish: vi.fn(),
    onMinimizedChange: vi.fn(),
  };
  render(<RestTimer state={state} now={NOW} {...handlers} {...options} />);
  return handlers;
}

describe("RestTimer", () => {
  it("shows the remaining time from the stored end instant", () => {
    setup({ status: "running", endsAt: NOW + 72_000, totalMs: 90_000 });
    expect(screen.getByText("1:12")).toBeTruthy();
  });

  it("exposes progress to assistive technology", () => {
    setup({ status: "running", endsAt: NOW + 45_000, totalMs: 90_000 });
    const bar = screen.getByRole("progressbar", { name: "Descanso" });
    expect(bar.getAttribute("aria-valuenow")).toBe("50");
    expect(bar.getAttribute("aria-valuetext")).toContain("restantes");
  });

  it("pauses a running rest and resumes a paused one", async () => {
    const running = setup({ status: "running", endsAt: NOW + 30_000, totalMs: 90_000 });
    await userEvent.click(screen.getByRole("button", { name: /Pausar/ }));
    expect(running.onPause).toHaveBeenCalledTimes(1);
    cleanup();

    const paused = setup({ status: "paused", remainingMs: 30_000, totalMs: 90_000 });
    await userEvent.click(screen.getByRole("button", { name: /Retomar/ }));
    expect(paused.onResume).toHaveBeenCalledTimes(1);
  });

  it("adds time and can be dismissed", async () => {
    const handlers = setup({ status: "running", endsAt: NOW + 30_000, totalMs: 90_000 });

    await userEvent.click(screen.getByRole("button", { name: "+15 s" }));
    await userEvent.click(screen.getByRole("button", { name: /Dispensar/ }));

    expect(handlers.onAddTime).toHaveBeenCalledWith(15);
    expect(handlers.onDismiss).toHaveBeenCalledTimes(1);
  });

  it("reports when the rest has ended so the parent can move to the finished state", () => {
    const handlers = setup({ status: "running", endsAt: NOW - 1, totalMs: 90_000 });
    expect(handlers.onFinish).toHaveBeenCalledTimes(1);
  });

  it("announces the finished rest in text, not only by color", () => {
    setup({ status: "done", totalMs: 90_000 });
    expect(screen.getAllByText("Descanso concluído").length).toBeGreaterThan(0);
    expect(screen.getByText("0:00")).toBeTruthy();
  });

  it("collapses to a compact bar that can be expanded again", async () => {
    const handlers = setup(
      { status: "paused", remainingMs: 38_000, totalMs: 90_000 },
      { minimized: true },
    );
    expect(screen.getByText("0:38")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Retomar/ })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Expandir" }));
    expect(handlers.onMinimizedChange).toHaveBeenCalledWith(false);
  });
});
