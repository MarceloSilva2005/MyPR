import { cx } from "./cx";

/** The MyPR wordmark. Typographic on purpose: no icon, no decoration. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cx("text-lg font-semibold tracking-tight text-fg", className)}>
      My<span className="text-accent-text">PR</span>
    </span>
  );
}
