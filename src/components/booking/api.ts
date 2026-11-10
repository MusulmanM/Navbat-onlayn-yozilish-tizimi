// Tiny fetch wrapper for the public booking API (no extra libraries on the public page).
import type { ApiResult } from "@/components/booking/types";

export async function apiRequest<T>(
  url: string,
  init?: RequestInit & { json?: unknown },
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.json ? { "Content-Type": "application/json" } : {}),
      },
      body: init?.json === undefined ? init?.body : JSON.stringify(init.json),
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as
      | (T & {
          error?: {
            code?: string;
            fields?: Record<string, string>;
            data?: Record<string, string | number>;
          };
        })
      | null;
    if (!response.ok || !body || body.error) {
      return {
        ok: false,
        error: {
          code: body?.error?.code ?? "UNKNOWN",
          status: response.status,
          fields: body?.error?.fields,
          data: body?.error?.data,
        },
      };
    }
    return { ok: true, data: body };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { ok: false, error: { code: "ABORTED", status: 0 } };
    }
    return { ok: false, error: { code: "NETWORK", status: 0 } };
  }
}
