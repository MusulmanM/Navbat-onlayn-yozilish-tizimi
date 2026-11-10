import { describe, expect, it } from "vitest";
import ru from "../../messages/ru.json";
import uz from "../../messages/uz.json";

type Messages = { [key: string]: string | Messages };

// Flattens nested messages into ["Home.title", "..."] pairs.
function flatten(messages: Messages, prefix = ""): Array<[string, string]> {
  return Object.entries(messages).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? [[path, value] as [string, string]] : flatten(value, path);
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
});
