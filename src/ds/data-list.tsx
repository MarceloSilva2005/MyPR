import type { ReactNode } from "react";

import { cx } from "./cx";

export interface DataListItem {
  id: string;
  title: ReactNode;
  /** Supporting line, for example a date or the origin of the value. */
  meta?: ReactNode;
  /** Figure on the right, for example a load or a volume. */
  value?: ReactNode;
}

/** A compact list of labeled rows. Works on any width, so it is the narrow-screen counterpart of DataTable. */
export function DataList({
  items,
  label,
  className,
}: {
  items: readonly DataListItem[];
  label: string;
  className?: string;
}) {
  return (
    <ul aria-label={label} className={cx("divide-y divide-line border-y border-line", className)}>
      {items.map((item) => (
        <li key={item.id} className="flex items-baseline justify-between gap-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-fg">{item.title}</p>
            {item.meta ? (
              <p className="mt-0.5 truncate text-xs text-fg-muted">{item.meta}</p>
            ) : null}
          </div>
          {item.value ? (
            <p className="shrink-0 text-sm font-medium tabular-nums text-fg">{item.value}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
