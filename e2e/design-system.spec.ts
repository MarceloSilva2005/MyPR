import { expect, test } from "./fixtures";

test.describe("galeria do design system", () => {
  test("carrega todas as seções sem erros", async ({ page }) => {
    await page.goto("/dev/system");

    await expect(page.getByRole("heading", { level: 1, name: "Design System" })).toBeVisible();
    for (const section of [
      "Cores e tipografia",
      "Botões",
      "Campos",
      "Estados e feedback",
      "Diálogos e painéis",
      "Componentes de treino",
      "Métricas e listas",
      "Gráficos",
    ]) {
      await expect(page.getByRole("heading", { level: 2, name: section })).toBeVisible();
    }
  });

  test("cada tela tem um único título de nível 1", async ({ page }) => {
    for (const path of ["/", "/app", "/app/settings", "/dev/system"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    }
  });
});

test.describe("campos", () => {
  test("a busca de exercício ignora acentos e encontra por nome alternativo", async ({ page }) => {
    await page.goto("/dev/system");
    const combo = page.locator("#training").getByRole("combobox", { name: "Exercício" });

    // Typed like a person would: the field reacts to real key events.
    await combo.pressSequentially("elevacao");
    await expect(page.getByRole("option")).toHaveCount(1);
    await expect(page.getByRole("option", { name: /Elevação lateral/ })).toBeVisible();

    await combo.press("ControlOrMeta+a");
    await combo.pressSequentially("squat");
    await expect(page.getByRole("option", { name: /Agachamento livre/ })).toBeVisible();

    await combo.press("ControlOrMeta+a");
    await combo.pressSequentially("zzz");
    await expect(page.getByRole("option", { name: "Nenhum exercício encontrado." })).toBeVisible();
  });

  test("aceita carga decimal com vírgula e confirma a série", async ({ page }) => {
    await page.goto("/dev/system");
    const row = page.locator("#training");
    const load = row.getByRole("textbox", { name: "Carga, série 4" });

    await load.fill("82,5");
    await load.press("Tab");
    await expect(load).toHaveValue("82,5");

    const done = row.getByRole("button", { name: "Série 4 concluída" });
    await expect(done).toHaveAttribute("aria-pressed", "false");
    await done.click();
    await expect(done).toHaveAttribute("aria-pressed", "true");
  });

  test("o erro do campo é anunciado e ligado ao campo", async ({ page }) => {
    await page.goto("/dev/system");
    const email = page.getByRole("textbox", { name: "E-mail" });

    await expect(email).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("Informe um e-mail válido.")).toBeVisible();
    await expect(email).toHaveAccessibleDescription("Informe um e-mail válido.");
  });
});

test.describe("diálogos", () => {
  test("o foco volta ao botão de origem ao fechar com Escape", async ({ page }) => {
    await page.goto("/dev/system");
    const opener = page.getByRole("button", { name: "Diálogo", exact: true });

    await opener.click();
    await expect(page.getByRole("dialog", { name: "Adicionar exercício" })).toBeVisible();
    await page.keyboard.press("Escape");

    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test("a confirmação destrutiva não fecha ao clicar fora", async ({ page }) => {
    await page.goto("/dev/system");
    await page.getByRole("button", { name: "Confirmação destrutiva" }).click();
    const dialog = page.getByRole("dialog", { name: "Excluir sessão?" });
    await expect(dialog).toBeVisible();

    await page.mouse.click(5, 5);
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(dialog).toBeHidden();
  });

  test("a notificação confirma o resultado e some sozinha", async ({ page }) => {
    await page.goto("/dev/system");
    await page.getByRole("button", { name: "Mostrar notificação" }).click();

    const region = page.getByRole("region", { name: "Notificações" });
    await expect(region.getByText("Treino salvo.")).toBeVisible();
    await expect(region.getByText("Treino salvo.")).toBeHidden({ timeout: 8000 });
  });
});

test.describe("gráficos", () => {
  test("o teclado percorre os pontos e anuncia o valor exato", async ({ page }) => {
    await page.goto("/dev/system");
    const chart = page.getByRole("application", { name: "Evolução do 1RM estimado por exercício" });

    await chart.focus();
    await page.keyboard.press("End");

    await expect(chart.locator("[aria-live]")).toHaveText(/Supino reto: 5 de out, 104,5\s*kg/);
    await page.keyboard.press("ArrowDown");
    await expect(chart.locator("[aria-live]")).toContainText("Agachamento livre");
  });

  test("a mesma informação está disponível como tabela", async ({ page }) => {
    await page.goto("/dev/system");
    const section = page.locator("#charts");

    await section.getByRole("button", { name: "Ver como tabela" }).first().click();

    const table = section.getByRole("grid", { name: "1RM estimado" });
    await expect(table).toBeVisible();
    await expect(table.getByRole("row")).toHaveCount(13);
  });

  test("trocar o período atualiza o gráfico sem recarregar a página", async ({ page }) => {
    await page.goto("/dev/system");
    const chart = page.getByRole("application", { name: "Evolução do 1RM estimado por exercício" });
    await chart.focus();
    await page.keyboard.press("End");
    const before = await chart.locator("svg path[transform]").count();

    await page.locator("#charts").getByRole("radio", { name: "4 semanas" }).click();
    await chart.focus();

    const after = await chart.locator("svg path[transform]").count();
    expect(after).toBeLessThan(before);
  });
});

test.describe("treino", () => {
  test("retomar o descanso pausado começa a contagem", async ({ page }) => {
    await page.goto("/dev/system");
    const timer = page.locator("#training").getByRole("region", { name: "Descanso" }).first();

    await expect(timer).toContainText("1:12");
    await timer.getByRole("button", { name: /Retomar/ }).click();
    await expect(timer.getByRole("button", { name: /Pausar/ })).toBeVisible();
    await expect(timer).not.toContainText("1:12", { timeout: 4000 });
  });
});
