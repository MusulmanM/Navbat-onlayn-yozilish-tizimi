// Uzbekistan phone numbers (spec 6.6). Stored as +998XXXXXXXXX.

/** Accepts "90 123 45 67", "+998 90 123-45-67", "998901234567", "901234567". */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 9) return `+998${digits}`;
  if (digits.length === 12 && digits.startsWith("998")) return `+${digits}`;
  return null;
}

/** "+998901234567" → "+998 90 123 45 67". */
export function formatPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  if (!normalized) return phone;
  const d = normalized.slice(4);
  return `+998 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
}

/** Input mask for the part after +998: up to 9 digits → "90 123 45 67". */
export function formatLocalPhoneInput(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 9);
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return parts.join(" ");
}

/** "+998901234567" → "901234567" (for prefilling the masked input). */
export function localPart(phone: string): string {
  const normalized = normalizePhone(phone);
  return normalized ? normalized.slice(4) : "";
}

/** tel: link target. */
export function phoneHref(phone: string): string {
  return `tel:${normalizePhone(phone) ?? phone}`;
}
