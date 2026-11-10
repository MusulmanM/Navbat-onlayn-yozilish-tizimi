"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/panel/modal";
import { usePanel } from "@/components/panel/panel-context";
import { useAction } from "@/components/panel/use-action";
import { formatDateLong } from "@/lib/time";
import { cn } from "@/lib/utils";
import { panelSlotsAction, rescheduleAction } from "@/server/actions/bookings";
import type { BookingRowData } from "@/server/panel/serialize";

const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/** "Vaqtini o'zgartirish" (spec 6.4): new date, time and staff; the booking does not block itself. */
export function RescheduleDialog({
  row,
  open,
  onOpenChange,
  onDone,
}: {
  row: BookingRowData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const t = useTranslations("Calendar");
  const ta = useTranslations("AddBooking");
  const panel = usePanel();
  const { run, pending } = useAction();
  const service = panel.services.find((s) => s.id === row.serviceId);
  const staffOptions = panel.staff.filter(
    (s) => service?.staffIds.includes(s.id) ?? s.id === row.staffId,
  );
  const [staffId, setStaffId] = useState(row.staffId);
  const [date, setDate] = useState(row.date);
  const [outsideHours, setOutsideHours] = useState(false);
  const [slots, setSlots] = useState<Array<{ time: string; startsAt: string }> | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const request = useRef(0);

  useEffect(() => {
    const id = ++request.current;
    void panelSlotsAction({
      serviceId: row.serviceId,
      staffId,
      date,
      outsideHours,
      excludeBookingId: row.id,
    }).then((res) => {
      if (id !== request.current) return;
      setSlots(res.ok ? res.data : []);
    });
  }, [row.serviceId, row.id, staffId, date, outsideHours]);

  const save = async () => {
    if (!selected) return;
    const ok = await run(
      () => rescheduleAction({ bookingId: row.id, staffId, startsAt: selected, outsideHours }),
      { success: t("rescheduled") },
    );
    if (ok) onDone();
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t("rescheduleTitle")}
      description={`${row.clientName} · ${row.service}`}
      footer={
        <button
          type="button"
          disabled={!selected || pending}
          onClick={save}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-50"
        >
          {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
          {t("rescheduleSave")}
        </button>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="rs-date" className="mb-1.5 block font-medium">
              {ta("date")}
            </label>
            <input
              id="rs-date"
              type="date"
              value={date}
              onChange={(e) => {
                if (!e.target.value) return;
                setDate(e.target.value);
                setSlots(null);
                setSelected(null);
              }}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="rs-staff" className="mb-1.5 block font-medium">
              {panel.staffLabel}
            </label>
            <select
              id="rs-staff"
              value={staffId}
              onChange={(e) => {
                setStaffId(e.target.value);
                setSlots(null);
                setSelected(null);
              }}
              className={fieldClass}
            >
              {staffOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-medium">
          <input
            type="checkbox"
            checked={outsideHours}
            onChange={(e) => {
              setOutsideHours(e.target.checked);
              setSlots(null);
              setSelected(null);
            }}
            className="size-5 accent-primary"
          />
          {ta("outsideHours")}
        </label>
        <p className="font-medium first-letter:uppercase">{formatDateLong(date, panel.locale)}</p>
        {!slots ? (
          <div className="grid grid-cols-4 gap-2" aria-hidden>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="h-11 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">{ta("noSlots")}</p>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {slots.map((s) => (
              <button
                key={s.startsAt}
                type="button"
                aria-pressed={selected === s.startsAt}
                onClick={() => setSelected(s.startsAt)}
                className={cn(
                  "h-11 rounded-lg border font-semibold tabular-nums",
                  selected === s.startsAt
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:border-primary hover:bg-accent",
                )}
              >
                {s.time}
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
