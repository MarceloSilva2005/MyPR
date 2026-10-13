import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

import {
  checkBudget,
  formatKilobytes,
  gzipBytes,
  routeScripts,
  type BudgetResult,
} from "./lib/bundle-budget.ts";

/**
 * First-load JavaScript per route, gzipped, measured from the manifests of the production build.
 * Limits are deliberately tight for pages that carry no product logic yet; raise them only with a
 * recorded reason.
 */
const BUDGETS: readonly { route: string; manifest: string; key: string; limitKb: number }[] = [
  { route: "/", manifest: "page", key: "/page", limitKb: 145 },
  { route: "/app", manifest: "app/page", key: "/app/page", limitKb: 175 },
];

interface ClientManifest {
  entryJSFiles?: Record<string, string[]>;
}

const { rootMainFiles } = JSON.parse(readFileSync(".next/build-manifest.json", "utf8")) as {
  rootMainFiles: string[];
};

// The client reference manifest is a script that assigns to a global; it is our own build output.
function entryFiles(manifest: string, key: string): Record<string, string[]> {
  const source = readFileSync(`.next/server/app/${manifest}_client-reference-manifest.js`, "utf8");
  const context: { globalThis?: unknown; __RSC_MANIFEST?: Record<string, ClientManifest> } = {};
  context.globalThis = context;
  runInNewContext(source, context);
  const files = context.__RSC_MANIFEST?.[key]?.entryJSFiles;
  if (!files) throw new Error(`No client manifest entry for ${key}`);
  return files;
}

const results: BudgetResult[] = BUDGETS.map(({ route, manifest, key, limitKb }) => {
  const bytes = routeScripts(rootMainFiles, entryFiles(manifest, key)).reduce(
    (total, file) => total + gzipBytes(readFileSync(`.next/${file}`)),
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
