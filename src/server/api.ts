// Shared API error format: { error: { code, fields?, data? } } with an HTTP status.
// Clients translate `code` through messages/*.json (spec 6.3).
import { NextResponse } from "next/server";
import { z } from "zod";
import { EnvError } from "@/lib/env";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "BUSINESS_NOT_FOUND"
  | "SERVICE_NOT_FOUND"
  | "STAFF_NOT_FOUND"
  | "BOOKING_NOT_FOUND"
  | "BOOKING_DISABLED"
  | "SLOT_TAKEN"
  | "TOO_MANY_ACTIVE_BOOKINGS"
  | "TOO_MANY_REQUESTS"
  | "TOO_LATE_TO_CANCEL"
  | "NOT_ALLOWED"
  | "TOO_EARLY"
  | "EDIT_WINDOW_CLOSED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "STAFF_LIMIT"
  | "NOT_FOUND"
  | "EXPIRED"
  | "CONFIG"
  | "INTERNAL";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    public readonly fields?: Record<string, string>,
    public readonly data?: Record<string, string | number>,
  ) {
    super(code);
    this.name = "ApiError";
  }
}

export const NO_STORE = { "Cache-Control": "no-store" } as const;

export function json<T>(body: T, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

/** zod issues → { field: code } using the first issue per top-level field. */
export function zodFields(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    fields[key] ??= issue.message || issue.code;
  }
  return fields;
}

export function parseOrThrow<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) throw new ApiError(400, "VALIDATION_ERROR", zodFields(result.error));
  return result.data;
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return json(
      { error: { code: error.code, fields: error.fields, data: error.data } },
      error.status,
    );
  }
  if (error instanceof EnvError) {
    console.error(error.message);
    return json({ error: { code: "CONFIG" } }, 500);
  }
  console.error("[api] unexpected error", error);
  return json({ error: { code: "INTERNAL" } }, 500);
}

/** Reads a JSON body; invalid JSON becomes VALIDATION_ERROR. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "VALIDATION_ERROR");
  }
}
