"use client";

import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import {
  Button as AriaButton,
  Link as AriaLink,
  type ButtonProps as AriaButtonProps,
  type LinkProps as AriaLinkProps,
} from "react-aria-components";

import { buttonClassName, type ButtonSize, type ButtonVariant } from "./button-styles";

interface StyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}

type IconOnlyProps = { iconOnly?: false } | { iconOnly: true; "aria-label": string };

export type ButtonProps = StyleProps &
  IconOnlyProps &
  Omit<AriaButtonProps, "className" | "children">;

export function Button({
  variant,
  size,
  className,
  children,
  iconOnly = false,
  ...props
}: ButtonProps) {
  return (
    <AriaButton {...props} className={buttonClassName({ variant, size, iconOnly, className })}>
      {({ isPending }) => (
        <>
          {isPending ? <LoaderCircle aria-hidden className="size-4 animate-spin" /> : null}
          {children}
        </>
      )}
    </AriaButton>
  );
}

export type ButtonLinkProps = StyleProps & Omit<AriaLinkProps, "className" | "children">;

/** A link that looks like a button. Use it for navigation, and Button for actions. */
export function ButtonLink({ variant, size, className, children, ...props }: ButtonLinkProps) {
  return (
    <AriaLink {...props} className={buttonClassName({ variant, size, className })}>
      {children}
    </AriaLink>
  );
}
