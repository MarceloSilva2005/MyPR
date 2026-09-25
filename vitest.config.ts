import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["MyPR-main/**", "node_modules/**", "dist/**"],
  },
});
