import { readFileSync } from "node:fs";

import {
  checkBudget,
  extractScriptSources,
  formatKilobytes,
  gzipBytes,
  type BudgetResult,
} from "./lib/bundle-budget.ts";

/**
 * First-load JavaScript per route, gzipped, measured from the prerendered HTML of the production
 * build. Limits are deliberately tight for pages that carry no product logic yet; raise them only
 * with a recorded reason.
 */
const BUDGETS: readonly { route: string; html: string; limitKb: number }[] = [
  { route: "/", html: ".next/server/app/index.html", limitKb: 145 },
  { route: "/app", html: ".next/server/app/app.html", limitKb: 175 },
];

const results: BudgetResult[] = BUDGETS.map(({ route, html, limitKb }) => {
  const sources = extractScriptSources(readFileSync(html, "utf8"));
  const bytes = sources.reduce(
    (total, source) => total + gzipBytes(readFileSync(`.next${source.replace(/^\/_next/, "")}`)),
    0,
  );
  return checkBudget(route, bytes, limitKb * 1024);
});

for (const result of results) {
  const status = result.ok ? "ok" : "OVER BUDGET";
  console.log(
    `${result.route.padEnd(6)} ${formatKilobytes(result.bytes).padStart(10)} of ${formatKilobytes(result.limit)}  ${status}`,
  );
}

if (results.some((result) => !result.ok)) process.exit(1);
