import { cx } from "./cx";

export type ButtonVariant =
  "primary" | "secondary" | "tonal" | "ghost" | "destructive" | "destructive-solid";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap " +
  "no-underline transition-colors select-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-fg data-[hovered]:bg-accent-hover data-[pressed]:bg-accent-hover",
  secondary:
    "border border-line bg-overlay text-fg data-[hovered]:bg-surface-hover data-[pressed]:bg-surface-hover",
  // Emphasis without competing with the single primary action of the screen.
  tonal:
    "bg-accent-subtle text-accent-text data-[hovered]:bg-surface-hover data-[pressed]:bg-surface-hover",
  ghost: "text-fg data-[hovered]:bg-surface-hover data-[pressed]:bg-surface-hover",
  destructive:
    "border border-line bg-overlay text-danger data-[hovered]:bg-danger-subtle data-[pressed]:bg-danger-subtle",
  "destructive-solid":
    "bg-danger-solid text-danger-solid-fg data-[hovered]:bg-danger-solid-hover data-[pressed]:bg-danger-solid-hover",
};

// Touch-first heights on small screens (44 px), denser on larger ones.
const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm md:h-8",
  md: "h-11 px-4 text-sm md:h-9 md:px-3",
  lg: "h-12 px-6 text-base md:h-11 md:px-4",
};

const iconSizes: Record<ButtonSize, string> = {
  sm: "size-9 md:size-8",
  md: "size-11 md:size-9",
  lg: "size-12 md:size-11",
};

export function buttonClassName(options: {
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  iconOnly?: boolean | undefined;
  className?: string | undefined;
}): string {
  const { variant = "secondary", size = "md", iconOnly = false, className } = options;
  return cx(base, variants[variant], iconOnly ? iconSizes[size] : sizes[size], className);
}
