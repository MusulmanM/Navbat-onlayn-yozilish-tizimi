// Telegram HTML parse mode: every user-provided text must be escaped (spec 8.1).
export function escapeHtml(text: string | null | undefined): string {
  return (text ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Tagged template that escapes every interpolated value. */
export function html(
  strings: TemplateStringsArray,
  ...values: Array<string | number | null | undefined>
): string {
  return strings.reduce(
    (out, part, i) => out + part + (i < values.length ? escapeHtml(String(values[i] ?? "")) : ""),
    "",
  );
}
