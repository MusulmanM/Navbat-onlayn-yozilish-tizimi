"use client";

import { Check, Loader2, UserCheck, UserX, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Modal } from "@/components/panel/modal";
import { useAction } from "@/components/panel/use-action";
import type { BookingStatus } from "@/lib/bookings";
import { cn } from "@/lib/utils";
import { setBookingStatusAction } from "@/server/actions/bookings";

const btn =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors disabled:opacity-60 pointer-coarse:h-11";

/**
 * Status buttons for a booking (spec 6.4, 7.6). The server re-checks every transition;
 * the flags only decide which buttons make sense to show.
 */
export function BookingActions({
  bookingId,
  status,
  canMarkOutcome,
  canEditOutcome,
  compact = false,
  onDone,
}: {
  bookingId: string;
  status: BookingStatus;
  /** now ≥ startsAt − 1h */
  canMarkOutcome: boolean;
  /** within STATUS_EDIT_WINDOW_DAYS */
  canEditOutcome: boolean;
  compact?: boolean;
  onDone?: () => void;
}) {
  const t = useTranslations("BookingActions");
  const ts = useTranslations("Status");
  const { run, pending } = useAction();
  const [ask, setAsk] = useState<"cancel" | "reject" | null>(null);
  const [reason, setReason] = useState("");

  const change = async (to: BookingStatus, success: string, withReason?: string) => {
    const ok = await run(() => setBookingStatusAction({ bookingId, to, reason: withReason }), {
      success,
    });
    if (ok !== null) {
      setAsk(null);
      setReason("");
      onDone?.();
    }
  };

  const buttons: React.ReactNode[] = [];
  if (status === "PENDING") {
    buttons.push(
      <button
        key="confirm"
        type="button"
        disabled={pending}
        onClick={() => change("CONFIRMED", t("confirmed"))}
        className={cn(btn, "bg-primary text-primary-foreground hover:bg-primary/90")}
      >
        <Check className="size-4" aria-hidden />
        {t("confirm")}
      </button>,
      <button
        key="reject"
        type="button"
        disabled={pending}
        onClick={() => setAsk("reject")}
        className={cn(btn, "border bg-background text-destructive hover:bg-destructive/5")}
      >
        <X className="size-4" aria-hidden />
        {t("reject")}
      </button>,
    );
  }
  if (status === "CONFIRMED") {
    if (canMarkOutcome) {
      buttons.push(
        <button
          key="came"
          type="button"
          disabled={pending}
          onClick={() => change("COMPLETED", t("marked"))}
          className={cn(btn, "bg-success text-success-foreground hover:bg-success/90")}
        >
          <UserCheck className="size-4" aria-hidden />
          {t("came")}
        </button>,
        <button
          key="noshow"
          type="button"
          disabled={pending}
          onClick={() => change("NO_SHOW", t("marked"))}
          className={cn(btn, "border bg-background hover:bg-muted")}
        >
          <UserX className="size-4" aria-hidden />
          {t("noShow")}
        </button>,
      );
    }
    buttons.push(
      <button
        key="cancel"
        type="button"
        disabled={pending}
        onClick={() => setAsk("cancel")}
        className={cn(
          btn,
          "border bg-background text-destructive hover:bg-destructive/5",
          compact && "px-2.5",
        )}
      >
        <X className="size-4" aria-hidden />
        {t("cancel")}
      </button>,
    );
  }
  if ((status === "COMPLETED" || status === "NO_SHOW") && canEditOutcome) {
    const to = status === "COMPLETED" ? "NO_SHOW" : "COMPLETED";
    buttons.push(
      <button
        key="flip"
        type="button"
        disabled={pending}
        onClick={() => change(to, t("marked"))}
        className={cn(btn, "border bg-background hover:bg-muted")}
      >
        {t("changeTo", { status: ts(to) })}
      </button>,
    );
  }
  if (buttons.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {buttons}
        {pending && (
          <Loader2 className="size-5 animate-spin self-center text-muted-foreground" aria-hidden />
        )}
      </div>
      <Modal
        open={ask !== null}
        onOpenChange={(open) => !open && setAsk(null)}
        title={ask === "reject" ? t("rejectTitle") : t("cancelTitle")}
        description={t("cancelText")}
        footer={
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                change("CANCELLED_BY_BUSINESS", t("cancelled"), reason.trim() || undefined)
              }
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-destructive font-semibold text-white disabled:opacity-70"
            >
              {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
              {ask === "reject" ? t("yesReject") : t("yesCancel")}
            </button>
            <button
              type="button"
              onClick={() => setAsk(null)}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border font-semibold"
            >
              {t("keep")}
            </button>
          </div>
        }
      >
        <label htmlFor={`reason-${bookingId}`} className="mb-1.5 block font-medium">
          {t("reason")}
        </label>
        <textarea
          id={`reason-${bookingId}`}
          rows={2}
          maxLength={300}
          value={reason}
          placeholder={t("reasonPlaceholder")}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-lg border border-input px-3 py-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </Modal>
    </>
  );
}
