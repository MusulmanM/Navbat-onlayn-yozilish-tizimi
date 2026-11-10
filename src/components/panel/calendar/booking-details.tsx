"use client";

import { CalendarClock, CheckCircle2, MessageSquare, Phone, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { TelegramIcon } from "@/components/common/telegram-icon";
import { BookingActions } from "@/components/panel/booking-actions";
import { RescheduleDialog } from "@/components/panel/calendar/reschedule-dialog";
import { CopyButton } from "@/components/panel/copy-button";
import { Modal } from "@/components/panel/modal";
import { usePanel } from "@/components/panel/panel-context";
import { StatusBadge } from "@/components/panel/status-badge";
import { useAction } from "@/components/panel/use-action";
import { botStartLink } from "@/config/public-env";
import { Link } from "@/i18n/navigation";
import { formatPhone, phoneHref } from "@/lib/phone";
import { updateNoteAction } from "@/server/actions/bookings";
import type { BookingRowData } from "@/server/panel/serialize";

/** Booking details panel (spec 7.6, calendar): client, service, notes, actions. */
export function BookingDetails({
  row,
  open,
  onOpenChange,
}: {
  row: BookingRowData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Calendar");
  const ta = useTranslations("AddBooking");
  const tsrc = useTranslations("Source");
  const panel = usePanel();
  const { run, pending } = useAction();
  const [note, setNote] = useState(row.internalNote ?? "");
  const [rescheduling, setRescheduling] = useState(false);
  const active = row.status === "PENDING" || row.status === "CONFIRMED";
  const message = ta("clientMessage", {
    date: row.dateLabel,
    time: row.time,
    business: panel.businessName,
    link: botStartLink(`bk_${row.manageToken}`) ?? "",
  }).trim();

  return (
    <>
      <Modal
        open={open && !rescheduling}
        onOpenChange={onOpenChange}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {row.time}–{row.endTime} <StatusBadge status={row.status} />
          </span>
        }
        description={<span className="first-letter:uppercase">{row.dateLabel}</span>}
      >
        <div className="space-y-5">
          <section className="rounded-xl bg-muted/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{t("client")}</p>
                <p className="text-lg font-semibold">{row.clientName}</p>
                <p className="text-muted-foreground">{formatPhone(row.clientPhone)}</p>
              </div>
              <a
                href={phoneHref(row.clientPhone)}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-3.5 font-semibold text-primary-foreground"
              >
                <Phone className="size-4" aria-hidden />
                {t("call")}
              </a>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span className={row.telegram ? "text-primary" : "text-muted-foreground"}>
                <TelegramIcon className="mr-1 inline size-4" />
                {row.telegram ? t("telegramLinked") : t("telegramNotLinked")}
              </span>
              {row.coming && (
                <span className="text-success">
                  <CheckCircle2 className="mr-1 inline size-4" aria-hidden />
                  {t("clientComing")}
                </span>
              )}
              <Link
                href={`/panel/mijozlar/${row.clientId}`}
                className="font-medium text-primary hover:underline"
              >
                <UserRound className="mr-1 inline size-4" aria-hidden />
                {t("openClient")}
              </Link>
            </div>
          </section>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="col-span-2">
              <dt className="text-sm text-muted-foreground">{t("service")}</dt>
              <dd className="font-semibold">{row.service}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{panel.staffLabel}</dt>
              <dd className="font-semibold">{row.staffName}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t("price")}</dt>
              <dd className="font-semibold">{row.priceLabel}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">{t("source")}</dt>
              <dd className="font-semibold">{tsrc(row.source)}</dd>
            </div>
          </dl>

          {row.clientComment && (
            <div className="rounded-xl border p-3">
              <p className="mb-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MessageSquare className="size-4" aria-hidden />
                {t("clientComment")}
              </p>
              <p className="whitespace-pre-line">{row.clientComment}</p>
            </div>
          )}
          {row.cancelReason && row.cancelReason !== "AUTO_EXPIRED" && (
            <p className="text-sm text-muted-foreground">
              {t("cancelReason", { reason: row.cancelReason })}
            </p>
          )}

          <BookingActions
            bookingId={row.id}
            status={row.status}
            canMarkOutcome={row.canMarkOutcome}
            canEditOutcome={row.canEditOutcome}
            onDone={() => onOpenChange(false)}
          />

          {active && (
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setRescheduling(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border font-semibold hover:bg-muted"
              >
                <CalendarClock className="size-4" aria-hidden />
                {t("reschedule")}
              </button>
              {!row.telegram && <CopyButton text={message} label={t("copyMessage")} />}
            </div>
          )}

          <div>
            <label htmlFor={`note-${row.id}`} className="mb-1.5 block font-medium">
              {t("internalNote")}
            </label>
            <textarea
              id={`note-${row.id}`}
              rows={2}
              maxLength={500}
              value={note}
              placeholder={t("internalNotePlaceholder")}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-lg border border-input px-3 py-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            {note !== (row.internalNote ?? "") && (
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => updateNoteAction(row.id, note))}
                className="mt-2 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {t("saveNote")}
              </button>
            )}
          </div>
        </div>
      </Modal>
      {rescheduling && (
        <RescheduleDialog
          row={row}
          open={rescheduling}
          onOpenChange={setRescheduling}
          onDone={() => {
            setRescheduling(false);
            onOpenChange(false);
          }}
        />
      )}
    </>
  );
}
