import { defineConfig, devices } from "@playwright/test";

import { SIGNED_IN_STATE } from "./e2e/support/auth";

const PORT = 3100;

export default defineConfig({
  testDir: "e2e",
  outputDir: "reports/test-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  retries: process.env["CI"] ? 1 : 0,
  ...(process.env["CI"] ? { workers: 2 } : {}),
  reporter: process.env["CI"]
    ? [["list"], ["html", { outputFolder: "reports/playwright", open: "never" }]]
    : "list",
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    locale: "pt-BR",
    timezoneId: "UTC",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  expect: {
    toHaveScreenshot: { animations: "disabled", maxDiffPixelRatio: 0.01 },
  },
  // Every device project starts signed in with the shared test account; specs
  // that need a visitor reset the storage state themselves.
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts$/ },
    {
      name: "desktop",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        storageState: SIGNED_IN_STATE,
      },
    },
    {
      name: "tablet",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 820, height: 1180 },
        storageState: SIGNED_IN_STATE,
      },
    },
    {
      name: "mobile",
      dependencies: ["setup"],
      use: { ...devices["Pixel 7"], storageState: SIGNED_IN_STATE },
    },
  ],
  webServer: {
    command: `node node_modules/next/dist/bin/next start -p ${String(PORT)}`,
    url: `http://localhost:${String(PORT)}/api/health`,
    reuseExistingServer: !process.env["CI"],
    env: { ENABLE_DESIGN_GALLERY: "true" },
  },
});
