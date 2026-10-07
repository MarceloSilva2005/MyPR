"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  Button as AriaButton,
  ComboBox as AriaComboBox,
  FieldError,
  Group,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Text,
} from "react-aria-components";

import { cx } from "./cx";
import { fieldStyles } from "./field-styles";
import { dsLabels } from "./labels";
import { matchesSearch } from "@/lib/text";

export interface ComboBoxOption {
  id: string;
  label: string;
  /** Secondary line, for example the muscle group. */
  detail?: string;
  /** Extra search terms that are not displayed. */
  keywords?: readonly string[];
}

export interface ComboBoxProps {
  label: string;
  options: readonly ComboBoxOption[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  placeholder?: string;
  description?: string;
  error?: string;
  emptyMessage?: string;
  isDisabled?: boolean;
  className?: string;
}

export function ComboBox({
  label,
  options,
  selectedId,
  onSelect,
  placeholder,
  description,
  error,
  emptyMessage = dsLabels.noResults,
  isDisabled,
  className,
}: ComboBoxProps) {
  const searchable = new Map(
    options.map((option) => [option.id, [option.label, ...(option.keywords ?? [])].join(" ")]),
  );

  return (
    <AriaComboBox
      validationBehavior="aria"
      value={selectedId}
      onChange={(key) => {
        onSelect(key === null ? null : String(key));
      }}
      defaultFilter={(textValue, input) => matchesSearch(textValue, input)}
      menuTrigger="focus"
      allowsEmptyCollection
      {...(isDisabled ? { isDisabled } : {})}
      {...(error ? { isInvalid: true } : {})}
      className={cx(fieldStyles.root, className)}
    >
      <Label className={fieldStyles.label}>{label}</Label>
      <Group className={fieldStyles.control}>
        <Input {...(placeholder ? { placeholder } : {})} className={fieldStyles.input} />
        <AriaButton
          className={cx(
            "flex size-11 shrink-0 items-center justify-center rounded-r-md text-fg-muted outline-none md:size-9",
            "data-[hovered]:bg-surface-hover data-[focus-visible]:outline-2 data-[focus-visible]:-outline-offset-2 data-[focus-visible]:outline-accent-text",
          )}
        >
          <ChevronDown aria-hidden className="size-4" />
        </AriaButton>
      </Group>
      {description ? (
        <Text slot="description" className={fieldStyles.description}>
          {description}
        </Text>
      ) : null}
      <FieldError className={fieldStyles.error}>{error}</FieldError>
      <Popover className={fieldStyles.popover}>
        <ListBox
          className="max-h-72 outline-none"
          renderEmptyState={() => <p className="px-3 py-2 text-sm text-fg-muted">{emptyMessage}</p>}
        >
          {options.map((option) => (
            <ListBoxItem
              key={option.id}
              id={option.id}
              textValue={searchable.get(option.id) ?? option.label}
              className={fieldStyles.option}
            >
              {({ isSelected }) => (
                <>
                  <span className="min-w-0">
                    <span className="block truncate">{option.label}</span>
                    {option.detail ? (
                      <span className="block truncate text-xs font-normal text-fg-muted">
                        {option.detail}
                      </span>
                    ) : null}
                  </span>
                  {isSelected ? (
                    <Check aria-hidden className="size-4 shrink-0 text-accent-text" />
                  ) : null}
                </>
              )}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </AriaComboBox>
  );
}
