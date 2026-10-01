import { MarkBar } from "@/components/mypr/icons";
import { cn } from "@/lib/utils";

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)} aria-label="MyPR">
      <MarkBar className="size-7 text-primary" />
      {compact ? null : (
        <div>
          <p className="font-heading text-2xl leading-none text-foreground">MyPR</p>
          <p className="mypr-kicker mt-1">Caderno de carga</p>
        </div>
      )}
    </div>
  );
}
