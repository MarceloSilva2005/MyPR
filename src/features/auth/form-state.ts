import type { z } from "zod";

export interface AuthFormState<Field extends string> {
  readonly status: "idle" | "error" | "done";
  /** Message about the whole form, shown above the submit button. */
  readonly message?: string;
  readonly fieldErrors?: Partial<Record<Field, string>>;
  /** Values echoed back so a failed submit never clears the form. Never passwords. */
  readonly values?: Partial<Record<Field, string>>;
}

export const idle = { status: "idle" } as const;

export function readFields<Field extends string>(
  form: FormData,
  fields: readonly Field[],
): Record<Field, string> {
  const values = {} as Record<Field, string>;
  for (const field of fields) {
    const value = form.get(field);
    values[field] = typeof value === "string" ? value : "";
  }
  return values;
}

/** One message per invalid field, taken from the copy of that form. */
export function fieldErrors<Field extends string>(
  error: z.ZodError,
  messages: Record<Field, string>,
): Partial<Record<Field, string>> {
  const result: Partial<Record<Field, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && field in messages) {
      result[field as Field] = messages[field as Field];
    }
  }
  return result;
}
