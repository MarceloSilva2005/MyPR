// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ActivityStrip } from "./activity-strip";
import { BarChart } from "./bar-chart";
import { ChartFrame } from "./chart-frame";
import type { ChartSeries } from "./chart-model";
import { LineChart } from "./line-chart";
import { stubLayout } from "@/test/render";

beforeEach(() => {
  stubLayout(640);
});

afterEach(cleanup);

const series: ChartSeries[] = [
  {
    id: "bench",
    label: "Supino reto",
    colorIndex: 1,
    points: [
      { x: 1, y: 92 },
      { x: 2, y: 96 },
      { x: 3, y: 104.5 },
    ],
  },
  {
    id: "squat",
    label: "Agachamento",
    colorIndex: 2,
    points: [
      { x: 1, y: 120 },
      { x: 2, y: 128 },
      { x: 3, y: 138 },
    ],
  },
];

const formatY = (value: number): string => `${String(value)} kg`;

function renderLine() {
  render(
    <LineChart
      series={series}
      label="Evolução do 1RM"
      summary="O 1RM subiu nas três semanas."
      height={240}
      formatX={(x) => `semana ${String(x)}`}
      formatY={formatY}
    />,
  );
  return screen.getByRole("application", { name: "Evolução do 1RM" });
}

describe("LineChart", () => {
  it("is reachable by keyboard and described by its summary", () => {
    const chart = renderLine();
    expect(chart.getAttribute("tabindex")).toBe("0");
    expect(chart.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText("O 1RM subiu nas três semanas.")).toBeTruthy();
  });

  it("announces the exact value of the point selected with the arrow keys", async () => {
    const chart = renderLine();
    chart.focus();

    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getAllByText("Supino reto: semana 2, 96 kg").length).toBeGreaterThan(0);

    await userEvent.keyboard("{End}");
    expect(screen.getAllByText("Supino reto: semana 3, 104.5 kg").length).toBeGreaterThan(0);
  });

  it("switches series with the vertical arrows", async () => {
    const chart = renderLine();
    chart.focus();

    await userEvent.keyboard("{ArrowDown}");

    expect(screen.getAllByText("Agachamento: semana 1, 120 kg").length).toBeGreaterThan(0);
  });

  it("gives each series its own marker shape, not only its own color", () => {
    renderLine();
    const paths = [...document.querySelectorAll("svg path[transform]")];
    const circleMarker = paths.find((path) => path.getAttribute("d")?.includes("a 4 4"));
    const squareMarker = paths.find((path) => path.getAttribute("d")?.includes("h 8 v 8"));
    expect(circleMarker).toBeTruthy();
    expect(squareMarker).toBeTruthy();
  });
});

describe("BarChart", () => {
  it("moves between bars with the keyboard and announces exact values", async () => {
    render(
      <BarChart
        bars={[
          { id: "a", label: "17 ago", value: 8200 },
          { id: "b", label: "24 ago", value: 9100 },
        ]}
        label="Volume semanal"
        summary="O volume subiu."
        height={200}
        formatValue={(value) => `${String(value)} kg`}
      />,
    );
    screen.getByRole("application", { name: "Volume semanal" }).focus();

    await userEvent.keyboard("{ArrowRight}");

    expect(screen.getAllByText("24 ago: 9100 kg").length).toBeGreaterThan(0);
  });
});

describe("ChartFrame", () => {
  const table = {
    columns: [
      { id: "week", label: "Semana", isRowHeader: true },
      { id: "load", label: "1RM", numeric: true },
    ],
    rows: [{ id: "1", cells: { week: "17 ago", load: "92 kg" } }],
  };

  it("offers the same data as a table and returns to the chart", async () => {
    render(
      <ChartFrame title="1RM estimado" height={200} table={table}>
        <p>grafico</p>
      </ChartFrame>,
    );
    expect(screen.getByText("grafico")).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: "Ver como tabela" }));
    expect(screen.queryByText("grafico")).toBeNull();
    expect(screen.getByText("92 kg")).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: "Ver como gráfico" }));
    expect(screen.getByText("grafico")).toBeTruthy();
  });

  it("shows the empty state instead of drawing an empty chart", () => {
    render(
      <ChartFrame
        title="1RM estimado"
        height={200}
        state="empty"
        emptyState={<p>Ainda não há séries neste período.</p>}
      >
        <p>grafico</p>
      </ChartFrame>,
    );
    expect(screen.getByText("Ainda não há séries neste período.")).toBeTruthy();
    expect(screen.queryByText("grafico")).toBeNull();
  });

  it("keeps data safe and offers a retry on error", async () => {
    const onRetry = vi.fn();
    render(
      <ChartFrame title="1RM estimado" height={200} state="error" onRetry={onRetry}>
        <p>grafico</p>
      </ChartFrame>,
    );

    expect(screen.getByRole("alert").textContent).toContain("continuam salvos");
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("reserves the chart height while loading so the layout does not move", () => {
    const { container } = render(
      <ChartFrame title="1RM estimado" height={260} state="loading">
        <p>grafico</p>
      </ChartFrame>,
    );
    const placeholder = container.querySelector<HTMLElement>("[aria-hidden]");
    expect(placeholder?.style.height).toBe("260px");
  });
});

describe("ActivityStrip", () => {
  it("describes each day in text, without relying on the filled square", () => {
    render(
      <ActivityStrip
        label="Treinos desta semana"
        days={[
          { id: "mon", label: "Seg", description: "segunda-feira", sessions: 1 },
          { id: "tue", label: "Ter", description: "terça-feira", sessions: 0 },
        ]}
      />,
    );
    expect(screen.getByText("segunda-feira: 1 treino")).toBeTruthy();
    expect(screen.getByText("terça-feira: sem treino")).toBeTruthy();
  });
});
