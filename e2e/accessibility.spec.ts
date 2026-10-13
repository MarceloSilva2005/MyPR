import { expect, expectAccessible, test } from "./fixtures";
import {
  confirmFromEmail,
  passHumanCheck,
  signUp,
  uniqueAddress,
  uniqueEmail,
} from "./support/auth";

const SCHEMES = ["light", "dark"] as const;

const PAGES = [
  { name: "página inicial", path: "/" },
  { name: "visão geral", path: "/app" },
  { name: "área em desenvolvimento", path: "/app/workout" },
  { name: "configurações", path: "/app/settings" },
  { name: "galeria do design system", path: "/dev/system" },
  { name: "shell com treino ativo", path: "/dev/shell?activeWorkout=1" },
];

// Sign-in screens are seen without a session.
const AUTH_PAGES = [
  { name: "entrar", path: "/sign-in" },
  { name: "criar conta", path: "/sign-up" },
  { name: "confirme seu e-mail", path: "/check-email" },
  { name: "recuperar acesso", path: "/forgot-password" },
  { name: "nova senha sem link válido", path: "/reset-password" },
  { name: "confirmação do link", path: "/auth/confirm?token_hash=abcdefgh123&type=email" },
];

for (const scheme of SCHEMES) {
  test.describe(`acessibilidade das telas de acesso, tema ${scheme}`, () => {
    test.use({ colorScheme: scheme, storageState: { cookies: [], origins: [] } });

    for (const { name, path } of AUTH_PAGES) {
      test(`${name} não tem violações WCAG 2.2 AA`, async ({ page }) => {
        await page.goto(path);
        await expectAccessible(page);
      });
    }

    test("erros de validação do cadastro são acessíveis", async ({ page }) => {
      await page.goto("/sign-up");
      await passHumanCheck(page);
      await page.getByRole("button", { name: "Criar conta" }).click();
      await expect(page.getByText("Informe um nome com até 60 caracteres.")).toBeVisible();
      await expect(page.getByLabel("Nome de exibição")).toBeFocused();
      await expectAccessible(page);
    });
  });
}

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

for (const scheme of SCHEMES) {
  test.describe(`acessibilidade do onboarding, tema ${scheme}`, () => {
    test.use({ colorScheme: scheme, storageState: { cookies: [], origins: [] } });

    test("cada passo não tem violações WCAG 2.2 AA", async ({ page, context }, testInfo) => {
      test.skip(testInfo.project.name === "tablet", "Coberto no desktop e no celular.");
      await context.setExtraHTTPHeaders({ "x-real-ip": uniqueAddress() });
      const email = uniqueEmail("a11y");
      await signUp(page, { displayName: "Acesso", email, password: "frase longa de acesso" });
      await confirmFromEmail(page, email);

      for (const next of ["Começar", "Continuar", "Pular"]) {
        await expectAccessible(page);
        await page.getByRole("button", { name: next }).click();
      }
      await expect(page.getByText("Passo 4 de 4")).toBeVisible();
      await expectAccessible(page);
    });
  });
}
