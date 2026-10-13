"use client";

import { LogOut } from "lucide-react";

import { shellCopy } from "@/content/navigation";
import { cx } from "@/ds/cx";
import { signOut } from "@/features/auth/actions";

/**
 * Sign-out reachable from every page of the application (ASVS 5.0 7.4.4): in
 * the sidebar from tablet width up and in "Mais" on phones. Styled like the
 * navigation items it sits with.
 */
export function SignOutButton({
  layout,
  onPress,
}: {
  layout: "sidebar" | "sheet";
  onPress?: () => void;
}) {
  return (
    <form action={signOut}>
      <button
        type="submit"
        {...(onPress ? { onClick: onPress } : {})}
        className={cx(
          "flex w-full items-center rounded-md text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text",
          layout === "sidebar" &&
            "flex-col gap-1 px-1 py-2 text-center text-xs lg:flex-row lg:gap-3 lg:px-3 lg:text-left lg:text-sm",
          layout === "sheet" && "gap-3 px-3 py-3 text-base",
        )}
      >
        <LogOut aria-hidden className="size-5 shrink-0" />
        <span>{shellCopy.signOut}</span>
      </button>
    </form>
  );
}
