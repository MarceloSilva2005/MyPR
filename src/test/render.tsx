import { render, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";
import { I18nProvider } from "react-aria-components";

/** Renders with the same locale provider as the application. */
export function renderWithLocale(ui: ReactElement): RenderResult {
  return render(<I18nProvider locale="pt-BR">{ui}</I18nProvider>);
}

/** jsdom has no layout engine, so charts need a fixed width and a no-op resize observer. */
export function stubLayout(width = 600): void {
  class ResizeObserverStub {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  globalThis.ResizeObserver = ResizeObserverStub;
  Element.prototype.getBoundingClientRect = () =>
    ({ width, height: 200, top: 0, left: 0, right: width, bottom: 200, x: 0, y: 0 }) as DOMRect;
}
