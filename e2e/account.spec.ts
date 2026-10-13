import type { Browser, Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import {
  completeOnboarding,
  confirmFromEmail,
  signIn,
  signUp,
  uniqueAddress,
  uniqueEmail,
} from "./support/auth";

// Each journey uses its own account and two browser contexts, standing for
// two devices signed in to the same account.
test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ context }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Fluxos verificados em uma largura.");
  await context.setExtraHTTPHeaders({ "x-real-ip": uniqueAddress() });
});

async function newAccount(page: Page, password: string): Promise<string> {
  const email = uniqueEmail("conta");
  await signUp(page, { displayName: "Conta", email, password });
  await confirmFromEmail(page, email);
  await completeOnboarding(page);
  return email;
}

async function otherDevice(browser: Browser, email: string, password: string): Promise<Page> {
  const context = await browser.newContext({
    extraHTTPHeaders: { "x-real-ip": uniqueAddress() },
  });
  const page = await context.newPage();
  await page.goto("/sign-in");
  await signIn(page, email, password);
  await expect(page).toHaveURL(/\/app$/);
  return page;
}

async function openDialog(page: Page, action: string): Promise<void> {
  await page.goto("/app/settings");
  await page.getByRole("button", { name: action }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

test.describe("senha e sessões", () => {
  test("alterar a senha exige a atual e encerra as outras sessões", async ({ page, browser }) => {
    const email = await newAccount(page, "frase antiga da conta");
    const other = await otherDevice(browser, email, "frase antiga da conta");

    await openDialog(page, "Alterar senha");
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Senha atual").fill("senha que não é");
    await dialog.getByLabel("Nova senha", { exact: true }).fill("frase nova da conta");
    await dialog.getByRole("button", { name: "Salvar nova senha" }).click();
    await expect(dialog.getByText("A senha atual não confere.")).toBeVisible();
    await expect(dialog.getByLabel("Senha atual")).toBeFocused();

    await dialog.getByLabel("Senha atual").fill("frase antiga da conta");
    await dialog.getByRole("button", { name: "Salvar nova senha" }).click();
    await expect(page.getByText("Senha alterada.", { exact: false })).toBeVisible();
    await expect(page.getByRole("dialog")).toBeHidden();

    // This device keeps working; the other one is sent to sign in.
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "Configurações" })).toBeVisible();
    await other.goto("/app/settings");
    await expect(other).toHaveURL(/\/sign-in\?next=%2Fapp%2Fsettings$/);

    await signIn(other, email, "frase antiga da conta");
    await expect(other.getByText("E-mail ou senha incorretos.")).toBeVisible();
    await signIn(other, email, "frase nova da conta");
    await expect(other).toHaveURL(/\/app\/settings$/);
    await other.context().close();
  });

  test("encerrar outras sessões mantém só este dispositivo", async ({ page, browser }) => {
    const email = await newAccount(page, "frase da conta longa");
    const other = await otherDevice(browser, email, "frase da conta longa");

    await openDialog(page, "Encerrar outras sessões");
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Senha atual").fill("frase da conta longa");
    await dialog.getByRole("button", { name: "Encerrar outras sessões" }).click();
    await expect(
      page.getByText("As sessões nos outros dispositivos foram encerradas."),
    ).toBeVisible();

    await other.goto("/app");
    await expect(other).toHaveURL(/\/sign-in\?next=%2Fapp$/);
    await page.goto("/app");
    await expect(page).toHaveURL(/\/app$/);
    await other.context().close();
  });

  test("sem a senha atual nada muda", async ({ page }) => {
    await newAccount(page, "frase da conta segura");

    await openDialog(page, "Encerrar outras sessões");
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Encerrar outras sessões" }).click();
    await expect(dialog.getByText("Informe a senha atual.")).toBeVisible();

    await dialog.getByRole("button", { name: "Fechar" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByRole("button", { name: "Encerrar outras sessões" })).toBeFocused();
  });
});
