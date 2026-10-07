"use client";

import {
  BarChart3,
  BookOpen,
  Dumbbell,
  History,
  LayoutDashboard,
  ListChecks,
  Settings,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { Link as AriaLink } from "react-aria-components";

import type { NavigationId, NavigationItem } from "@/content/navigation";
import { cx } from "@/ds/cx";

const icons: Record<NavigationId, LucideIcon> = {
  overview: LayoutDashboard,
  workout: Dumbbell,
  routines: ListChecks,
  exercises: BookOpen,
  history: History,
  records: Trophy,
  analytics: BarChart3,
  settings: Settings,
};

function isActive(pathname: string, item: NavigationItem): boolean {
  if (item.href === "/app") return pathname === "/app";
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export interface NavLinkProps {
  item: NavigationItem;
  pathname: string;
  layout: "sidebar" | "bar" | "sheet";
  onNavigate?: () => void;
}

export function NavLink({ item, pathname, layout, onNavigate }: NavLinkProps) {
  const active = isActive(pathname, item);
  const Icon = icons[item.id];

  return (
    <AriaLink
      href={item.href}
      {...(active ? { "aria-current": "page" as const } : {})}
      {...(onNavigate ? { onPress: onNavigate } : {})}
      className={cx(
        "relative flex items-center rounded-md no-underline transition-colors",
        "data-[hovered]:bg-surface-hover",
        layout === "sidebar" &&
          "flex-col gap-1 px-1 py-2 text-center text-xs lg:flex-row lg:gap-3 lg:px-3 lg:text-left lg:text-sm",
        layout === "bar" && "min-h-14 flex-1 flex-col justify-center gap-1 text-xs",
        layout === "sheet" && "gap-3 px-3 py-3 text-base",
        active ? "font-medium text-fg" : "text-fg-muted",
        active && layout === "sidebar" && "bg-surface-hover",
      )}
    >
      <Icon aria-hidden className={cx("size-5 shrink-0", active && "text-accent-text")} />
      <span>{item.label}</span>
      {active && layout === "bar" ? (
        <span aria-hidden className="absolute inset-x-4 top-0 h-0.5 rounded-sm bg-accent" />
      ) : null}
    </AriaLink>
  );
}
