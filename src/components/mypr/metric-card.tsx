import type { ComponentType } from "react";
import { MarkDown, MarkUp, type MarkProps } from "@/components/mypr/icons";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  change,
  suffix,
}: {
  label: string;
  value: string | number;
  icon?: ComponentType<MarkProps>;
  change?: number;
  suffix?: string;
}) {
  const positive = (change ?? 0) >= 0;
  return (
    <div className="border-t border-foreground pt-3">
      <p className="mypr-kicker">{label}</p>
      <p className="mypr-num mt-2 text-3xl text-foreground">
        {value}
        {suffix ? <span className="ml-1 text-sm text-muted-foreground">{suffix}</span> : null}
      </p>
      {typeof change === "number" ? (
        <p className={cn("mt-2 flex items-center gap-1 text-xs", positive ? "text-record" : "text-primary")}>
          {positive ? <MarkUp className="size-3.5" /> : <MarkDown className="size-3.5" />}
          {Math.abs(change).toFixed(0)}% na comparação
        </p>
      ) : null}
    </div>
  );
}
