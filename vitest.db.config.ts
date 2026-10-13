import { defineConfig } from "vitest/config";

// Database tests run against the local Supabase stack (`pnpm db:start`).
// Each test works inside a transaction that is rolled back, so files run
// one at a time to keep connections and locks predictable.
export default defineConfig({
  test: {
    environment: "node",
    include: ["supabase/tests/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 15_000,
  },
});
