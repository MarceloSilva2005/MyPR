import { z } from "zod";

const schema = z.object({
  APP_ENV: z.enum(["development", "preview", "production"]).default("development"),
  ALLOW_INDEXING: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type Env = z.infer<typeof schema>;

/**
 * Validates a raw environment map. On failure the error names the offending
 * variables but never echoes their values, so it is safe to log.
 */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = schema.safeParse(source);
  if (result.success) return result.data;

  const names = [...new Set(result.error.issues.map((issue) => issue.path.join(".")))];
  throw new Error(`Invalid environment configuration: ${names.join(", ")}`);
}

let cached: Env | undefined;

export function getEnv(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
