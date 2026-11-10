import { ChevronDown, Clock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/config/locales";
import { DAY_KEYS, type WeeklySchedule } from "@/lib/schedule";
import { weekdayName } from "@/lib/time";
import { cn } from "@/lib/utils";

/** Collapsible weekly schedule, today highlighted (spec 7.2). Pure HTML, no JS. */
export async function WeeklyHours({
  schedule,
  locale,
  todayWeekday,
}: {
  schedule: WeeklySchedule;
  locale: Locale;
  /** 0 = Sunday … 6 = Saturday in the business time zone. */
  todayWeekday: number;
}) {
  const t = await getTranslations("Business");
  return (
    <details className="group rounded-xl border bg-card">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 font-semibold [&::-webkit-details-marker]:hidden">
        <Clock className="size-5 text-primary" aria-hidden />
        <span className="flex-1">{t("workingHours")}</span>
        <ChevronDown className="size-5 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <ul className="border-t px-4 py-2">
        {DAY_KEYS.map((key, index) => {
          const weekday = (index + 1) % 7; // mon = 1 … sun = 0
          const day = schedule[key];
          const isToday = weekday === todayWeekday;
          return (
            <li
              key={key}
              className={cn(
                "flex items-baseline justify-between gap-3 py-1.5",
                isToday && "font-semibold text-primary",
              )}
            >
              <span className="capitalize">{weekdayName(weekday, locale)}</span>
              <span className="text-right">
                {day.open ? (
                  `${day.start}–${day.end}`
                ) : (
                  <span className="text-muted-foreground">{t("dayOff")}</span>
                )}
                {day.open && day.breaks.length > 0 && (
                  <span className="block text-xs font-normal text-muted-foreground">
                    {day.breaks
                      .map((b) => t("breakLabel", { from: b.start, to: b.end }))
                      .join(", ")}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
