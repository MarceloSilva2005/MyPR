"use client";

import { MoreHorizontal } from "lucide-react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";

import {
  mobileBarIds,
  primaryNavigation,
  settingsNavigation,
  shellCopy,
} from "@/content/navigation";
import { Wordmark } from "@/ds/brand";
import { Button, ButtonLink } from "@/ds/button";
import { useNow } from "@/ds/use-now";
import { NavLink } from "./nav-link";
import { formatDuration } from "@/lib/format";

// The sheet only matters on phones and only once opened, so its code is fetched on demand.
const MoreSheet = dynamic(() => import("./more-sheet").then((module) => module.MoreSheet));

export interface ActiveWorkout {
  name: string;
  startedAt: number;
}

function ElapsedTime({ startedAt }: { startedAt: number }) {
  const now = useNow(true, 1000);
  return (
    <span data-elapsed className="tabular-nums">
      {formatDuration((now - startedAt) / 1000)}
    </span>
  );
}

/**
 * Responsive application frame: persistent sidebar from tablet width up, bottom bar on phones.
 * While a workout is active the phone bar shrinks to the workout and "Mais", to avoid leaving by accident.
 */
export function AppShell({
  children,
  activeWorkout,
}: {
  children: ReactNode;
  activeWorkout?: ActiveWorkout | undefined;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const mobileItems = primaryNavigation.filter((item) => mobileBarIds.includes(item.id));
  const moreItems = [
    ...primaryNavigation.filter((item) => !mobileBarIds.includes(item.id)),
    settingsNavigation,
  ];
  const workoutItem = primaryNavigation.find((item) => item.id === "workout");
  const onWorkoutRoute = pathname.startsWith("/app/workout");

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[6rem_minmax(0,1fr)] lg:grid-cols-[15rem_minmax(0,1fr)]">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-fg px-4 py-2 text-bg focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        {shellCopy.skipToContent}
      </a>

      <aside className="sticky top-0 z-20 hidden h-dvh flex-col gap-4 border-r border-line bg-surface px-1 py-4 md:flex lg:px-4">
        <div className="px-1 lg:px-3">
          <Wordmark />
        </div>

        <div className="hidden lg:block">
          {activeWorkout ? (
            <ButtonLink
              href="/app/workout"
              variant="secondary"
              className="h-auto w-full flex-col items-start gap-0.5 px-3 py-2"
            >
              <span className="text-xs font-normal text-fg-muted">{shellCopy.activeWorkout}</span>
              <span className="font-medium">{activeWorkout.name}</span>
              <ElapsedTime startedAt={activeWorkout.startedAt} />
            </ButtonLink>
          ) : (
            <ButtonLink href="/app/workout" variant="tonal" className="w-full">
              {shellCopy.startWorkout}
            </ButtonLink>
          )}
        </div>

        <nav aria-label={shellCopy.primaryNavigation} className="flex flex-1 flex-col gap-1">
          {primaryNavigation.map((item) => (
            <NavLink key={item.id} item={item} pathname={pathname} layout="sidebar" />
          ))}
        </nav>

        <NavLink item={settingsNavigation} pathname={pathname} layout="sidebar" />
      </aside>

      <div className="flex min-w-0 flex-col pb-20 md:pb-0">
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 outline-none">
          {children}
        </main>
      </div>

      <nav
        aria-label={shellCopy.mobileNavigation}
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {activeWorkout && workoutItem ? (
          <div className="flex items-center gap-2 px-2">
            {onWorkoutRoute ? (
              <div className="flex-1 px-2 py-3 text-sm">
                <p className="font-medium text-fg">{activeWorkout.name}</p>
                <p className="text-xs text-fg-muted">
                  {shellCopy.activeWorkout} · <ElapsedTime startedAt={activeWorkout.startedAt} />
                </p>
              </div>
            ) : (
              <ButtonLink href={workoutItem.href} variant="primary" className="my-2 flex-1">
                {shellCopy.resumeWorkout} · <ElapsedTime startedAt={activeWorkout.startedAt} />
              </ButtonLink>
            )}
            <Button
              variant="ghost"
              onPress={() => {
                setMoreOpen(true);
              }}
            >
              <MoreHorizontal aria-hidden className="size-5" />
              {shellCopy.more}
            </Button>
          </div>
        ) : (
          <div className="flex items-stretch px-1">
            {mobileItems.map((item) => (
              <NavLink key={item.id} item={item} pathname={pathname} layout="bar" />
            ))}
            <button
              type="button"
              onClick={() => {
                setMoreOpen(true);
              }}
              className="relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-md text-xs text-fg-muted transition-colors hover:bg-surface-hover"
            >
              <MoreHorizontal aria-hidden className="size-5" />
              <span>{shellCopy.more}</span>
            </button>
          </div>
        )}
      </nav>

      {moreOpen ? (
        <MoreSheet
          items={moreItems}
          pathname={pathname}
          onClose={() => {
            setMoreOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
