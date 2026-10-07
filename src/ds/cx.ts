type ClassPart = string | false | null | undefined;

/** Joins class names, skipping falsy entries. */
export function cx(...parts: ClassPart[]): string {
  return parts.filter(Boolean).join(" ");
}
