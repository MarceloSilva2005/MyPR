import type { Page } from "@playwright/test";
import pg from "pg";

import { expect, test } from "./fixtures";
import { confirmFromEmail, signIn, signUp, uniqueAddress, uniqueEmail } from "./support/auth";

test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ context }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Fluxos verificados em uma largura.");
  await context.setExtraHTTPHeaders({ "x-real-ip": uniqueAddress() });
});

const PASSWORD = "frase longa do onboarding";

async function newAccount(page: Page): Promise<string> {
  const email = uniqueEmail("onboarding");
  await signUp(page, { displayName: "Elisa", email, password: PASSWORD });
  await confirmFromEmail(page, email);
  return email;
}

async function storedProfile(email: string): Promise<Record<string, unknown>> {
  const client = new pg.Client({
    connectionString:
      process.env["DB_TEST_URL"] ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  });
  await client.connect();
  const { rows } = await client.query<Record<string, unknown>>(
    `select p.* from public.profiles p join auth.users u on u.id = p.owner_id where u.email = $1`,
    [email],
  );
  await client.end();
  return rows[0] ?? {};
}

const progress = (page: Page) => page.getByText(/^Passo \d de 4$/);

test.describe("onboarding", () => {
  test("configura preferências e perfil e leva ao próximo passo do produto", async ({ page }) => {
    const email = await newAccount(page);
    await expect(progress(page)).toHaveText("Passo 1 de 4");
    await expect(
      page.getByRole("heading", { level: 1, name: "Boas-vindas ao MyPR" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Começar" }).click();
    await expect(progress(page)).toHaveText("Passo 2 de 4");
    await page.getByRole("radio", { name: "Libras (lb)" }).click();
    await page.getByRole("radio", { name: "Escuro" }).click();
    await page.getByRole("radio", { name: "Domingo" }).click();
    // The theme applies at once, before saving.
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(progress(page)).toHaveText("Passo 3 de 4");
    await page.getByText("Força", { exact: true }).click();
    await page.getByText("Iniciante", { exact: true }).click();
    await expect(page.getByRole("radio", { name: "Força" })).toBeChecked();
    await expect(page.getByRole("radio", { name: "Iniciante" })).toBeChecked();
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(progress(page)).toHaveText("Passo 4 de 4");
    await page.getByRole("button", { name: "Montar rotina" }).click();
    await expect(page).toHaveURL(/\/app\/routines$/);

    expect(await storedProfile(email)).toMatchObject({
      weight_unit: "lb",
      theme: "dark",
      week_starts_on: 0,
      training_goal: "strength",
      experience_level: "beginner",
      default_rest_seconds: 180,
      time_zone: "UTC",
    });
    expect((await storedProfile(email))["onboarding_completed_at"]).not.toBeNull();

    await page.goto("/app/onboarding");
    await expect(page).toHaveURL(/\/app$/);
  });

  test("retoma no passo em que parou, inclusive em outro dispositivo", async ({
    page,
    browser,
  }) => {
    const email = await newAccount(page);
    await page.getByRole("button", { name: "Começar" }).click();
    await page.getByRole("radio", { name: "Libras (lb)" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(progress(page)).toHaveText("Passo 3 de 4");

    await page.reload();
    await expect(progress(page)).toHaveText("Passo 3 de 4");

    const other = await browser.newContext({ extraHTTPHeaders: { "x-real-ip": uniqueAddress() } });
    const second = await other.newPage();
    await second.goto("/app/history");
    await signIn(second, email, PASSWORD);
    await expect(second).toHaveURL(/\/app\/onboarding$/);
    await expect(progress(second)).toHaveText("Passo 3 de 4");

    // Going back shows what was saved.
    await second.getByRole("button", { name: "Voltar" }).click();
    await expect(progress(second)).toHaveText("Passo 2 de 4");
    await expect(second.getByRole("radio", { name: "Libras (lb)" })).toBeChecked();
    await other.close();
  });

  test("o perfil de treino é opcional", async ({ page }) => {
    const email = await newAccount(page);
    await page.getByRole("button", { name: "Começar" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("button", { name: "Pular" }).click();
    await expect(progress(page)).toHaveText("Passo 4 de 4");

    await page.getByRole("button", { name: "Iniciar treino livre" }).click();
    await expect(page).toHaveURL(/\/app\/workout$/);
    expect(await storedProfile(email)).toMatchObject({
      training_goal: null,
      default_rest_seconds: 120,
    });
  });

  test("a área do app só abre depois de concluir", async ({ page }) => {
    await newAccount(page);
    await page.goto("/app/settings");
    await expect(page).toHaveURL(/\/app\/onboarding$/);
  });
});
