import { expect, test as setup } from "@playwright/test";
import pg from "pg";

import {
  completeOnboarding,
  confirmFromEmail,
  SIGNED_IN_STATE,
  sharedAccount,
  signIn,
  signUp,
  uniqueAddress,
} from "./support/auth";

// Each run starts with fresh rate limit counters in the local database, so
// repeated runs within a window do not lock the shared account out.
setup.beforeAll(async () => {
  const client = new pg.Client({
    connectionString:
      process.env["DB_TEST_URL"] ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  });
  await client.connect();
  await client.query("delete from private.rate_limits");
  await client.end();
});

// Signs the shared account in once and stores the session for the tests that
// only need to be inside the application. The account is created on first use.
setup("conta de teste com sessão", async ({ browser }) => {
  const context = await browser.newContext({ extraHTTPHeaders: { "x-real-ip": uniqueAddress() } });
  const page = await context.newPage();
  const { displayName, email, password } = sharedAccount;

  await page.goto("/sign-in");
  await signIn(page, email, password);
  const outcome = await Promise.race([
    page.waitForURL(/\/app(\/onboarding)?$/).then(() => "signed-in" as const),
    page
      .getByText("E-mail ou senha incorretos.")
      .waitFor()
      .then(() => "missing" as const),
  ]);

  if (outcome === "missing") {
    await signUp(page, { displayName, email, password });
    await confirmFromEmail(page, email);
  }
  // The application sends an account that has not finished onboarding there.
  await page.goto("/app");
  if (page.url().endsWith("/app/onboarding")) await completeOnboarding(page);

  await expect(
    page
      .getByRole("navigation", { name: "Navegação principal" })
      .or(page.getByRole("navigation", { name: "Navegação" }))
      .first(),
  ).toBeVisible();
  await context.storageState({ path: SIGNED_IN_STATE });
  await context.close();
});
