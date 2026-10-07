import type { ReactNode } from "react";

/** One block of the gallery. The id doubles as the anchor and as the visual test target. */
export function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-4 border-t border-line py-8"
    >
      <div className="mb-6 max-w-prose">
        <h2 id={`${id}-title`} className="text-lg font-semibold tracking-tight">
          {title}
        </h2>
        {description ? <p className="mt-1 text-sm text-fg-muted">{description}</p> : null}
      </div>
      <div className="space-y-8">{children}</div>
    </section>
  );
}

/** A labeled group of examples inside a section. */
export function Specimen({
  id,
  label,
  children,
  className,
}: {
  id?: string;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div {...(id ? { id } : {})}>
      <p className="mb-3 text-xs font-medium tracking-wide text-fg-muted uppercase">{label}</p>
      <div className={className ?? "flex flex-wrap items-start gap-3"}>{children}</div>
    </div>
  );
}
