import { Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)} aria-label="MyPR">
      <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(42,127,255,.25)]">
        <Dumbbell className="size-5" strokeWidth={2.4} />
      </span>
      {compact ? null : (
        <div>
          <p className="text-lg font-bold tracking-tight">MyPR</p>
          <p className="text-xs text-muted-foreground">Seu treino. Sua evolução.</p>
        </div>
      )}
    </div>
  );
}
