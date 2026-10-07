import { expect, test } from "./fixtures";

test.describe("navegação no desktop e no tablet", () => {
  test.skip(({ isMobile }) => isMobile, "A barra lateral só existe a partir de 768 px.");

  test("a barra lateral lista os destinos na ordem do produto", async ({ page }) => {
    await page.goto("/app");
    const nav = page.getByRole("navigation", { name: "Navegação principal" });

    const labels = await nav.getByRole("link").allTextContents();
    expect(labels.map((label) => label.trim())).toEqual([
      "Visão geral",
      "Treino",
      "Rotinas",
      "Exercícios",
      "Histórico",
      "Recordes",
      "Analytics",
    ]);
    await expect(nav.getByRole("link", { name: "Visão geral" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("navega entre as áreas e marca a área atual", async ({ page }) => {
    await page.goto("/app");
    const nav = page.getByRole("navigation", { name: "Navegação principal" });

    await nav.getByRole("link", { name: "Rotinas" }).click();

    await expect(page).toHaveURL(/\/app\/routines$/);
    await expect(page.getByRole("heading", { level: 1, name: "Rotinas" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Rotinas" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(nav.getByRole("link", { name: "Visão geral" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  test("o link de pular para o conteúdo é o primeiro foco e leva ao conteúdo", async ({ page }) => {
    await page.goto("/app");
    await page.keyboard.press("Tab");

    const skip = page.getByRole("link", { name: "Ir para o conteúdo" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
  });
});

test.describe("navegação no celular", () => {
  test.skip(({ isMobile }) => !isMobile, "A barra inferior só existe abaixo de 768 px.");

  test("a barra inferior mostra quatro destinos e o menu Mais", async ({ page }) => {
    await page.goto("/app");
    const bar = page.getByRole("navigation", { name: "Navegação", exact: true });

    await expect(bar.getByRole("link")).toHaveCount(4);
    await expect(bar.getByRole("button", { name: "Mais" })).toBeVisible();
  });

  test("o menu Mais abre as demais áreas e fecha ao navegar", async ({ page }) => {
    await page.goto("/app");
    await page.getByRole("button", { name: "Mais" }).click();

    const sheet = page.getByRole("dialog", { name: "Mais opções" });
    await expect(sheet.getByRole("link")).toHaveText([
      "Exercícios",
      "Recordes",
      "Analytics",
      "Configurações",
    ]);

    await sheet.getByRole("link", { name: "Recordes" }).click();
    await expect(page).toHaveURL(/\/app\/records$/);
    await expect(sheet).toBeHidden();
  });

  test("com treino ativo a barra se reduz ao treino e ao menu Mais", async ({ page }) => {
    await page.goto("/dev/shell?activeWorkout=1");
    const bar = page.getByRole("navigation", { name: "Navegação", exact: true });

    await expect(bar.getByRole("link", { name: /Voltar ao treino/ })).toBeVisible();
    await expect(bar.getByRole("button", { name: "Mais" })).toBeVisible();
    await expect(bar.getByRole("link", { name: "Rotinas" })).toHaveCount(0);
    await expect(bar.getByRole("link", { name: "Histórico" })).toHaveCount(0);
  });
});

test.describe("estados da área do app", () => {
  test("uma conta nova vê o estado vazio com o próximo passo", async ({ page }) => {
    await page.goto("/app");

    await expect(page.getByRole("heading", { level: 1, name: "Visão geral" })).toBeVisible();
    await expect(page.getByText("Você ainda não registrou treinos.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Montar rotina" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Iniciar treino livre" })).toBeVisible();
  });

  test("um endereço inexistente mostra a página não encontrada dentro do shell", async ({
    page,
    tolerance,
  }) => {
    tolerance.statuses.add(404);
    await page.goto("/app/nao-existe");

    await expect(
      page.getByRole("heading", { level: 1, name: "Página não encontrada" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Voltar à visão geral" })).toBeVisible();
    await expect(page.locator("#main")).toBeVisible();
  });

  test("uma área ainda não liberada diz isso com clareza", async ({ page }) => {
    await page.goto("/app/analytics");

    await expect(page.getByRole("heading", { level: 1, name: "Analytics" })).toBeVisible();
    await expect(page.getByText("Disponível em uma próxima versão")).toBeVisible();
  });
});

test.describe("tema", () => {
  test("a escolha do tema vale na hora e sobrevive ao recarregamento sem piscar", async ({
    page,
  }) => {
    await page.goto("/app/settings");
    const html = page.locator("html");

    await page.getByRole("radio", { name: "Escuro" }).click();
    await expect(html).toHaveAttribute("data-theme", "dark");

    // The stored choice is applied by a script before first paint, so the attribute is already
    // present when the document starts rendering.
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        (window as unknown as { themeAtLoad: string | undefined }).themeAtLoad =
          document.documentElement.dataset["theme"];
      });
    });
    await page.reload();

    await expect(html).toHaveAttribute("data-theme", "dark");
    expect(
      await page.evaluate(() => (window as unknown as { themeAtLoad?: string }).themeAtLoad),
    ).toBe("dark");
    await expect(page.getByRole("radio", { name: "Escuro" })).toBeChecked();
  });

  test("voltar para Sistema remove a escolha explícita", async ({ page }) => {
    await page.goto("/app/settings");
    await page.getByRole("radio", { name: "Claro" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.getByRole("radio", { name: "Sistema" }).click();
    await expect(page.locator("html")).not.toHaveAttribute("data-theme");
  });

  test("segue a preferência do sistema quando não há escolha", async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: "dark" });
    const page = await context.newPage();
    await page.goto("/app");

    const background = await page.evaluate(
      () => getComputedStyle(document.documentElement).backgroundColor,
    );
    await context.close();

    // A dark page background has low luminance; a light one would be near white.
    const [red = 255] = background.match(/\d+/g)?.map(Number) ?? [];
    expect(red).toBeLessThan(60);
  });
});
