// Business URL slugs (spec 6.8). Also used in Telegram deep links: biz_<slug>.
import { RESERVED_SLUGS } from "@/config/site";

export const SLUG_MIN = 3;
export const SLUG_MAX = 40;
const FALLBACK = "biznes";

const CYRILLIC: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  ғ: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "j",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  қ: "q",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  ў: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "x",
  ҳ: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sh",
  ъ: "",
  ь: "",
  ы: "i",
  э: "e",
  ю: "yu",
  я: "ya",
};

/** Apostrophe-like characters used in Uzbek Latin (oʻ, gʻ, tutuq belgisi). */
const APOSTROPHES = /['ʻʼ‘’`´]/g;

export function isReservedSlug(slug: string): boolean {
  return (RESERVED_SLUGS as readonly string[]).includes(slug);
}

/** Business name → URL-safe slug, e.g. "Ali Barber" → "ali-barber", "Гулнора" → "gulnora". */
export function slugify(name: string): string {
  let s = name.toLowerCase().normalize("NFC");
  s = s
    .replace(/o['ʻʼ‘’`´]/g, "o")
    .replace(/g['ʻʼ‘’`´]/g, "g")
    .replace(APOSTROPHES, "");
  s = [...s].map((ch) => CYRILLIC[ch] ?? ch).join("");
  // Drop remaining diacritics (é → e), then keep only [a-z0-9].
  s = s.normalize("NFD").replace(/[̀-ͯ]/g, "");
  s = s
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  s = s.slice(0, SLUG_MAX).replace(/-+$/g, "");
  if (s.length === 0) return FALLBACK;
  if (s.length < SLUG_MIN || isReservedSlug(s)) return `${s}-${FALLBACK}`.slice(0, SLUG_MAX);
  return s;
}

/** Validation for a slug typed by the owner. Returns an error code or null. */
export function validateSlug(slug: string): "SLUG_FORMAT" | "SLUG_RESERVED" | null {
  if (slug.length < SLUG_MIN || slug.length > SLUG_MAX) return "SLUG_FORMAT";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return "SLUG_FORMAT";
  if (isReservedSlug(slug)) return "SLUG_RESERVED";
  return null;
}

/** First free slug among base, base-2, base-3, … */
export function nextAvailableSlug(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const suffix = `-${n}`;
    const candidate = `${base.slice(0, SLUG_MAX - suffix.length).replace(/-+$/g, "")}${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }
}
