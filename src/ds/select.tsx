"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  Button as AriaButton,
  FieldError,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select as AriaSelect,
  SelectValue,
  Text,
} from "react-aria-components";

import { cx } from "./cx";
import { fieldStyles } from "./field-styles";

export interface SelectOption {
  id: string;
  label: string;
}

export interface SelectProps {
  label: string;
  options: readonly SelectOption[];
  value: string | null;
  onChange: (id: string) => void;
  placeholder?: string;
  description?: string;
  error?: string;
  isDisabled?: boolean;
  isRequired?: boolean;
  name?: string;
  className?: string;
}

export function Select({
  label,
  options,
  value,
  onChange,
  placeholder,
  description,
  error,
  isDisabled,
  isRequired,
  name,
  className,
}: SelectProps) {
  return (
    <AriaSelect
      validationBehavior="aria"
      value={value}
      onChange={(key) => {
        if (key !== null) onChange(String(key));
      }}
      {...(placeholder ? { placeholder } : {})}
      {...(isDisabled ? { isDisabled } : {})}
      {...(isRequired ? { isRequired } : {})}
      {...(name ? { name } : {})}
      {...(error ? { isInvalid: true } : {})}
      className={cx(fieldStyles.root, className)}
    >
      <Label className={fieldStyles.label}>{label}</Label>
      <AriaButton
        className={cx(
          fieldStyles.control,
          "justify-between gap-2 px-3 text-left outline-none",
          "data-[focus-visible]:outline-2 data-[focus-visible]:outline-offset-2 data-[focus-visible]:outline-accent-text",
          "data-[hovered]:bg-surface-hover",
        )}
      >
        <SelectValue className="truncate data-[placeholder]:text-fg-subtle" />
        <ChevronDown aria-hidden className="size-4 shrink-0 text-fg-muted" />
      </AriaButton>
      {description ? (
        <Text slot="description" className={fieldStyles.description}>
          {description}
        </Text>
      ) : null}
      <FieldError className={fieldStyles.error}>{error}</FieldError>
      <Popover className={fieldStyles.popover}>
        <ListBox className="max-h-72 outline-none">
          {options.map((option) => (
            <ListBoxItem
              key={option.id}
              id={option.id}
              textValue={option.label}
              className={fieldStyles.option}
            >
              {({ isSelected }) => (
                <>
                  <span className="truncate">{option.label}</span>
                  {isSelected ? (
                    <Check aria-hidden className="size-4 shrink-0 text-accent-text" />
                  ) : null}
                </>
              )}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}
