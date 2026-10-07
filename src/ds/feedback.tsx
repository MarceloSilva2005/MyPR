import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cx } from "./cx";
import { dsLabels } from "./labels";

type HeadingLevel = "h1" | "h2" | "h3";

export function Spinner({ label = dsLabels.loading }: { label?: string }) {
  return (
    <span role="status" className="inline-flex items-center">
      <LoaderCircle aria-hidden className="size-4 animate-spin text-fg-muted" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * Placeholder that must reserve the exact dimensions of the content it stands in for,
 * so loading never shifts the layout. Pass the final size through className.
 */
export function Skeleton({ className, height }: { className?: string; height?: number }) {
  return (
    <div
      aria-hidden
      {...(height === undefined ? {} : { style: { height } })}
      className={cx("animate-pulse-soft rounded-md bg-surface-hover", className)}
    />
  );
}

interface StateProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  headingLevel?: HeadingLevel;
  className?: string;
}

function StateBody({
  title,
  description,
  actions,
  headingLevel: Heading = "h2",
  className,
}: StateProps) {
  return (
    <div className={cx("flex max-w-md flex-col items-start gap-3", className)}>
      <Heading className="text-base font-medium tracking-tight text-fg">{title}</Heading>
      {description ? <p className="text-sm text-fg-muted">{description}</p> : null}
      {actions ? <div className="mt-1 flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Explains why a region has no content and offers the next useful action. */
export function EmptyState(props: StateProps) {
  return <StateBody {...props} className={cx("py-12", props.className)} />;
}

/** Page-level failure. Always offers a way to retry and a safe way out. */
export function ErrorState(props: StateProps) {
  return (
    <div role="alert">
      <StateBody {...props} className={cx("py-12", props.className)} />
    </div>
  );
}

type AlertTone = "info" | "success" | "warning" | "danger";

// Tone lives in the icon and a thin rule; the body stays neutral so alerts do not dominate the page.
const alertStyles: Record<AlertTone, { rule: string; icon: string; Icon: typeof Info }> = {
  info: { rule: "border-l-accent", icon: "text-accent-text", Icon: Info },
  success: { rule: "border-l-success", icon: "text-success", Icon: CircleCheck },
  warning: { rule: "border-l-warning", icon: "text-warning", Icon: TriangleAlert },
  danger: { rule: "border-l-danger", icon: "text-danger", Icon: CircleAlert },
};

interface InlineAlertProps {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Persistent message inside the page. Use it for errors that need action; toasts vanish. */
export function InlineAlert({
  tone = "info",
  title,
  children,
  action,
  className,
}: InlineAlertProps) {
  const { rule, icon, Icon } = alertStyles[tone];
  const urgent = tone === "danger" || tone === "warning";

  return (
    <div
      role={urgent ? "alert" : "status"}
      className={cx(
        "flex items-start gap-3 rounded-lg border border-l-2 border-line bg-surface p-3",
        rule,
        className,
      )}
    >
      <Icon aria-hidden className={cx("mt-0.5 size-4 shrink-0", icon)} />
      <div className="min-w-0 flex-1 text-sm">
        {title ? <p className="font-medium text-fg">{title}</p> : null}
        <div className={cx("text-fg-muted", title && "mt-0.5")}>{children}</div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
