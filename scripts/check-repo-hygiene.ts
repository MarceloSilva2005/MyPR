import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

import { findViolations, parseExtraTerms } from "./lib/hygiene.ts";

const SKIPPED = [/^pnpm-lock\.yaml$/, /\.(png|jpe?g|webp|woff2?|ico)$/i];

const git = (...args: string[]): string =>
  execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

const extraTerms = parseExtraTerms(
  process.env["HYGIENE_EXTRA_TERMS"],
  existsSync(".hygiene-terms") ? readFileSync(".hygiene-terms", "utf8") : undefined,
);

const [mode, messageFile] = process.argv.slice(2);
let failures = 0;

function report(label: string, text: string, commitMessage = false): void {
  for (const violation of findViolations(text, { extraTerms, commitMessage })) {
    console.error(`${label}:${String(violation.line)}: ${violation.rule}`);
    failures += 1;
  }
}

if (mode === "--message" && messageFile) {
  report("commit message", readFileSync(messageFile, "utf8"), true);
} else {
  const staged = mode === "--staged";
  const listing = staged
    ? git("diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z")
    : git("ls-files", "-z");

  for (const path of listing.split("\0").filter(Boolean)) {
    if (SKIPPED.some((pattern) => pattern.test(path))) continue;
    report(path, staged ? git("show", `:${path}`) : readFileSync(path, "utf8"));
  }
}

if (failures > 0) {
  console.error(`Repository hygiene check failed with ${String(failures)} violation(s).`);
  process.exit(1);
}
