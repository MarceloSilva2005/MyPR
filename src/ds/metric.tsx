import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { cx } from "./cx";
import { formatNumber, formatSigned } from "@/lib/format";

export type MetricTrend = "positive" | "negative" | "neutral";

export interface MetricDelta {
  value: number;
  unit?: string;
  /** Whether the change is good, bad or neutral. It is independent of the sign. */
  trend: MetricTrend;
  /** Time reference, for example "vs. semana anterior". */
  context: string;
}

const trendStyles: Record<MetricTrend, { color: string; Icon: typeof Minus }> = {
  positive: { color: "text-success", Icon: ArrowUpRight },
  negative: { color: "text-danger", Icon: ArrowDownRight },
  neutral: { color: "text-fg-muted", Icon: Minus },
};

interface MetricProps {
  label: string;
  value: number | string;
  unit?: string;
  /** Digits kept when `value` is a number. */
  fractionDigits?: number;
  delta?: MetricDelta;
  /** Time window the value refers to, for example "esta semana". */
  period?: string;
  className?: string;
}

/** A single number with its unit, its change and the period it refers to. */
export function Metric({
  label,
  value,
  unit,
  fractionDigits = 1,
  delta,
  period,
  className,
}: MetricProps) {
  const display = typeof value === "number" ? formatNumber(value, fractionDigits) : value;
  const trend = delta ? trendStyles[delta.trend] : undefined;

  return (
    <div className={cx("min-w-0", className)}>
      <p className="text-xs text-fg-muted">
        {label}
        {period ? <span className="text-fg-subtle"> · {period}</span> : null}
      </p>
      <p className="mt-1 flex items-baseline gap-1 tabular-nums">
        <span className="text-2xl font-semibold tracking-tight text-fg">{display}</span>
        {unit ? <span className="text-sm text-fg-muted">{unit}</span> : null}
      </p>
      {delta && trend ? (
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs tabular-nums">
          <span className={cx("inline-flex items-center gap-1 whitespace-nowrap", trend.color)}>
            <trend.Icon aria-hidden className="size-3.5" />
            {formatSigned(delta.value, fractionDigits)}
            {delta.unit ? ` ${delta.unit}` : ""}
          </span>
          <span className="text-fg-subtle">{delta.context}</span>
        </p>
      ) : null}
    </div>
  );
}
