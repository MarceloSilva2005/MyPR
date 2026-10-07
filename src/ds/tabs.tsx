"use client";

import type { ReactNode } from "react";
import {
  Tab,
  TabList,
  TabPanel,
  Tabs as AriaTabs,
  type TabsProps as AriaTabsProps,
} from "react-aria-components";

import { cx } from "./cx";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps extends Omit<AriaTabsProps, "children" | "className"> {
  /** Names the tab list for assistive technology; it is not rendered. */
  label: string;
  items: readonly TabItem[];
  className?: string;
}

/** Switches between panels of the same page. Use links, not tabs, to move between pages. */
export function Tabs({ label, items, className, ...props }: TabsProps) {
  return (
    <AriaTabs {...props} className={cx("flex flex-col", className)}>
      <TabList
        aria-label={label}
        className="-mb-px flex gap-4 overflow-x-auto border-b border-line"
      >
        {items.map((item) => (
          <Tab
            key={item.id}
            id={item.id}
            className={cx(
              "-mb-px cursor-default border-b-2 border-transparent py-3 text-sm font-medium whitespace-nowrap text-fg-muted transition-colors",
              "data-[hovered]:text-fg data-[selected]:border-accent data-[selected]:text-fg",
            )}
          >
            {item.label}
          </Tab>
        ))}
      </TabList>
      {items.map((item) => (
        <TabPanel
          key={item.id}
          id={item.id}
          className="pt-4 outline-none data-[focus-visible]:outline-2 data-[focus-visible]:outline-offset-2 data-[focus-visible]:outline-accent-text"
        >
          {item.content}
        </TabPanel>
      ))}
    </AriaTabs>
  );
}
