"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import { Button } from "../button";
import { cx } from "../cx";
import { DataTable, type DataColumn, type DataRow } from "../data-table";
import { InlineAlert, Skeleton } from "../feedback";
import { dsLabels } from "../labels";

export interface ChartFrameProps {
  title: string;
  description?: string;
  headingLevel?: "h2" | "h3";
  /** Filters and selectors that change what the chart shows. */
  controls?: ReactNode;
  legend?: ReactNode;
  state?: "ready" | "loading" | "empty" | "error";
  /** Shown when there is not enough data. It should explain what to do next. */
  emptyState?: ReactNode;
  errorMessage?: string;
  onRetry?: () => void;
  /** The same data as the chart, offered as a table for people who cannot use the graphic. */
  table?: { columns: readonly DataColumn[]; rows: readonly DataRow[] };
  /** Height reserved for the chart area. Loading and ready states share it, so nothing shifts. */
  height: number;
  className?: string;
  children: ReactNode;
}

/** Common structure of every chart: heading, controls, legend, content, states and a table alternative. */
export function ChartFrame({
  title,
  description,
  headingLevel: Heading = "h3",
  controls,
  legend,
  state = "ready",
  emptyState,
  errorMessage,
  onRetry,
  table,
  height,
  className,
  children,
}: ChartFrameProps) {
  const [showTable, setShowTable] = useState(false);
  const canShowTable = state === "ready" && table !== undefined;

  return (
    <section className={cx("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <Heading className="text-base font-medium tracking-tight text-fg">{title}</Heading>
          {description ? <p className="mt-0.5 text-sm text-fg-muted">{description}</p> : null}
        </div>
        {controls ? <div className="flex flex-wrap items-center gap-2">{controls}</div> : null}
      </div>

      {legend && state === "ready" && !showTable ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-muted">
          {legend}
        </div>
      ) : null}

      <div style={{ minHeight: height }}>
        {state === "loading" ? <Skeleton className="w-full" height={height} /> : null}
        {state === "empty" ? emptyState : null}
        {state === "error" ? (
          <InlineAlert
            tone="danger"
            title={errorMessage ?? "Não foi possível carregar os dados."}
            action={
              onRetry ? (
                <Button variant="secondary" size="sm" onPress={onRetry}>
                  Tentar novamente
                </Button>
              ) : undefined
            }
          >
            Os dados registrados continuam salvos.
          </InlineAlert>
        ) : null}
        {state === "ready" ? (
          showTable && table ? (
            <DataTable label={title} columns={table.columns} rows={table.rows} />
          ) : (
            children
          )
        ) : null}
      </div>

      {canShowTable ? (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => {
              setShowTable((current) => !current);
            }}
          >
            {showTable ? dsLabels.showChart : dsLabels.showTable}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
