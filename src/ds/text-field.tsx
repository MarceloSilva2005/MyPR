"use client";

import type { ReactNode } from "react";
import {
  FieldError,
  Group,
  Input,
  Label,
  Text,
  TextArea,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
} from "react-aria-components";

import { cx } from "./cx";
import { fieldStyles } from "./field-styles";
import { dsLabels } from "./labels";

export interface TextFieldProps extends Omit<AriaTextFieldProps, "children" | "className"> {
  label: string;
  description?: string;
  /** Message shown under the field. Setting it marks the field as invalid. */
  error?: string;
  placeholder?: string;
  /** Text placed before the value, for example a currency or "@". */
  prefix?: ReactNode;
  /** Text placed after the value, for example a unit. */
  suffix?: ReactNode;
  /** Renders a multi-line field. */
  multiline?: boolean;
  /** Marks the field as optional in the label. Required fields get no marker. */
  showOptional?: boolean;
  className?: string;
}

export function TextField({
  label,
  description,
  error,
  placeholder,
  prefix,
  suffix,
  multiline = false,
  showOptional = false,
  className,
  ...props
}: TextFieldProps) {
  return (
    <AriaTextField
      validationBehavior="aria"
      {...props}
      {...(error ? { isInvalid: true } : {})}
      className={cx(fieldStyles.root, className)}
    >
      <Label className={fieldStyles.label}>
        {label}
        {showOptional && !props.isRequired ? (
          <span className={fieldStyles.hint}> ({dsLabels.optional})</span>
        ) : null}
      </Label>
      <Group className={cx(fieldStyles.control, multiline && "h-auto md:h-auto")}>
        {prefix ? <span className={cx(fieldStyles.adornment, "pl-3")}>{prefix}</span> : null}
        {multiline ? (
          <TextArea
            {...(placeholder ? { placeholder } : {})}
            className={cx(fieldStyles.input, "min-h-20 resize-y py-2")}
          />
        ) : (
          <Input {...(placeholder ? { placeholder } : {})} className={fieldStyles.input} />
        )}
        {suffix ? <span className={cx(fieldStyles.adornment, "pr-3")}>{suffix}</span> : null}
      </Group>
      {description ? (
        <Text slot="description" className={fieldStyles.description}>
          {description}
        </Text>
      ) : null}
      <FieldError className={fieldStyles.error}>{error}</FieldError>
    </AriaTextField>
  );
}
