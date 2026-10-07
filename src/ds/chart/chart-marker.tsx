import { SERIES_MARKERS, type SeriesIndex } from "./chart-model";

/** SVG path of a marker centered on the origin. */
function markerPath(shape: (typeof SERIES_MARKERS)[SeriesIndex], r: number): string {
  switch (shape) {
    case "circle":
      return `M ${String(-r)} 0 a ${String(r)} ${String(r)} 0 1 0 ${String(r * 2)} 0 a ${String(r)} ${String(r)} 0 1 0 ${String(-r * 2)} 0`;
    case "square":
      return `M ${String(-r)} ${String(-r)} h ${String(r * 2)} v ${String(r * 2)} h ${String(-r * 2)} Z`;
    case "diamond":
      return `M 0 ${String(-r * 1.3)} L ${String(r * 1.3)} 0 L 0 ${String(r * 1.3)} L ${String(-r * 1.3)} 0 Z`;
    case "triangle":
      return `M 0 ${String(-r * 1.2)} L ${String(r * 1.15)} ${String(r)} L ${String(-r * 1.15)} ${String(r)} Z`;
    case "cross":
      return `M ${String(-r)} ${String(-r)} L ${String(r)} ${String(r)} M ${String(r)} ${String(-r)} L ${String(-r)} ${String(r)}`;
  }
}

interface MarkerProps {
  colorIndex: SeriesIndex;
  x: number;
  y: number;
  radius?: number;
  active?: boolean;
}

/** One marker per point. The shape identifies the series even without color. */
export function ChartMarker({ colorIndex, x, y, radius = 4, active = false }: MarkerProps) {
  const shape = SERIES_MARKERS[colorIndex];
  const color = `var(--color-series-${String(colorIndex)})`;
  const size = active ? radius + 1.5 : radius;

  return (
    <path
      d={markerPath(shape, size)}
      transform={`translate(${String(x)} ${String(y)})`}
      fill={shape === "cross" ? "none" : color}
      stroke={shape === "cross" ? color : "var(--color-bg)"}
      strokeWidth={shape === "cross" ? 2 : active ? 2 : 1.5}
    />
  );
}

/** Legend swatch that matches the chart marker of the series. */
export function LegendMarker({ colorIndex }: { colorIndex: SeriesIndex }) {
  return (
    <svg aria-hidden width="12" height="12" viewBox="-6 -6 12 12" className="shrink-0">
      <ChartMarker colorIndex={colorIndex} x={0} y={0} radius={4} />
    </svg>
  );
}
