import { Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)} aria-label="MyPR">
      <span className="grid size-10 place-items-center rounded-xl bg-[linear-gradient(135deg,#5b8cff_0%,#2d6bff_55%,#194dcb_100%)] text-primary-foreground shadow-[0_10px_28px_rgba(42,127,255,.32)] ring-1 ring-white/20">
        <Dumbbell className="size-5" strokeWidth={2.4} />
      </span>
      {compact ? null : (
        <div>
          <p className="text-lg font-bold tracking-tight text-foreground">MyPR</p>
          <p className="text-xs text-muted-foreground">Seu treino. Sua evolução.</p>
        </div>
      )}
    </div>
  );
}
