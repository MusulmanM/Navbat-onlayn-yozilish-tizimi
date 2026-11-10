"use client";

import { useTranslations } from "next-intl";
import type { SlotInfo } from "@/components/booking/types";
import { cn } from "@/lib/utils";

const GROUPS = [
  { key: "morning", from: "00:00", to: "12:00" },
  { key: "afternoon", from: "12:00", to: "17:00" },
  { key: "evening", from: "17:00", to: "24:01" },
] as const;

/** Times grouped into morning / afternoon / evening (spec 7.2). */
export function TimeGrid({
  slots,
  selected,
  onSelect,
}: {
  slots: SlotInfo[];
  selected: string | null;
  onSelect: (slot: SlotInfo) => void;
}) {
  const t = useTranslations("Booking");
  return (
    <div className="space-y-5">
      {GROUPS.map((group) => {
        const items = slots.filter((s) => s.time >= group.from && s.time < group.to);
        if (items.length === 0) return null;
        return (
          <section key={group.key} aria-label={t(group.key)}>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{t(group.key)}</h3>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {items.map((slot) => {
                const active = slot.startsAt === selected;
                return (
                  <button
                    key={slot.startsAt}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onSelect(slot)}
                    className={cn(
                      "h-11 rounded-lg border text-base font-semibold tabular-nums transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary hover:bg-accent",
                    )}
                  >
                    {slot.time}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function TimeGridSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <div className="h-4 w-20 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="h-11 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}
