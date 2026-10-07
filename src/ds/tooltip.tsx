"use client";

import type { ReactNode } from "react";
import { Tooltip as AriaTooltip, TooltipTrigger } from "react-aria-components";

/**
 * Short supporting text for a control that already has a visible or accessible name.
 * It never replaces a label, and it must not hold information needed to complete a task.
 */
export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  return (
    <TooltipTrigger delay={400} closeDelay={0}>
      {children}
      <AriaTooltip
        offset={6}
        className="max-w-60 rounded-md bg-fg px-2 py-1 text-xs text-bg data-[entering]:animate-fade-in"
      >
        {content}
      </AriaTooltip>
    </TooltipTrigger>
  );
}
