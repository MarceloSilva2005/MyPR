import { defineConfig, devices } from "@playwright/test";

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
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "tablet",
      use: { ...devices["Desktop Chrome"], viewport: { width: 820, height: 1180 } },
    },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `node node_modules/next/dist/bin/next start -p ${String(PORT)}`,
    url: `http://localhost:${String(PORT)}/api/health`,
    reuseExistingServer: !process.env["CI"],
    env: { ENABLE_DESIGN_GALLERY: "true" },
  },
});
