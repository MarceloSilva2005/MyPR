/** Shared class names for form controls, so every field looks and behaves the same. */
export const fieldStyles = {
  root: "flex min-w-0 flex-col gap-1",
  label: "text-sm font-medium text-fg",
  hint: "font-normal text-fg-subtle",
  description: "text-xs text-fg-muted",
  error: "text-xs text-danger",
  // The 3:1 border is the only affordance of a text control, so it uses line-control.
  control:
    "flex h-11 w-full min-w-0 items-center rounded-md border border-line-control bg-bg text-base text-fg " +
    "transition-colors md:h-9 md:text-sm " +
    "data-[focus-within]:outline-2 data-[focus-within]:outline-offset-2 data-[focus-within]:outline-accent-text " +
    "data-[invalid]:border-danger data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
  input:
    "h-full min-w-0 flex-1 rounded-md bg-transparent px-3 text-inherit outline-none " +
    "placeholder:text-fg-subtle disabled:cursor-not-allowed",
  adornment: "shrink-0 text-sm text-fg-muted",
  popover:
    "min-w-(--trigger-width) overflow-auto rounded-lg border border-line bg-overlay p-1 shadow-float " +
    "data-[entering]:animate-fade-in",
  option:
    "flex cursor-default items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-fg outline-none " +
    "data-[focused]:bg-surface-hover data-[selected]:font-medium data-[disabled]:opacity-50",
} as const;
