export type SeriesIndex = 1 | 2 | 3 | 4 | 5;

export type MarkerShape = "circle" | "square" | "diamond" | "triangle" | "cross";

/** Each series pairs a stable color with its own marker, so hue is never the only cue. */
export const SERIES_MARKERS: Record<SeriesIndex, MarkerShape> = {
  1: "circle",
  2: "square",
  3: "diamond",
  4: "triangle",
  5: "cross",
};

export interface ChartPoint {
  /** Position on the horizontal axis, for example a timestamp in milliseconds. */
  x: number;
  y: number;
}

export interface ChartSeries {
  id: string;
  label: string;
  colorIndex: SeriesIndex;
  points: readonly ChartPoint[];
}

/**
 * Vertical domain that fits the data with some breathing room. It does not force zero:
 * a trend line is judged by its shape, and a forced baseline would flatten it.
 */
export function paddedDomain(values: readonly number[]): [number, number] {
  if (values.length === 0) return [0, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    const spread = Math.abs(min) * 0.05 || 1;
    return [min - spread, max + spread];
  }
  const padding = (max - min) * 0.1;
  return [min - padding, max + padding];
}

/** Index of the value in `xs` closest to `x`. Returns -1 for an empty list. */
export function nearestIndex(xs: readonly number[], x: number): number {
  let best = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  xs.forEach((candidate, index) => {
    const distance = Math.abs(candidate - x);
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  });
  return best;
}

export interface ActivePoint {
  series: number;
  point: number;
}

/** Moves the active point with the arrow keys: left and right along a series, up and down between series. */
export function moveActivePoint(
  series: readonly ChartSeries[],
  active: ActivePoint,
  key: "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown" | "Home" | "End",
): ActivePoint {
  const current = series[active.series];
  if (!current || current.points.length === 0) return active;
  const last = current.points.length - 1;

  switch (key) {
    case "ArrowLeft":
      return { ...active, point: Math.max(0, active.point - 1) };
    case "ArrowRight":
      return { ...active, point: Math.min(last, active.point + 1) };
    case "Home":
      return { ...active, point: 0 };
    case "End":
      return { ...active, point: last };
    case "ArrowUp":
    case "ArrowDown": {
      const step = key === "ArrowUp" ? -1 : 1;
      const target = (active.series + step + series.length) % series.length;
      const targetSeries = series[target];
      const x = current.points[active.point]?.x;
      if (!targetSeries || targetSeries.points.length === 0 || x === undefined) return active;
      return {
        series: target,
        point: nearestIndex(
          targetSeries.points.map((point) => point.x),
          x,
        ),
      };
    }
  }
}

/** Width reserved for the value axis, sized to the longest tick label so none is clipped. */
export function axisLabelWidth(labels: readonly string[]): number {
  const longest = Math.max(0, ...labels.map((label) => label.length));
  return Math.max(44, 18 + longest * 7);
}
