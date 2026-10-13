import { existsSync, readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

import {
  checkBudget,
  formatKilobytes,
  gzipBytes,
  heaviestOnDemand,
  routeScripts,
  type BudgetResult,
} from "./lib/bundle-budget.ts";

/**
 * First-load JavaScript per route, gzipped, measured from the manifests of the production build.
 * Limits are deliberately tight for pages that carry no product logic yet; raise them only with a
 * recorded reason.
 */
interface Budget {
  route: string;
  manifest: string;
  key: string;
  limitKb: number;
  /**
   * The route renders one of its on-demand chunks right away (the onboarding steps), so the
   * heaviest of them is part of the first visit. Chunks loaded after an interaction, such as the
   * "Mais" sheet of the shell, are not.
   */
  rendersOnDemand?: boolean;
}

const BUDGETS: readonly Budget[] = [
  { route: "/", manifest: "page", key: "/page", limitKb: 145 },
  { route: "/app", manifest: "app/(shell)/page", key: "/app/(shell)/page", limitKb: 175 },
  {
    route: "/app/onboarding",
    manifest: "app/onboarding/page",
    key: "/app/onboarding/page",
    limitKb: 175,
    rendersOnDemand: true,
  },
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

// Imports through next/dynamic, listed per route by the build.
function onDemandFiles(manifest: string): string[][] {
  const path = `.next/server/app/${manifest}/react-loadable-manifest.json`;
  if (!existsSync(path)) return [];
  const entries = JSON.parse(readFileSync(path, "utf8")) as Record<string, { files: string[] }>;
  return Object.values(entries).map((entry) => entry.files);
}

const sizeOf = (file: string) => gzipBytes(readFileSync(`.next/${file}`));

const results: BudgetResult[] = BUDGETS.map(
  ({ route, manifest, key, limitKb, rendersOnDemand }) => {
    const scripts = routeScripts(rootMainFiles, entryFiles(manifest, key));
    const onDemand = rendersOnDemand
      ? heaviestOnDemand(scripts, onDemandFiles(manifest), sizeOf)
      : 0;
    const bytes = scripts.reduce((total, file) => total + sizeOf(file), 0) + onDemand;
    return checkBudget(route, bytes, limitKb * 1024);
  },
);

for (const result of results) {
  const status = result.ok ? "ok" : "OVER BUDGET";
  console.log(
    `${result.route.padEnd(6)} ${formatKilobytes(result.bytes).padStart(10)} of ${formatKilobytes(result.limit)}  ${status}`,
  );
}

if (results.some((result) => !result.ok)) process.exit(1);
