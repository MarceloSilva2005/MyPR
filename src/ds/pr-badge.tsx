import type { ReactNode } from "react";

import { cx } from "./cx";

/** Marks a personal record next to the set that produced it. Objective, never celebratory. */
export function PRBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-2 text-sm text-accent-text", className)}>
      <span className="rounded-sm bg-accent px-1.5 py-0.5 font-mono text-xs font-medium text-accent-fg">
        PR
      </span>
      <span>{children}</span>
    </span>
  );
}
