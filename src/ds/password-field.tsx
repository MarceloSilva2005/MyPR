"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { ToggleButton } from "react-aria-components";

import { TextField, type TextFieldProps } from "./text-field";

export interface PasswordFieldProps extends Omit<
  TextFieldProps,
  "type" | "multiline" | "prefix" | "suffix"
> {
  /** "current-password" to sign in, "new-password" to create one. */
  autoComplete: "current-password" | "new-password";
  showLabel: string;
  hideLabel: string;
}

/**
 * Password input with an accessible show and hide toggle. The toggle keeps its
 * name and reports its state, so screen readers announce what it does.
 */
export function PasswordField({ showLabel, hideLabel, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      spellCheck="false"
      suffix={
        <ToggleButton
          isSelected={visible}
          onChange={setVisible}
          aria-label={visible ? hideLabel : showLabel}
          className={
            "mr-1 flex size-9 items-center justify-center rounded-md text-fg-muted outline-none " +
            "data-[hovered]:bg-surface-hover data-[hovered]:text-fg " +
            "data-[focus-visible]:outline-2 data-[focus-visible]:outline-accent-text md:size-7"
          }
        >
          <Icon aria-hidden className="size-4" />
        </ToggleButton>
      }
    />
  );
}
