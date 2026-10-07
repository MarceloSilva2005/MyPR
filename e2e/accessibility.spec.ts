import { expect, expectAccessible, test } from "./fixtures";

const SCHEMES = ["light", "dark"] as const;

const PAGES = [
  { name: "página inicial", path: "/" },
  { name: "visão geral", path: "/app" },
  { name: "área em desenvolvimento", path: "/app/workout" },
  { name: "configurações", path: "/app/settings" },
  { name: "galeria do design system", path: "/dev/system" },
  { name: "shell com treino ativo", path: "/dev/shell?activeWorkout=1" },
];

for (const scheme of SCHEMES) {
  test.describe(`acessibilidade, tema ${scheme}`, () => {
    test.use({ colorScheme: scheme });

    for (const { name, path } of PAGES) {
      test(`${name} não tem violações WCAG 2.2 AA`, async ({ page }) => {
        await page.goto(path);
        await expectAccessible(page);
      });
    }

    test("a tela de página não encontrada dentro do app é acessível", async ({
      page,
      tolerance,
    }) => {
      tolerance.statuses.add(404);
      await page.goto("/app/nao-existe");
      await expect(
        page.getByRole("heading", { level: 1, name: "Página não encontrada" }),
      ).toBeVisible();
      await expectAccessible(page);
    });
  });
}

test.describe("estados interativos", () => {
  test("o diálogo aberto continua acessível e prende o foco", async ({ page }) => {
    await page.goto("/dev/system");
    await page.getByRole("button", { name: "Diálogo", exact: true }).click();

    const dialog = page.getByRole("dialog", { name: "Adicionar exercício" });
    await expect(dialog).toBeVisible();
    await expectAccessible(page);

    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(dialog.locator(":focus")).toHaveCount(1);
  });

  test("a lista de opções aberta é acessível", async ({ page }) => {
    await page.goto("/dev/system");
    await page.locator("#exercise-picker").getByRole("combobox", { name: "Exercício" }).click();
    await expect(page.getByRole("listbox")).toBeVisible();

    // While a non-modal popover is open, React Aria marks the rest of the page aria-hidden but
    // keeps it focusable until focus leaves the field. axe reports that transient state as
    // aria-hidden-focus, so this check is scoped to the field and its list.
    await expectAccessible(page, ["#exercise-picker", '[role="listbox"]']);
  });
});
