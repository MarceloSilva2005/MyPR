import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { findDesignViolations } from "./lib/design-guards.ts";

const SCANNED = /^src\/.*\.(?:ts|tsx|css)$/;
const SKIPPED = /\.test\.(?:ts|tsx)$|^src\/test\//;

const files = execFileSync("git", ["ls-files", "-z", "src"], { encoding: "utf8" })
  .split("\0")
  .filter((path) => SCANNED.test(path) && !SKIPPED.test(path));

let failures = 0;
for (const path of files) {
  for (const violation of findDesignViolations(path, readFileSync(path, "utf8"))) {
    console.error(`${path}:${String(violation.line)}: ${violation.rule} (${violation.snippet})`);
    failures += 1;
  }
}

if (failures > 0) {
  console.error(`Design guard failed with ${String(failures)} violation(s).`);
  process.exit(1);
}
