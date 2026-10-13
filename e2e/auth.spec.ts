import { expect, test } from "./fixtures";
import {
  completeOnboarding,
  confirmFromEmail,
  emailLink,
  sharedAccount,
  signIn,
  signUp,
  uniqueAddress,
  uniqueEmail,
} from "./support/auth";

// These journeys start signed out, each from its own address so rate limits
// never carry over between tests. One viewport is enough for the flow itself;
// layout and accessibility of these screens are covered in other specs.
test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ context }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Fluxos verificados em uma largura.");
  await context.setExtraHTTPHeaders({ "x-real-ip": uniqueAddress() });
});

test.describe("acesso à área privada", () => {
  test("sem sessão, volta ao destino pedido depois de entrar", async ({ page }) => {
    await page.goto("/app/history?status=completed");

    await expect(page).toHaveURL(/\/sign-in\?next=%2Fapp%2Fhistory%3Fstatus%3Dcompleted$/);
    await signIn(page, sharedAccount.email, sharedAccount.password);

    await expect(page).toHaveURL(/\/app\/history\?status=completed$/);
    await expect(page.getByRole("heading", { level: 1, name: "Histórico" })).toBeVisible();
  });

  test("um destino fora do site é ignorado", async ({ page }) => {
    await page.goto("/sign-in?next=https%3A%2F%2Fexemplo.invalid%2Fapp");
    await signIn(page, sharedAccount.email, sharedAccount.password);
    await expect(page).toHaveURL(/\/app$/);
  });
});

test.describe("cadastro e confirmação", () => {
  test("cria a conta, confirma o e-mail, entra e sai", async ({ page }) => {
    const email = uniqueEmail("cadastro");
    await signUp(page, { displayName: "Ana", email, password: "frase longa de cadastro" });
    await expect(
      page.getByRole("heading", { level: 1, name: "Confirme seu e-mail" }),
    ).toBeVisible();

    // Opening the link alone does not confirm anything.
    const link = await emailLink(page.request, email);
    await page.goto(link);
    await expect(page.getByRole("button", { name: "Confirmar e-mail" })).toBeVisible();
    await page.getByRole("button", { name: "Confirmar e-mail" }).click();
    await expect(page).toHaveURL(/\/app\/onboarding$/);
    await completeOnboarding(page);

    await page.goto("/app/settings");
    await expect(page.getByText(email)).toBeVisible();
    await page.getByRole("button", { name: "Sair" }).click();

    await expect(page).toHaveURL(/\/sign-in\?status=signed-out$/);
    await expect(page.getByText("Você saiu da sua conta.")).toBeVisible();
    await page.goto("/app");
    await expect(page).toHaveURL(/\/sign-in\?next=%2Fapp$/);
  });

  test("um link de confirmação já usado é recusado", async ({ page }) => {
    const email = uniqueEmail("reuso");
    await signUp(page, { displayName: "Bia", email, password: "frase longa de reuso" });
    const link = await emailLink(page.request, email);
    await confirmFromEmail(page, email);
    await page.context().clearCookies();

    await page.goto(link);
    await page.getByRole("button", { name: "Confirmar e-mail" }).click();

    await expect(page).toHaveURL(/\/sign-in\?status=link-invalid$/);
    await expect(page.getByText(/Este link é inválido ou expirou/)).toBeVisible();
  });

  test("um e-mail já cadastrado recebe a mesma resposta de um novo", async ({ page }) => {
    await signUp(page, {
      displayName: "Outra pessoa",
      email: sharedAccount.email,
      password: "outra frase qualquer",
    });
    await expect(
      page.getByRole("heading", { level: 1, name: "Confirme seu e-mail" }),
    ).toBeVisible();
  });

  test("sem confirmar o e-mail, a conta ainda não entra", async ({ page }) => {
    const email = uniqueEmail("pendente");
    await signUp(page, { displayName: "Caio", email, password: "frase longa pendente" });

    await page.goto("/sign-in");
    await signIn(page, email, "frase longa pendente");
    await expect(page.getByText(/Confirme seu e-mail antes de entrar/)).toBeVisible();
  });
});

test.describe("entrada", () => {
  test("senha errada mostra mensagem neutra e mantém o e-mail", async ({ page }) => {
    await page.goto("/sign-in");
    await signIn(page, sharedAccount.email, "senha errada qualquer");

    await expect(
      page.getByRole("alert").filter({ hasText: "E-mail ou senha incorretos." }),
    ).toBeVisible();
    await expect(page.getByLabel("E-mail")).toHaveValue(sharedAccount.email);
  });

  test("e-mail sem conta recebe exatamente a mesma mensagem", async ({ page }) => {
    await page.goto("/sign-in");
    await signIn(page, uniqueEmail("inexistente"), "senha errada qualquer");
    await expect(
      page.getByRole("alert").filter({ hasText: "E-mail ou senha incorretos." }),
    ).toBeVisible();
  });
});

test.describe("recuperação de senha", () => {
  test("define uma nova senha pelo link do e-mail e entra com ela", async ({ page }) => {
    const email = uniqueEmail("recupera");
    await signUp(page, { displayName: "Davi", email, password: "frase antiga longa" });
    await confirmFromEmail(page, email);
    await completeOnboarding(page);
    await page.context().clearCookies();

    await page.goto("/forgot-password");
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Enviar link" }).click();
    await expect(page.getByRole("status")).toContainText("Se existir uma conta com esse e-mail");

    await expect
      .poll(async () => (await emailLink(page.request, email)).endsWith("type=recovery"))
      .toBe(true);
    await page.goto(await emailLink(page.request, email));
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page).toHaveURL(/\/reset-password$/);

    await page.getByLabel("Nova senha", { exact: true }).fill("frase nova bem longa");
    await page.getByRole("button", { name: "Salvar nova senha" }).click();
    await expect(page.getByText("Senha atualizada.")).toBeVisible();
    await expect(page).toHaveURL(/\/app$/);

    await page.context().clearCookies();
    await page.goto("/sign-in");
    await signIn(page, email, "frase nova bem longa");
    await expect(page).toHaveURL(/\/app$/);
  });

  test("pedir recuperação para e-mail sem conta tem a mesma resposta", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel("E-mail").fill(uniqueEmail("ninguem"));
    await page.getByRole("button", { name: "Enviar link" }).click();
    await expect(page.getByRole("status")).toContainText("Se existir uma conta com esse e-mail");
  });

  test("sem o link, a página de nova senha orienta a pedir outro", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByText(/expirou ou já foi usado/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Pedir novo link" })).toBeVisible();
  });
});

test.describe("cabeçalhos de segurança", () => {
  test("cada página traz política de conteúdo com nonce e bloqueia frames", async ({ page }) => {
    const response = await page.goto("/sign-in");
    const headers = response?.headers() ?? {};

    expect(headers["content-security-policy"]).toMatch(
      /script-src 'self' 'nonce-[^']+' 'strict-dynamic'/,
    );
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });
});
