import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  icon: Icon,
  change,
  suffix,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  change?: number;
  suffix?: string;
}) {
  const positive = (change ?? 0) >= 0;
  return (
    <Card className="border-border/70 bg-card/75 shadow-none">
      <CardContent className="flex items-start justify-between p-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 font-mono text-2xl font-bold tracking-tight">
            {value}
            {suffix ? <span className="ml-1 text-sm font-medium text-muted-foreground">{suffix}</span> : null}
          </p>
          {typeof change === "number" ? (
            <p className={cn("mt-1 flex items-center gap-1 text-xs", positive ? "text-emerald-400" : "text-rose-400")}>
              {positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
              {Math.abs(change).toFixed(0)}% vs. período anterior
            </p>
          ) : null}
        </div>
        <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-4.5" />
        </span>
      </CardContent>
    </Card>
  );
}
