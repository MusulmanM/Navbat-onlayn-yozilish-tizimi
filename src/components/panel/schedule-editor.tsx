"use client";

import { Copy, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Toggle } from "@/components/panel/fields";
import type { Locale } from "@/config/locales";
import {
  DAY_KEYS,
  MAX_BREAKS,
  weeklyScheduleSchema,
  type DayKey,
  type DaySchedule,
  type WeeklySchedule,
} from "@/lib/schedule";
import { formatMinutes, weekdayName } from "@/lib/time";
import { cn } from "@/lib/utils";

const STEP = 15;
const START_OPTIONS = Array.from({ length: (24 * 60) / STEP }, (_, i) => formatMinutes(i * STEP));
const END_OPTIONS = [...START_OPTIONS.slice(1), "24:00"];
const WEEKDAY_OF: Record<DayKey, number> = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sun: 0,
};

/** First error code per day ("START_AFTER_END", …) or an empty object when valid. */
export function scheduleErrors(value: WeeklySchedule): Partial<Record<DayKey, string>> {
  const result = weeklyScheduleSchema.safeParse(value);
  if (result.success) return {};
  const errors: Partial<Record<DayKey, string>> = {};
  for (const issue of result.error.issues) {
    const day = issue.path[0] as DayKey;
    errors[day] ??= issue.message;
  }
  return errors;
}

function TimeSelect({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  label: string;
}) {
  const list = options.includes(value) ? options : [value, ...options];
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 rounded-lg border border-input bg-background px-2 text-base tabular-nums"
    >
      {list.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

/** Weekly schedule editor (spec 7.5 step 2, settings, staff). */
export function ScheduleEditor({
  value,
  onChange,
  locale,
}: {
  value: WeeklySchedule;
  onChange: (next: WeeklySchedule) => void;
  locale: Locale;
}) {
  const t = useTranslations("Schedule");
  const errors = scheduleErrors(value);

  const setDay = (key: DayKey, day: DaySchedule) => onChange({ ...value, [key]: day });
  const copyToAll = (key: DayKey) => {
    const source = value[key];
    const next = { ...value };
    for (const other of DAY_KEYS) {
      next[other] = {
        ...next[other],
        start: source.start,
        end: source.end,
        breaks: source.breaks.map((b) => ({ ...b })),
      };
    }
    onChange(next);
    toast.success(t("copied"));
  };

  return (
    <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
      {DAY_KEYS.map((key) => {
        const day = value[key];
        const name = weekdayName(WEEKDAY_OF[key], locale);
        const error = errors[key];
        return (
          <li key={key} className={cn("p-3 sm:p-4", !day.open && "bg-muted/40")}>
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <Toggle
                  checked={day.open}
                  onChange={(open) => setDay(key, { ...day, open })}
                  label={<span className="capitalize">{name}</span>}
                  hint={day.open ? undefined : t("closed")}
                />
              </div>
              {day.open && (
                <button
                  type="button"
                  onClick={() => copyToAll(key)}
                  title={t("copyToAll")}
                  aria-label={`${t("copyToAll")} (${name})`}
                  className="inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Copy className="size-4" aria-hidden />
                </button>
              )}
            </div>
            {day.open && (
              <div className="mt-2 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <TimeSelect
                    value={day.start}
                    options={START_OPTIONS}
                    label={`${name}: ${t("from")}`}
                    onChange={(start) => setDay(key, { ...day, start })}
                  />
                  <span aria-hidden>–</span>
                  <TimeSelect
                    value={day.end}
                    options={END_OPTIONS}
                    label={`${name}: ${t("to")}`}
                    onChange={(end) => setDay(key, { ...day, end })}
                  />
                </div>
                {day.breaks.map((b, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-2 pl-1 text-sm">
                    <span className="w-20 text-muted-foreground">{t("break")}</span>
                    <TimeSelect
                      value={b.start}
                      options={START_OPTIONS}
                      label={`${name}: ${t("break")} ${t("from")}`}
                      onChange={(start) =>
                        setDay(key, {
                          ...day,
                          breaks: day.breaks.map((x, i) => (i === index ? { ...x, start } : x)),
                        })
                      }
                    />
                    <span aria-hidden>–</span>
                    <TimeSelect
                      value={b.end}
                      options={END_OPTIONS}
                      label={`${name}: ${t("break")} ${t("to")}`}
                      onChange={(end) =>
                        setDay(key, {
                          ...day,
                          breaks: day.breaks.map((x, i) => (i === index ? { ...x, end } : x)),
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDay(key, { ...day, breaks: day.breaks.filter((_, i) => i !== index) })
                      }
                      aria-label={t("removeBreak")}
                      className="inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </div>
                ))}
                {day.breaks.length < MAX_BREAKS && (
                  <button
                    type="button"
                    onClick={() =>
                      setDay(key, {
                        ...day,
                        breaks: [...day.breaks, { start: "13:00", end: "14:00" }].sort((a, b) =>
                          a.start.localeCompare(b.start),
                        ),
                      })
                    }
                    className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary"
                  >
                    <Plus className="size-4" aria-hidden />
                    {t("addBreak")}
                  </button>
                )}
                {error && (
                  <p className="text-sm text-destructive">
                    {t.has(`errors.${error}`) ? t(`errors.${error}`) : t("errors.invalid")}
                  </p>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
