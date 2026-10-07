/**
 * Lowercases and strips diacritics so searches match regardless of accents
 * ("supino" finds "Supíno", "agachamento" finds "Agáchamento").
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** True when every word typed by the user appears somewhere in the haystack. */
export function matchesSearch(haystack: string, query: string): boolean {
  const normalizedHaystack = normalizeSearchText(haystack);
  return normalizeSearchText(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => normalizedHaystack.includes(word));
}
