import { expect, test } from "./fixtures";

// Baselines are rendered on Linux (CI), where fonts are reproducible. On other systems the
// screenshots would differ by anti-aliasing alone, so these checks do not run there.
test.skip(process.platform !== "linux", "Visual baselines are generated on Linux.");

const SCHEMES = ["light", "dark"] as const;

const GALLERY_SECTIONS = [
  "tokens",
  "buttons",
  "forms",
  "feedback",
  "overlays",
  "training",
  "metrics",
  "charts",
];

// The compact viewports cover the sections that change most with width.
const COMPACT_SECTIONS = ["forms", "training", "charts"];

for (const scheme of SCHEMES) {
  test.describe(`regressão visual, tema ${scheme}`, () => {
    test.use({ colorScheme: scheme });

    test("seções da galeria", async ({ page }, testInfo) => {
      const compact = testInfo.project.name !== "desktop";
      test.skip(testInfo.project.name === "tablet", "O tablet é coberto pelo shell.");

      await page.goto("/dev/system");
      await page.evaluate(() => document.fonts.ready);

      for (const id of compact ? COMPACT_SECTIONS : GALLERY_SECTIONS) {
        await expect(page.locator(`#${id}`)).toHaveScreenshot(`gallery-${id}-${scheme}.png`);
      }
    });

    test("shell com a área em desenvolvimento", async ({ page }) => {
      await page.goto("/app");
      await page.evaluate(() => document.fonts.ready);
      await expect(page).toHaveScreenshot(`shell-overview-${scheme}.png`);
    });

    test("configurações com o seletor de tema", async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop", "Coberto no desktop.");
      await page.goto("/app/settings");
      await page.evaluate(() => document.fonts.ready);
      await expect(page).toHaveScreenshot(`settings-${scheme}.png`);
    });
  });
}

test("shell no celular com treino ativo", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "A barra reduzida só existe no celular.");
  await page.goto("/dev/shell?activeWorkout=1");
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot("shell-active-workout-mobile.png", {
    mask: [page.locator("[data-elapsed]")],
  });
});
