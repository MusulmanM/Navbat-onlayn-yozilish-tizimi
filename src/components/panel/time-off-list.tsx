"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Field, inputClass, secondaryButton } from "@/components/panel/fields";
import { useAction } from "@/components/panel/use-action";
import { addTimeOffAction, deleteTimeOffAction } from "@/server/actions/catalog";

export type TimeOffItem = { id: string; label: string; reason: string | null };

/** Days off / holidays (TimeOff). staffId null = the whole business is closed. */
export function TimeOffList({
  staffId,
  items,
  today,
  emptyText,
  addLabel,
}: {
  staffId: string | null;
  items: TimeOffItem[];
  today: string;
  emptyText: string;
  addLabel: string;
}) {
  const t = useTranslations("StaffPage");
  const ta = useTranslations("Actions");
  const { run, pending } = useAction();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [reason, setReason] = useState("");

  const add = async () => {
    const ok = await run(() =>
      addTimeOffAction({ staffId, from, to: to < from ? from : to, reason: reason || null }),
    );
    if (ok) setReason("");
  };

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.label}</p>
                {item.reason && <p className="text-sm text-muted-foreground">{item.reason}</p>}
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => deleteTimeOffAction(item.id))}
                aria-label={ta("delete")}
                className="inline-flex size-11 items-center justify-center rounded-lg text-destructive hover:bg-destructive/5"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-3 rounded-xl bg-muted/50 p-3 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">
        <Field id={`to-from-${staffId ?? "all"}`} label={t("from")}>
          <input
            id={`to-from-${staffId ?? "all"}`}
            type="date"
            value={from}
            min={today}
            onChange={(e) => e.target.value && setFrom(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field id={`to-to-${staffId ?? "all"}`} label={t("to")}>
          <input
            id={`to-to-${staffId ?? "all"}`}
            type="date"
            value={to < from ? from : to}
            min={from}
            onChange={(e) => e.target.value && setTo(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field id={`to-reason-${staffId ?? "all"}`} label={t("reason")}>
          <input
            id={`to-reason-${staffId ?? "all"}`}
            value={reason}
            maxLength={100}
            placeholder={t("reasonPlaceholder")}
            onChange={(e) => setReason(e.target.value)}
            className={inputClass}
          />
        </Field>
        <button type="button" onClick={add} disabled={pending} className={secondaryButton}>
          <Plus className="size-4" aria-hidden />
          {addLabel}
        </button>
      </div>
    </div>
  );
}
