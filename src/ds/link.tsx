"use client";

import { Link as AriaLink, type LinkProps as AriaLinkProps } from "react-aria-components";

import { cx } from "./cx";
import { linkClassName } from "./link-styles";

export type LinkProps = Omit<AriaLinkProps, "className"> & { className?: string };

export function Link({ className, ...props }: LinkProps) {
  return <AriaLink {...props} className={cx(linkClassName, className)} />;
}
