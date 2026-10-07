export interface Violation {
  line: number;
  rule: string;
}

// Decorative symbols and pictographs are not allowed anywhere in the repository.
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

// Automatic tool signatures must not appear in files or commit messages.
const SIGNATURES: readonly { rule: string; pattern: RegExp }[] = [
  { rule: "automatic signature", pattern: /generated (by|with)\b/i },
];

const COMMIT_ONLY: readonly { rule: string; pattern: RegExp }[] = [
  { rule: "co-author trailer", pattern: /^co-authored-by:/i },
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Terms that must never appear are kept out of the repository: they come from
 * the HYGIENE_EXTRA_TERMS variable (comma separated) or from an untracked
 * `.hygiene-terms` file (one term per line).
 */
export function parseExtraTerms(...sources: (string | undefined)[]): string[] {
  return sources
    .flatMap((source) => (source ?? "").split(/[,\n]/))
    .map((term) => term.trim())
    .filter((term) => term.length > 0);
}

export function findViolations(
  text: string,
  options: { extraTerms?: readonly string[]; commitMessage?: boolean } = {},
): Violation[] {
  const extra = (options.extraTerms ?? []).map((term) => ({
    rule: "prohibited term",
    pattern: new RegExp(escapeRegExp(term), "i"),
  }));
  const rules = [...SIGNATURES, ...extra, ...(options.commitMessage ? COMMIT_ONLY : [])];

  const violations: Violation[] = [];
  text.split(/\r?\n/).forEach((content, index) => {
    if (options.commitMessage && content.startsWith("#")) return;
    if (EMOJI.test(content)) violations.push({ line: index + 1, rule: "emoji or pictograph" });
    for (const { rule, pattern } of rules) {
      if (pattern.test(content)) violations.push({ line: index + 1, rule });
    }
  });
  return violations;
}
