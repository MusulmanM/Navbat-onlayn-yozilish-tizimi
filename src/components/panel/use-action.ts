"use client";

import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/server/panel/result";

/** Runs a server action with a pending flag and a toast for errors (and optionally success). */
export function useAction() {
  const [pending, setPending] = useState(false);
  const te = useTranslations("PanelErrors");
  const ta = useTranslations("Actions");

  const errorText = useCallback(
    (code: string) => (te.has(code) ? te(code) : ta("error")),
    [te, ta],
  );

  const run = useCallback(
    async <T>(
      call: () => Promise<ActionResult<T>>,
      options: {
        success?: string | false;
        onError?: (code: string, fields?: Record<string, string>) => boolean | void;
      } = {},
    ): Promise<T | null> => {
      setPending(true);
      try {
        const result = await call();
        if (result.ok) {
          if (options.success !== false) toast.success(options.success ?? ta("saved"));
          return result.data;
        }
        const handled = options.onError?.(result.code, result.fields);
        if (!handled) toast.error(errorText(result.code));
        return null;
      } catch {
        toast.error(ta("error"));
        return null;
      } finally {
        setPending(false);
      }
    },
    [errorText, ta],
  );

  /** Same as run(), but returns true/false — for actions whose data is null on success. */
  const runOk = useCallback(
    async <T>(
      call: () => Promise<ActionResult<T>>,
      options: Parameters<typeof run>[1] = {},
    ): Promise<boolean> => {
      let success = false;
      await run(async () => {
        const result = await call();
        success = result.ok;
        return result;
      }, options);
      return success;
    },
    [run],
  );

  return { run, runOk, pending, errorText };
}
