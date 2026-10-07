"use client";

import { ToggleButton, ToggleButtonGroup } from "react-aria-components";

import { cx } from "./cx";

export interface SegmentedOption<T extends string> {
  id: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  /** Names the group for assistive technology; it is not rendered. */
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Single choice among a few options, for example the theme or a period. Keep it to five or fewer. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <ToggleButtonGroup
      aria-label={label}
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[value]}
      onSelectionChange={(keys) => {
        const [first] = keys;
        const next = options.find((option) => option.id === first);
        if (next) onChange(next.id);
      }}
      className={cx("inline-flex gap-1 rounded-lg border border-line bg-surface p-1", className)}
    >
      {options.map((option) => (
        <ToggleButton
          key={option.id}
          id={option.id}
          className={cx(
            "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-fg-muted transition-colors md:h-7",
            "data-[hovered]:text-fg data-[selected]:bg-fg data-[selected]:text-bg",
          )}
        >
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
