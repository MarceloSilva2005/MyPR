import AxeBuilder from "@axe-core/playwright";
import { expect, test as base, type Page } from "@playwright/test";

interface Tolerance {
  /** HTTP statuses a test expects to receive, for example 404 on purpose. */
  statuses: Set<number>;
}

/**
 * Every test fails on console errors, uncaught exceptions, failed requests and unexpected
 * HTTP error statuses, so a broken page cannot pass by only looking right.
 */
export const test = base.extend<{ tolerance: Tolerance }>({
  tolerance: [
    async ({ page }, use) => {
      const problems: string[] = [];
      const tolerance: Tolerance = { statuses: new Set() };

      page.on("console", (message) => {
        if (message.type() === "error") problems.push(`console: ${message.text()}`);
      });
      page.on("pageerror", (error) => {
        problems.push(`pageerror: ${error.message}`);
      });
      page.on("requestfailed", (request) => {
        problems.push(`request failed: ${request.url()}`);
      });
      page.on("response", (response) => {
        const status = response.status();
        if (status >= 400 && !tolerance.statuses.has(status)) {
          problems.push(`http ${String(status)}: ${response.url()}`);
        }
      });

      await use(tolerance);
      expect(problems, "unexpected console errors or failed requests").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** Fails with a readable summary when axe finds any WCAG 2.2 AA violation. */
export async function expectAccessible(page: Page, selectors: string[] = []): Promise<void> {
  let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);
  for (const selector of selectors) builder = builder.include(selector);
  const { violations } = await builder.analyze();

  const summary = violations.map(
    (violation) =>
      `${violation.id} (${violation.impact ?? "n/a"}): ${violation.help}\n` +
      violation.nodes
        .slice(0, 3)
        .map((node) => `    ${node.target.join(" ")}`)
        .join("\n"),
  );
  expect(summary, "accessibility violations").toEqual([]);
}
