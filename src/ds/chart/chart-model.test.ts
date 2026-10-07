import { describe, expect, it } from "vitest";

import {
  axisLabelWidth,
  moveActivePoint,
  nearestIndex,
  paddedDomain,
  type ChartSeries,
} from "./chart-model";

describe("paddedDomain", () => {
  it("adds breathing room without forcing zero", () => {
    const [min, max] = paddedDomain([100, 120]);
    expect(min).toBeCloseTo(98);
    expect(max).toBeCloseTo(122);
  });

  it("opens a range around a flat series so the line is not pinned to an edge", () => {
    const [min, max] = paddedDomain([80, 80, 80]);
    expect(min).toBeLessThan(80);
    expect(max).toBeGreaterThan(80);
  });

  it("handles a flat series at zero and an empty series", () => {
    expect(paddedDomain([0, 0])).toEqual([-1, 1]);
    expect(paddedDomain([])).toEqual([0, 1]);
  });
});

describe("nearestIndex", () => {
  it("returns the closest value", () => {
    expect(nearestIndex([0, 10, 20, 30], 12)).toBe(1);
    expect(nearestIndex([0, 10, 20, 30], 26)).toBe(3);
  });

  it("prefers the earlier value on a tie and handles an empty list", () => {
    expect(nearestIndex([0, 10], 5)).toBe(0);
    expect(nearestIndex([], 5)).toBe(-1);
  });
});

describe("moveActivePoint", () => {
  const series: ChartSeries[] = [
    {
      id: "a",
      label: "A",
      colorIndex: 1,
      points: [
        { x: 0, y: 1 },
        { x: 10, y: 2 },
        { x: 20, y: 3 },
      ],
    },
    {
      id: "b",
      label: "B",
      colorIndex: 2,
      points: [
        { x: 2, y: 5 },
        { x: 19, y: 6 },
      ],
    },
  ];

  it("walks along a series and stops at both ends", () => {
    expect(moveActivePoint(series, { series: 0, point: 1 }, "ArrowRight")).toEqual({
      series: 0,
      point: 2,
    });
    expect(moveActivePoint(series, { series: 0, point: 2 }, "ArrowRight").point).toBe(2);
    expect(moveActivePoint(series, { series: 0, point: 0 }, "ArrowLeft").point).toBe(0);
  });

  it("jumps to the first and last points", () => {
    expect(moveActivePoint(series, { series: 0, point: 1 }, "Home").point).toBe(0);
    expect(moveActivePoint(series, { series: 0, point: 1 }, "End").point).toBe(2);
  });

  it("switches series keeping the horizontal position", () => {
    expect(moveActivePoint(series, { series: 0, point: 2 }, "ArrowDown")).toEqual({
      series: 1,
      point: 1,
    });
    expect(moveActivePoint(series, { series: 0, point: 0 }, "ArrowUp")).toEqual({
      series: 1,
      point: 0,
    });
  });

  it("does nothing when there is no data", () => {
    const empty: ChartSeries[] = [{ id: "a", label: "A", colorIndex: 1, points: [] }];
    const active = { series: 0, point: 0 };
    expect(moveActivePoint(empty, active, "ArrowRight")).toBe(active);
  });
});

describe("axisLabelWidth", () => {
  it("grows with the longest label and never drops below the minimum", () => {
    expect(axisLabelWidth(["0", "5"])).toBe(44);
    expect(axisLabelWidth(["0 kg", "12.000 kg"])).toBeGreaterThan(
      axisLabelWidth(["0 kg", "120 kg"]),
    );
    expect(axisLabelWidth([])).toBe(44);
  });
});
