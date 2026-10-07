"use client";

import { Button } from "./button";
import { cx } from "./cx";
import { dsLabels } from "./labels";

export type SyncState = "saved-local" | "syncing" | "synced" | "unsynced" | "offline";

/**
 * Each state has its own shape as well as its own color, so it can be told apart without
 * relying on color alone.
 */
const indicators: Record<SyncState, string> = {
  "saved-local": "rounded-full border-2 border-fg-subtle",
  syncing: "rounded-full border-2 border-accent-text border-t-transparent animate-spin",
  synced: "rounded-full bg-success",
  unsynced: "rotate-45 rounded-sm bg-warning",
  offline: "rounded-sm border-2 border-fg-subtle",
};

/** Discreet persistence indicator for the workout header. */
export function SyncStatus({
  state,
  onRetry,
  className,
}: {
  state: SyncState;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div role="status" className={cx("flex items-center gap-2 text-xs text-fg-muted", className)}>
      <span aria-hidden className={cx("size-2.5 shrink-0", indicators[state])} />
      <span>{dsLabels.sync[state]}</span>
      {state === "unsynced" && onRetry ? (
        <Button variant="ghost" size="sm" onPress={onRetry}>
          {dsLabels.sync.retry}
        </Button>
      ) : null}
    </div>
  );
}
