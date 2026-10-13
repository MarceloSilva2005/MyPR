// Context-specific words that make a password easy to guess (ASVS 5.0 6.1.2
// and 6.2.11): the product name and the person's own e-mail and name.
export const PRODUCT_WORDS = ["mypr", "my pr"] as const;

// Shorter fragments would reject too many unrelated passwords.
const MIN_WORD_LENGTH = 4;

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export interface PasswordContext {
  email?: string;
  displayName?: string;
}

/** True when the password contains the product name, the e-mail or the name. */
export function usesContextWords(password: string, context: PasswordContext = {}): boolean {
  const candidate = normalize(password);
  const words: string[] = [...PRODUCT_WORDS];

  const local = context.email?.split("@")[0];
  if (local) words.push(local);
  if (context.displayName) words.push(...context.displayName.split(/\s+/));

  return words
    .map(normalize)
    .filter((word) => word.length >= MIN_WORD_LENGTH)
    .some((word) => candidate.includes(word));
}
