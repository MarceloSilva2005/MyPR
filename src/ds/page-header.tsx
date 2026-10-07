import type { ReactNode } from "react";

import { cx } from "./cx";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

/** Title block of a page. The only h1 of the screen. */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cx(
        "mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-line pb-4 md:mb-8",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-fg">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-prose text-sm text-fg-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/** Limits line length and keeps forms from stretching on wide screens. */
export function PageContainer({
  children,
  width = "wide",
  className,
}: {
  children: ReactNode;
  width?: "narrow" | "wide";
  className?: string;
}) {
  return (
    <div
      className={cx(
        "mx-auto w-full px-4 py-6 md:px-8 md:py-8",
        width === "narrow" ? "max-w-2xl" : "max-w-6xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
