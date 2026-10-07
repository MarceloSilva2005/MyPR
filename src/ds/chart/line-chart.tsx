"use client";

import { scaleLinear } from "d3-scale";
import { line } from "d3-shape";
import { useId, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";

import { ChartMarker } from "./chart-marker";
import {
  axisLabelWidth,
  moveActivePoint,
  paddedDomain,
  type ActivePoint,
  type ChartPoint,
  type ChartSeries,
} from "./chart-model";
import { useElementWidth } from "./use-element-width";
import { cx } from "../cx";
import { dsLabels } from "../labels";

const MARGIN = { top: 12, right: 16, bottom: 28 } as const;
const POINTER_REACH = 48;

export interface LineChartProps {
  series: readonly ChartSeries[];
  /** Names the chart for assistive technology. */
  label: string;
  /** One sentence with the main reading of the data. */
  summary: string;
  height: number;
  formatX: (x: number) => string;
  formatY: (y: number) => string;
  className?: string;
}

export function LineChart({
  series,
  label,
  summary,
  height,
  formatX,
  formatY,
  className,
}: LineChartProps) {
  const [containerRef, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<ActivePoint | null>(null);
  const [focused, setFocused] = useState(false);
  const summaryId = useId();
  const hintId = useId();

  const allPoints = series.flatMap((item) => item.points);
  const innerHeight = height - MARGIN.top - MARGIN.bottom;

  const xValues = allPoints.map((point) => point.x);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const y = scaleLinear()
    .domain(paddedDomain(allPoints.map((point) => point.y)))
    .range([MARGIN.top + innerHeight, MARGIN.top])
    .nice(4);
  const yTicks = y.ticks(4);
  const left = axisLabelWidth(yTicks.map((tick) => formatY(tick)));
  const innerWidth = Math.max(0, width - left - MARGIN.right);
  const x = scaleLinear()
    .domain(xMin === xMax ? [xMin - 1, xMax + 1] : [xMin, xMax])
    .range([left, left + innerWidth]);

  const path = line<ChartPoint>()
    .x((point) => x(point.x))
    .y((point) => y(point.y));

  const activeSeries = active ? series[active.series] : undefined;
  const activePoint = active ? activeSeries?.points[active.point] : undefined;

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"] as const;
    const key = keys.find((candidate) => candidate === event.key);
    if (!key) return;
    event.preventDefault();
    setActive((current) => moveActivePoint(series, current ?? { series: 0, point: 0 }, key));
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - box.left;
    const py = event.clientY - box.top;
    let best: ActivePoint | null = null;
    let bestDistance = POINTER_REACH * POINTER_REACH;
    series.forEach((item, seriesIndex) => {
      item.points.forEach((point, pointIndex) => {
        const distance = (x(point.x) - px) ** 2 + (y(point.y) - py) ** 2;
        if (distance <= bestDistance) {
          bestDistance = distance;
          best = { series: seriesIndex, point: pointIndex };
        }
      });
    });
    setActive(best);
  }

  const ready = width > 0 && allPoints.length > 0;
  const tooltipX = activePoint ? Math.min(Math.max(x(activePoint.x), 64), width - 64) : 0;
  const tooltipY = activePoint ? y(activePoint.y) : 0;

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- keyboard-driven chart widget, see role="application"
    <div
      ref={containerRef}
      tabIndex={0}
      role="application"
      aria-roledescription="gráfico"
      aria-label={label}
      aria-describedby={`${summaryId} ${hintId}`}
      onKeyDown={onKeyDown}
      onFocus={() => {
        setFocused(true);
        setActive((current) => current ?? { series: 0, point: 0 });
      }}
      onBlur={() => {
        setFocused(false);
        setActive(null);
      }}
      onPointerMove={onPointerMove}
      onPointerLeave={() => {
        if (!focused) setActive(null);
      }}
      style={{ height }}
      className={cx("relative w-full rounded-md outline-offset-4", className)}
    >
      <p id={summaryId} className="sr-only">
        {summary}
      </p>
      <p id={hintId} className="sr-only">
        {dsLabels.chartHint}
      </p>
      <p aria-live="polite" className="sr-only">
        {activePoint && activeSeries
          ? `${activeSeries.label}: ${formatX(activePoint.x)}, ${formatY(activePoint.y)}`
          : ""}
      </p>

      {ready ? (
        <svg width={width} height={height} aria-hidden className="block overflow-visible">
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={left}
                x2={left + innerWidth}
                y1={y(tick)}
                y2={y(tick)}
                stroke="var(--color-line)"
              />
              <text
                x={left - 10}
                y={y(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-fg-subtle text-xs tabular-nums"
              >
                {formatY(tick)}
              </text>
            </g>
          ))}
          {x.ticks(Math.min(5, Math.max(2, Math.floor(innerWidth / 110)))).map((tick) => (
            <text
              key={tick}
              x={x(tick)}
              y={height - 6}
              textAnchor="middle"
              className="fill-fg-subtle text-xs tabular-nums"
            >
              {formatX(tick)}
            </text>
          ))}
          {activePoint ? (
            <line
              x1={x(activePoint.x)}
              x2={x(activePoint.x)}
              y1={MARGIN.top}
              y2={MARGIN.top + innerHeight}
              stroke="var(--color-line-control)"
              strokeDasharray="3 3"
            />
          ) : null}
          {series.map((item) => (
            <g key={item.id}>
              <path
                d={path(item.points as ChartPoint[]) ?? ""}
                fill="none"
                stroke={`var(--color-series-${String(item.colorIndex)})`}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {item.points.map((point, index) => (
                <ChartMarker
                  key={`${String(point.x)}-${String(index)}`}
                  colorIndex={item.colorIndex}
                  x={x(point.x)}
                  y={y(point.y)}
                  active={active?.series === series.indexOf(item) && active.point === index}
                />
              ))}
            </g>
          ))}
        </svg>
      ) : null}

      {ready && activePoint && activeSeries ? (
        <div
          aria-hidden
          style={{ left: tooltipX, top: tooltipY - 12 }}
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-line bg-overlay px-2 py-1 whitespace-nowrap shadow-float"
        >
          <p className="text-xs text-fg-muted">
            {activeSeries.label} · {formatX(activePoint.x)}
          </p>
          <p className="text-sm font-medium tabular-nums text-fg">{formatY(activePoint.y)}</p>
        </div>
      ) : null}
    </div>
  );
}
