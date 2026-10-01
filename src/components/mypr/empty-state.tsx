import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import type { MarkProps } from "@/components/mypr/icons";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: ComponentType<MarkProps>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="border border-border px-6 py-10">
      <Icon className="size-6 text-primary" />
      <h3 className="mt-4 text-2xl">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {actionLabel && onAction ? (
        <Button size="sm" onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
