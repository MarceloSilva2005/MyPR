import { gzipSync } from "node:zlib";

/**
 * Script files a modern browser downloads for a page, in order, without duplicates. Scripts marked
 * nomodule are fallbacks for browsers that cannot run the app anyway, so they are not counted.
 */
export function extractScriptSources(html: string): string[] {
  const sources = new Set<string>();
  for (const match of html.matchAll(/<script([^>]*)>/gi)) {
    const attributes = match[1] ?? "";
    const source = /\ssrc="([^"]+)"/.exec(attributes)?.[1];
    if (!source?.startsWith("/_next/") || /\snomodule/i.test(attributes)) continue;
    sources.add(source.split("?")[0] ?? source);
  }
  return [...sources];
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
