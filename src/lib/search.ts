// Search normalization (spec 11): ' ʻ ‘ ` ʼ ’ are treated as the same (dropped) when comparing.
export const APOSTROPHE_CHARS = "ʻʼ‘’`'´";
const APOSTROPHES_RE = /[ʻʼ‘’`'´]/g;

export function normalizeSearch(text: string): string {
  return text.toLowerCase().replace(APOSTROPHES_RE, "").replace(/\s+/g, " ").trim();
}

/** LIKE pattern "%…%" with %, _ and \ escaped. */
export function likePattern(text: string): string {
  return `%${text.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;
}

export function digitsOnly(text: string): string {
  return text.replace(/\D/g, "");
}
