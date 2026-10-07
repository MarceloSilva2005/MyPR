"use client";

import { Minus, Plus } from "lucide-react";
import {
  Button as AriaButton,
  FieldError,
  Group,
  Input,
  Label,
  NumberField as AriaNumberField,
  Text,
  type NumberFieldProps as AriaNumberFieldProps,
} from "react-aria-components";

import { cx } from "./cx";
import { fieldStyles } from "./field-styles";
import { dsLabels } from "./labels";

export interface NumberFieldProps extends Omit<AriaNumberFieldProps, "children" | "className"> {
  label: string;
  description?: string;
  error?: string;
  /** Unit shown after the value, for example "kg" or "reps". */
  unit?: string;
  /** "workout" enlarges the control for use during a session. */
  size?: "md" | "workout";
  showSteppers?: boolean;
  showOptional?: boolean;
  /** Hides the label visually while keeping it for assistive technology. */
  hideLabel?: boolean;
  className?: string;
}

const stepper =
  "flex shrink-0 items-center justify-center text-fg-muted transition-colors " +
  "data-[hovered]:bg-surface-hover data-[pressed]:bg-surface-hover data-[disabled]:opacity-40 " +
  "outline-none data-[focus-visible]:outline-2 data-[focus-visible]:-outline-offset-2 data-[focus-visible]:outline-accent-text";

export function NumberField({
  label,
  description,
  error,
  unit,
  size = "md",
  showSteppers = true,
  showOptional = false,
  hideLabel = false,
  className,
  ...props
}: NumberFieldProps) {
  const workout = size === "workout";

  return (
    <AriaNumberField
      validationBehavior="aria"
      {...props}
      {...(error ? { isInvalid: true } : {})}
      className={cx(fieldStyles.root, className)}
    >
      <Label className={cx(fieldStyles.label, hideLabel && "sr-only")}>
        {label}
        {showOptional && !props.isRequired ? (
          <span className={fieldStyles.hint}> ({dsLabels.optional})</span>
        ) : null}
      </Label>
      <Group className={cx(fieldStyles.control, workout && "h-14 text-xl md:h-14 md:text-xl")}>
        {showSteppers ? (
          <AriaButton
            slot="decrement"
            className={cx(
              stepper,
              "rounded-l-md border-r border-line",
              workout ? "size-14" : "size-11 md:size-9",
            )}
          >
            <Minus aria-hidden className="size-4" />
          </AriaButton>
        ) : null}
        <Input
          className={cx(
            fieldStyles.input,
            "tabular-nums",
            (workout || showSteppers) && "text-center",
            workout && "font-medium",
          )}
        />
        {unit ? <span className={cx(fieldStyles.adornment, "pr-3")}>{unit}</span> : null}
        {showSteppers ? (
          <AriaButton
            slot="increment"
            className={cx(
              stepper,
              "rounded-r-md border-l border-line",
              workout ? "size-14" : "size-11 md:size-9",
            )}
          >
            <Plus aria-hidden className="size-4" />
          </AriaButton>
        ) : null}
      </Group>
      {description ? (
        <Text slot="description" className={fieldStyles.description}>
          {description}
        </Text>
      ) : null}
      <FieldError className={fieldStyles.error}>{error}</FieldError>
    </AriaNumberField>
  );
}
