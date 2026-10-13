import { expect, type APIRequestContext, type Page } from "@playwright/test";

// Captures every e-mail sent by the local auth server (supabase/config.toml).
const MAILPIT = process.env["MAILPIT_URL"] ?? "http://127.0.0.1:54324";

/** Account shared by the tests that only need to be signed in. Test values only. */
export const sharedAccount = {
  displayName: "Pessoa de teste",
  email: "pessoa@example.test",
  password: "frase de teste longa",
};

export const SIGNED_IN_STATE = "reports/.auth/signed-in.json";

export function uniqueEmail(label: string): string {
  return `${label}-${String(Date.now())}-${String(Math.floor(Math.random() * 1e6))}@example.test`;
}

/** A documentation-range address per test, so rate limits never leak between tests. */
export function uniqueAddress(): string {
  return `198.51.100.${String(1 + Math.floor(Math.random() * 254))}`;
}

interface MailpitSearch {
  messages: { ID: string }[];
}

/**
 * Path of the link in the latest e-mail sent to `to`, waiting for it to arrive.
 * The e-mail points at the configured site URL; tests follow the same path on
 * the test server.
 */
export async function emailLink(request: APIRequestContext, to: string): Promise<string> {
  let path = "";
  await expect
    .poll(
      async () => {
        const search = await request.get(`${MAILPIT}/api/v1/search`, {
          params: { query: `to:"${to}"`, limit: "1" },
        });
        const { messages } = (await search.json()) as MailpitSearch;
        const id = messages[0]?.ID;
        if (!id) return "";
        const message = await request.get(`${MAILPIT}/api/v1/message/${id}`);
        const { HTML } = (await message.json()) as { HTML: string };
        const match = /\/auth\/confirm\?token_hash=([\w-]+)&amp;type=(\w+)/.exec(HTML);
        path = match ? `/auth/confirm?token_hash=${match[1] ?? ""}&type=${match[2] ?? ""}` : "";
        return path;
      },
      { timeout: 15_000, message: `e-mail to ${to}` },
    )
    .not.toBe("");
  return path;
}

export async function signUp(
  page: Page,
  account: { displayName: string; email: string; password: string },
): Promise<void> {
  await page.goto("/sign-up");
  await page.getByLabel("Nome de exibição").fill(account.displayName);
  await page.getByLabel("E-mail").fill(account.email);
  await page.getByLabel("Senha", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/check-email$/);
}

/** Confirms a new account, which then continues to the onboarding. */
export async function confirmFromEmail(page: Page, email: string): Promise<void> {
  await page.goto(await emailLink(page.request, email));
  await page.getByRole("button", { name: "Confirmar e-mail" }).click();
  await expect(page).toHaveURL(/\/app\/onboarding$/);
}

/** Goes through the onboarding with the defaults and skips the optional step. */
export async function completeOnboarding(page: Page): Promise<void> {
  await page.goto("/app/onboarding");
  await page.getByRole("button", { name: "Começar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Pular" }).click();
  await page.getByRole("button", { name: "Iniciar treino livre" }).click();
  await expect(page).toHaveURL(/\/app\/workout$/);
}

export async function signIn(page: Page, email: string, password: string): Promise<void> {
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
}
