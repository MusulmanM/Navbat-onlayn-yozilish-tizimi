"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import type { Locale } from "@/config/locales";
import type { DayInfo } from "@/components/booking/types";
import { weekdayOf, weekdayShort } from "@/lib/time";
import { cn } from "@/lib/utils";

/** Horizontal day strip: weekday + day number; days without slots are grey (spec 7.2). */
export function DateStrip({
  days,
  selected,
  onSelect,
  locale,
  today,
}: {
  days: DayInfo[];
  selected: string | null;
  onSelect: (date: string) => void;
  locale: Locale;
  today: string;
}) {
  const t = useTranslations("Booking");
  const tc = useTranslations("Common");
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [selected]);

  return (
    <div
      role="group"
      aria-label={t("chooseDate")}
      className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]"
    >
      {days.map((day, index) => {
        const isSelected = day.date === selected;
        const dayNumber = Number(day.date.slice(8, 10));
        const label =
          day.date === today
            ? tc("today")
            : index === 1 && day.date > today
              ? tc("tomorrow")
              : weekdayShort(weekdayOf(day.date), locale);
        return (
          <button
            key={day.date}
            ref={isSelected ? selectedRef : undefined}
            type="button"
            disabled={!day.hasSlots}
            aria-pressed={isSelected}
            aria-label={`${label} ${dayNumber}${day.hasSlots ? "" : `, ${t("dayNoSlots")}`}`}
            onClick={() => onSelect(day.date)}
            className={cn(
              "flex h-16 min-w-14 shrink-0 snap-start flex-col items-center justify-center rounded-xl border px-2 transition-colors",
              isSelected
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-background hover:border-primary/50",
              !day.hasSlots &&
                "cursor-not-allowed border-dashed bg-muted text-muted-foreground/60 hover:border-border",
            )}
          >
            <span className={cn("text-xs font-medium", !isSelected && "text-muted-foreground")}>
              {label}
            </span>
            <span className="text-lg leading-tight font-bold">{dayNumber}</span>
          </button>
        );
      })}
    </div>
  );
}

export function DateStripSkeleton() {
  return (
    <div className="-mx-4 flex gap-2 overflow-hidden px-4 pb-2" aria-hidden>
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className="h-16 w-14 shrink-0 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
