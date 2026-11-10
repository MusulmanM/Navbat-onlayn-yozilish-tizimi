"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/components/booking/api";

/** "Cancel booking" with a confirmation step and an optional reason (spec 7.3). */
export function CancelBooking({ token }: { token: string }) {
  const t = useTranslations("Manage");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    const res = await apiRequest<{ status: string }>(`/api/public/bookings/${token}/cancel`, {
      method: "POST",
      json: { reason: reason || undefined },
    });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      setOpen(false);
      router.refresh();
      return;
    }
    const key = `errors.${res.error.code}`;
    setError(t.has(key) ? t(key) : t("errors.UNKNOWN"));
  };

  if (done) {
    return (
      <p
        role="status"
        className="rounded-xl bg-accent p-3 text-center font-medium text-accent-foreground"
      >
        {t("cancelledToast")}
      </p>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-destructive/40 bg-background font-semibold text-destructive transition-colors hover:bg-destructive/5"
      >
        {t("cancel")}
      </button>
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        aria-labelledby="cancel-title"
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl p-0 shadow-xl backdrop:bg-foreground/40"
      >
        <div className="space-y-4 p-5">
          <h2 id="cancel-title" className="text-xl font-bold">
            {t("cancelTitle")}
          </h2>
          <p className="text-muted-foreground">{t("cancelText")}</p>
          <div>
            <label htmlFor="cancel-reason" className="mb-1.5 block font-medium">
              {t("reason")}
            </label>
            <textarea
              id="cancel-reason"
              rows={2}
              maxLength={300}
              value={reason}
              placeholder={t("reasonPlaceholder")}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-input px-3 py-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button
              type="button"
              onClick={confirm}
              disabled={busy}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-destructive font-semibold text-white disabled:opacity-70"
            >
              {busy && <Loader2 className="size-5 animate-spin" aria-hidden />}
              {busy ? t("cancelling") : t("cancelYes")}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border font-semibold"
            >
              {t("cancelNo")}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
