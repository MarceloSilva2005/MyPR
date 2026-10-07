import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

interface LabMetrics {
  cls: number;
  lcp: number;
}

/** Lab proxy for Core Web Vitals: layout shifts and largest paint, observed from navigation start. */
async function collectMetrics(page: Page, path: string): Promise<LabMetrics> {
  await page.addInitScript(() => {
    const store = { cls: 0, lcp: 0 };
    (window as unknown as { __vitals: typeof store }).__vitals = store;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as {
        value: number;
        hadRecentInput: boolean;
      }[]) {
        if (!entry.hadRecentInput) store.cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => {
      const last = list.getEntries().at(-1);
      if (last) store.lcp = last.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });

  await page.goto(path, { waitUntil: "networkidle" });
  // Let late shifts and the final paint be reported.
  await page.waitForTimeout(500);
  return page.evaluate(() => (window as unknown as { __vitals: LabMetrics }).__vitals);
}

const ROUTES = ["/", "/app", "/app/settings", "/dev/system"];

for (const path of ROUTES) {
  test(`orçamento de laboratório em ${path}`, async ({ page }) => {
    const { cls, lcp } = await collectMetrics(page, path);

    expect(cls, "CLS").toBeLessThanOrEqual(0.1);
    expect(lcp, "LCP (ms)").toBeLessThanOrEqual(2500);
  });
}

test("o shell não desloca o layout ao carregar uma área em desenvolvimento", async ({ page }) => {
  const { cls } = await collectMetrics(page, "/app/history");
  expect(cls).toBeLessThanOrEqual(0.02);
});
