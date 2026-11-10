// Server action results: { ok, data } or { ok: false, code } — codes map to PanelErrors.* texts.
import { unstable_rethrow } from "next/navigation";
import { BookingTransitionError } from "@/lib/bookings";
import { ApiError } from "@/server/api";

export type ActionResult<T = null> =
  { ok: true; data: T } | { ok: false; code: string; fields?: Record<string, string> };

/** Business-rule error inside panel actions. */
export class PanelError extends Error {
  constructor(
    public readonly code: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(code);
    this.name = "PanelError";
  }
}

export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    unstable_rethrow(error); // let Next.js redirects / notFound through
    if (error instanceof PanelError) return { ok: false, code: error.code, fields: error.fields };
    if (error instanceof ApiError) return { ok: false, code: error.code, fields: error.fields };
    if (error instanceof BookingTransitionError) return { ok: false, code: error.code };
    console.error("[panel action] failed", error);
    return { ok: false, code: "INTERNAL" };
  }
}
