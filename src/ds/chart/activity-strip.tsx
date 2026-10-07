import { Check } from "lucide-react";

import { cx } from "../cx";

export interface ActivityDay {
  id: string;
  /** Short weekday label, for example "Seg". */
  label: string;
  /** Full description read by assistive technology, for example "segunda-feira, 12 de outubro". */
  description: string;
  sessions: number;
}

/** Days trained in a week. Informative only: a missed day is shown as empty, never as a loss. */
export function ActivityStrip({
  days,
  label,
  className,
}: {
  days: readonly ActivityDay[];
  label: string;
  className?: string;
}) {
  return (
    <ul aria-label={label} className={cx("grid grid-cols-7 gap-2", className)}>
      {days.map((day) => {
        const trained = day.sessions > 0;
        return (
          <li key={day.id} className="flex flex-col items-center gap-1">
            <span
              aria-hidden
              className={cx(
                "flex size-9 items-center justify-center rounded-md border",
                trained ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface",
              )}
            >
              {trained ? <Check className="size-4" /> : null}
            </span>
            <span aria-hidden className="text-xs text-fg-muted">
              {day.label}
            </span>
            <span className="sr-only">
              {day.description}: {trained ? `${String(day.sessions)} treino` : "sem treino"}
              {day.sessions > 1 ? "s" : ""}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
