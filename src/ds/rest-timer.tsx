"use client";

import { ChevronDown, ChevronUp, Pause, Play, X } from "lucide-react";
import { useEffect } from "react";
import { ProgressBar } from "react-aria-components";

import { Button } from "./button";
import { cx } from "./cx";
import { dsLabels } from "./labels";
import { elapsedFraction, isFinished, remainingMs, type RestTimerState } from "./rest-timer-model";
import { useNow } from "./use-now";
import { formatDuration } from "@/lib/format";

interface RestTimerProps {
  state: RestTimerState;
  minimized?: boolean;
  /** Overrides the clock. Used for deterministic previews and tests. */
  now?: number;
  /** Seconds added by the extra-time button. */
  addSeconds?: number;
  onPause: () => void;
  onResume: () => void;
  onAddTime: (seconds: number) => void;
  onDismiss: () => void;
  onFinish: () => void;
  onMinimizedChange: (minimized: boolean) => void;
  className?: string;
}

/** Counts the rest between sets. It reads the clock itself, so the parent only stores the state. */
export function RestTimer({
  state,
  minimized = false,
  now: nowOverride,
  addSeconds = 15,
  onPause,
  onResume,
  onAddTime,
  onDismiss,
  onFinish,
  onMinimizedChange,
  className,
}: RestTimerProps) {
  const clock = useNow(state.status === "running" && nowOverride === undefined);
  const now = nowOverride ?? clock;
  const remaining = remainingMs(state, now);
  const done = state.status === "done";
  const text = formatDuration(Math.ceil(remaining / 1000));

  useEffect(() => {
    if (state.status === "running" && isFinished(state, now)) onFinish();
  }, [state, now, onFinish]);

  const bar = (
    <ProgressBar
      aria-label={dsLabels.rest.title}
      value={Math.round(elapsedFraction(state, now) * 100)}
      valueLabel={done ? dsLabels.rest.done : `${text} ${dsLabels.rest.remaining}`}
      className="w-full"
    >
      {({ percentage }) => (
        <div className="h-1 overflow-hidden rounded-sm bg-surface-hover">
          <div
            className={cx("h-full bg-accent", done && "bg-success")}
            style={{ width: `${String(percentage)}%` }}
          />
        </div>
      )}
    </ProgressBar>
  );

  const toggle = (
    <Button
      variant="ghost"
      size="sm"
      iconOnly
      aria-label={minimized ? dsLabels.rest.expand : dsLabels.rest.minimize}
      onPress={() => {
        onMinimizedChange(!minimized);
      }}
    >
      {minimized ? (
        <ChevronUp aria-hidden className="size-4" />
      ) : (
        <ChevronDown aria-hidden className="size-4" />
      )}
    </Button>
  );

  if (minimized) {
    return (
      <section
        aria-label={dsLabels.rest.title}
        className={cx(
          "flex items-center gap-3 rounded-lg border border-line bg-overlay py-1 pr-1 pl-4",
          className,
        )}
      >
        <span
          className={cx(
            "font-mono text-sm font-medium tabular-nums",
            done ? "text-success" : "text-fg",
          )}
        >
          {text}
        </span>
        {done ? <span className="text-xs text-success">{dsLabels.rest.done}</span> : null}
        <div className="flex-1">{bar}</div>
        {toggle}
      </section>
    );
  }

  return (
    <section
      aria-label={dsLabels.rest.title}
      className={cx("rounded-lg border border-line bg-overlay p-4", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-fg-muted">{dsLabels.rest.title}</p>
          <p
            aria-live="off"
            className={cx(
              "mt-1 font-mono text-3xl font-medium tracking-tight tabular-nums",
              done ? "text-success" : "text-fg",
            )}
          >
            {text}
          </p>
          {done ? <p className="mt-1 text-sm text-success">{dsLabels.rest.done}</p> : null}
        </div>
        {toggle}
      </div>
      <div className="mt-3">{bar}</div>
      <div className="mt-4 flex flex-wrap gap-2">
        {done ? null : (
          <Button variant="secondary" onPress={state.status === "paused" ? onResume : onPause}>
            {state.status === "paused" ? (
              <Play aria-hidden className="size-4" />
            ) : (
              <Pause aria-hidden className="size-4" />
            )}
            {state.status === "paused" ? dsLabels.rest.resume : dsLabels.rest.pause}
          </Button>
        )}
        <Button
          variant="secondary"
          onPress={() => {
            onAddTime(addSeconds);
          }}
        >
          +{addSeconds} s
        </Button>
        <Button variant="ghost" onPress={onDismiss}>
          <X aria-hidden className="size-4" />
          {dsLabels.rest.dismiss}
        </Button>
      </div>
      <p role="status" className="sr-only">
        {done ? dsLabels.rest.done : ""}
      </p>
    </section>
  );
}
