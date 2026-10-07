"use client";

import { scaleBand, scaleLinear } from "d3-scale";
import { useId, useState } from "react";
import type { KeyboardEvent } from "react";

import { axisLabelWidth } from "./chart-model";
import { useElementWidth } from "./use-element-width";
import { cx } from "../cx";
import { dsLabels } from "../labels";

const MARGIN = { top: 12, right: 8, bottom: 28 } as const;

export interface Bar {
  id: string;
  label: string;
  value: number;
}

export interface BarChartProps {
  bars: readonly Bar[];
  label: string;
  summary: string;
  height: number;
  formatValue: (value: number) => string;
  className?: string;
}

/** Bars always start at zero, because their length is the data. */
export function BarChart({ bars, label, summary, height, formatValue, className }: BarChartProps) {
  const [containerRef, width] = useElementWidth<HTMLDivElement>();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [focused, setFocused] = useState(false);
  const summaryId = useId();
  const hintId = useId();

  const innerHeight = height - MARGIN.top - MARGIN.bottom;
  const y = scaleLinear()
    .domain([0, Math.max(...bars.map((bar) => bar.value), 1)])
    .range([MARGIN.top + innerHeight, MARGIN.top])
    .nice(4);
  const yTicks = y.ticks(4);
  const left = axisLabelWidth(yTicks.map((tick) => formatValue(tick)));
  const innerWidth = Math.max(0, width - left - MARGIN.right);
  const x = scaleBand()
    .domain(bars.map((bar) => bar.id))
    .range([left, left + innerWidth])
    .padding(0.3);

  const activeBar = activeIndex === null ? undefined : bars[activeIndex];

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const last = bars.length - 1;
    const move: Record<string, (current: number) => number> = {
      ArrowLeft: (current) => Math.max(0, current - 1),
      ArrowRight: (current) => Math.min(last, current + 1),
      Home: () => 0,
      End: () => last,
    };
    const step = move[event.key];
    if (!step) return;
    event.preventDefault();
    setActiveIndex((current) => step(current ?? 0));
  }

  const ready = width > 0 && bars.length > 0;
  const barCenter = (id: string): number => (x(id) ?? 0) + x.bandwidth() / 2;

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
        setActiveIndex((current) => current ?? 0);
      }}
      onBlur={() => {
        setFocused(false);
        setActiveIndex(null);
      }}
      onPointerLeave={() => {
        if (!focused) setActiveIndex(null);
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
        {activeBar ? `${activeBar.label}: ${formatValue(activeBar.value)}` : ""}
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
                {formatValue(tick)}
              </text>
            </g>
          ))}
          {bars.map((bar, index) => (
            <g key={bar.id}>
              <rect
                x={x(bar.id)}
                y={y(bar.value)}
                width={x.bandwidth()}
                height={Math.max(0, y(0) - y(bar.value))}
                rx={2}
                fill="var(--color-series-1)"
                opacity={activeIndex === null || activeIndex === index ? 1 : 0.45}
                onPointerEnter={() => {
                  setActiveIndex(index);
                }}
              />
              <text
                x={barCenter(bar.id)}
                y={height - 6}
                textAnchor="middle"
                className="fill-fg-subtle text-xs"
              >
                {bar.label}
              </text>
            </g>
          ))}
        </svg>
      ) : null}

      {ready && activeBar ? (
        <div
          aria-hidden
          style={{
            left: Math.min(Math.max(barCenter(activeBar.id), 56), width - 56),
            top: y(activeBar.value) - 8,
          }}
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-line bg-overlay px-2 py-1 whitespace-nowrap shadow-float"
        >
          <p className="text-xs text-fg-muted">{activeBar.label}</p>
          <p className="text-sm font-medium tabular-nums text-fg">{formatValue(activeBar.value)}</p>
        </div>
      ) : null}
    </div>
  );
}
