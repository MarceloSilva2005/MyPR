import { z } from "zod";

const schema = z.object({
  APP_ENV: z.enum(["development", "preview", "production"]).default("development"),
  ALLOW_INDEXING: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  // Serves the internal design system gallery. Never enabled in production.
  ENABLE_DESIGN_GALLERY: z
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

// Read only by server code that talks to Supabase, so public pages and the
// design gallery keep working without a database.
const supabaseSchema = z.object({
  SUPABASE_URL: z.url({ protocol: /^https?$/ }),
  // Publishable (anon) key. Row level security protects every private table.
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  // Keys the rate limit counters (src/server/rate-limit.ts). At least 32 characters.
  RATE_LIMIT_SECRET: z.string().min(32),
});

export type SupabaseEnv = z.infer<typeof supabaseSchema>;

export function parseSupabaseEnv(source: Record<string, string | undefined>): SupabaseEnv {
  const result = supabaseSchema.safeParse(source);
  if (result.success) return result.data;

  const names = [...new Set(result.error.issues.map((issue) => issue.path.join(".")))];
  throw new Error(`Invalid Supabase configuration: ${names.join(", ")}`);
}

let cachedSupabase: SupabaseEnv | undefined;

export function getSupabaseEnv(): SupabaseEnv {
  cachedSupabase ??= parseSupabaseEnv(process.env);
  return cachedSupabase;
}
