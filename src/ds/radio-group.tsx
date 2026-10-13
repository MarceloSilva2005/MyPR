"use client";

import {
  Label,
  RadioButton,
  RadioField,
  RadioGroup as AriaRadioGroup,
  Text,
  type RadioGroupProps as AriaRadioGroupProps,
} from "react-aria-components";

import { cx } from "./cx";
import { fieldStyles } from "./field-styles";

export interface RadioOption<T extends string> {
  id: T;
  label: string;
  /** One line under the label that explains the consequence of the choice. */
  hint?: string;
}

interface RadioGroupProps<T extends string> extends Omit<
  AriaRadioGroupProps,
  "children" | "className" | "value" | "defaultValue"
> {
  label: string;
  options: readonly RadioOption<T>[];
  defaultValue?: T | null;
  className?: string;
}

/**
 * Single choice among options that need a short explanation each. Submits with
 * the form under `name`. For two to five short labels, use SegmentedControl.
 */
export function RadioGroup<T extends string>({
  label,
  options,
  defaultValue,
  className,
  ...props
}: RadioGroupProps<T>) {
  return (
    <AriaRadioGroup
      {...props}
      {...(defaultValue ? { defaultValue } : {})}
      className={cx("flex flex-col gap-2", className)}
    >
      <Label className={fieldStyles.label}>{label}</Label>
      <div className="flex flex-col divide-y divide-line rounded-lg border border-line">
        {options.map((option) => (
          <RadioField
            key={option.id}
            value={option.id}
            className={cx(
              "px-3 py-3 first:rounded-t-lg last:rounded-b-lg",
              "has-[[data-hovered]]:bg-surface-hover data-[selected]:bg-accent-subtle",
              "has-[[data-focus-visible]]:outline-2 has-[[data-focus-visible]]:-outline-offset-2 has-[[data-focus-visible]]:outline-accent-text",
            )}
          >
            <RadioButton className="group flex cursor-default items-start gap-3 outline-none">
              <span
                aria-hidden
                className={cx(
                  "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-line-control bg-bg",
                  "group-data-[selected]:border-accent group-data-[selected]:bg-accent",
                )}
              >
                <span className="size-1.5 rounded-full bg-accent-fg opacity-0 group-data-[selected]:opacity-100" />
              </span>
              <span className="text-sm font-medium text-fg">{option.label}</span>
            </RadioButton>
            {option.hint ? (
              <Text slot="description" className="block pl-7 text-sm text-fg-muted">
                {option.hint}
              </Text>
            ) : null}
          </RadioField>
        ))}
      </div>
    </AriaRadioGroup>
  );
}
