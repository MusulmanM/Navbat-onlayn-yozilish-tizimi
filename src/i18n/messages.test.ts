import { describe, expect, it } from "vitest";
import { PLAN_FEATURES } from "@/config/plans";
import ru from "../../messages/ru.json";
import uz from "../../messages/uz.json";

type Messages = { [key: string]: unknown };

// Flattens nested messages into ["Home.title", "..."] pairs. Anything that is not a
// string or an object (e.g. an array) is reported as an error: next-intl precompiles
// messages at build time and only supports nested objects of strings.
function flatten(messages: Messages, prefix = ""): Array<[string, string]> {
  return Object.entries(messages).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") return [[path, value] as [string, string]];
    if (value && typeof value === "object" && !Array.isArray(value))
      return flatten(value as Messages, path);
    throw new Error(`${path}: only strings and nested objects are allowed`);
  });
}

const uzEntries = flatten(uz);
const ruEntries = flatten(ru);

describe("messages", () => {
  it("uz and ru have exactly the same keys", () => {
    const uzKeys = uzEntries.map(([key]) => key).sort();
    const ruKeys = ruEntries.map(([key]) => key).sort();
    expect(ruKeys).toEqual(uzKeys);
  });

  it("has no empty strings", () => {
    for (const [key, value] of [...uzEntries, ...ruEntries]) {
      expect(value.trim(), key).not.toBe("");
    }
  });

  it("uz texts use ʻ (U+02BB) and ʼ (U+02BC) instead of ASCII-like apostrophes", () => {
    const wrongApostrophe = /['‘’`]/;
    for (const [key, value] of uzEntries) {
      expect(wrongApostrophe.test(value), `${key}: "${value}"`).toBe(false);
    }
  });

  it("has a text for every plan feature", () => {
    const keys = new Set(uzEntries.map(([key]) => key));
    for (const k of PLAN_FEATURES.START) expect(keys.has(`Landing.startFeatures.${k}`)).toBe(true);
    for (const k of PLAN_FEATURES.PRO) expect(keys.has(`Landing.proFeatures.${k}`)).toBe(true);
  });
});
