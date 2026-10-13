import { gzipSync } from "node:zlib";

/**
 * Script files a modern browser downloads on the first visit to a route, without duplicates: the
 * framework runtime plus every chunk referenced by the route's layouts, page and boundaries. This
 * is the set of script tags Next.js renders. Pages are rendered per request (nonce-based CSP), so
 * there is no prerendered HTML to read; the build manifests carry the same information. Polyfills
 * load only in browsers that cannot run the app, so they are not counted.
 */
export function routeScripts(
  rootMainFiles: readonly string[],
  entryFiles: Readonly<Record<string, readonly string[]>>,
): string[] {
  return [...new Set([...rootMainFiles, ...Object.values(entryFiles).flat()])];
}

export function gzipBytes(content: Uint8Array): number {
  return gzipSync(content).length;
}

export interface BudgetResult {
  route: string;
  bytes: number;
  limit: number;
  ok: boolean;
}

export function checkBudget(route: string, bytes: number, limit: number): BudgetResult {
  return { route, bytes, limit, ok: bytes <= limit };
}

export function formatKilobytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} kB`;
}
