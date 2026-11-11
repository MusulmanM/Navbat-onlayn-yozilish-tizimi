"use client";

import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { InitialAvatar } from "@/components/common/initial-avatar";
import { Field, Toggle, inputClass, primaryButton } from "@/components/panel/fields";
import { Modal } from "@/components/panel/modal";
import { EmptyState } from "@/components/panel/page-header";
import { ScheduleEditor, scheduleErrors } from "@/components/panel/schedule-editor";
import { TimeOffList, type TimeOffItem } from "@/components/panel/time-off-list";
import { useAction } from "@/components/panel/use-action";
import type { Locale } from "@/config/locales";
import { Link } from "@/i18n/navigation";
import type { WeeklySchedule } from "@/lib/schedule";
import { cn } from "@/lib/utils";
import {
  deleteStaffAction,
  moveStaffAction,
  saveStaffAction,
  setStaffActiveAction,
} from "@/server/actions/catalog";

export type StaffItem = {
  id: string;
  name: string;
  position: string | null;
  isActive: boolean;
  serviceIds: string[];
  weeklySchedule: WeeklySchedule | null;
  bookingsCount: number;
  timeOffs: TimeOffItem[];
};

type Draft = {
  id?: string;
  name: string;
  position: string;
  isActive: boolean;
  serviceIds: string[];
  weeklySchedule: WeeklySchedule | null;
};

export function StaffManager({
  staff,
  services,
  businessSchedule,
  maxStaff,
  locale,
  today,
}: {
  staff: StaffItem[];
  services: Array<{ id: string; name: string }>;
  businessSchedule: WeeklySchedule;
  maxStaff: number;
  locale: Locale;
  today: string;
}) {
  const t = useTranslations("StaffPage");
  const ta = useTranslations("Actions");
  const { run, pending } = useAction();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const active = staff.filter((s) => s.isActive);
  const archived = staff.filter((s) => !s.isActive);
  const atLimit = active.length >= maxStaff;
  const editing = draft?.id ? staff.find((s) => s.id === draft.id) : null;

  const save = async () => {
    if (!draft) return;
    if (draft.name.trim().length < 2) return setError(t("errors.name"));
    if (draft.weeklySchedule && Object.keys(scheduleErrors(draft.weeklySchedule)).length) return;
    setError(null);
    const ok = await run(() => saveStaffAction(draft));
    if (ok) setDraft(null);
  };

  const row = (s: StaffItem, index: number, list: StaffItem[]) => (
    <li key={s.id} className="flex flex-wrap items-center gap-3 p-4">
      <InitialAvatar name={s.name} className="size-11 rounded-xl text-base" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{s.name}</p>
        <p className="text-sm text-muted-foreground">
          {[s.position, s.weeklySchedule ? t("ownSchedule") : t("sameAsBusiness")]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {s.isActive && (
          <>
            <button
              type="button"
              disabled={pending || index === 0}
              onClick={() => run(() => moveStaffAction(s.id, "up"), { success: false })}
              aria-label={ta("moveUp")}
              className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-30"
            >
              <ArrowUp className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              disabled={pending || index === list.length - 1}
              onClick={() => run(() => moveStaffAction(s.id, "down"), { success: false })}
              aria-label={ta("moveDown")}
              className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-30"
            >
              <ArrowDown className="size-4" aria-hidden />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() =>
            setDraft({
              id: s.id,
              name: s.name,
              position: s.position ?? "",
              isActive: s.isActive,
              serviceIds: s.serviceIds,
              weeklySchedule: s.weeklySchedule,
            })
          }
          aria-label={ta("edit")}
          className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-muted"
        >
          <Pencil className="size-4" aria-hidden />
        </button>
        {s.isActive ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => setStaffActiveAction(s.id, false))}
            aria-label={ta("archive")}
            title={ta("archive")}
            className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-muted"
          >
            <Archive className="size-4" aria-hidden />
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => setStaffActiveAction(s.id, true))}
              aria-label={ta("restore")}
              title={ta("restore")}
              className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-muted"
            >
              <ArchiveRestore className="size-4" aria-hidden />
            </button>
            {s.bookingsCount === 0 && (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  window.confirm(t("deleteConfirm")) && run(() => deleteStaffAction(s.id))
                }
                aria-label={ta("delete")}
                className="inline-flex size-11 items-center justify-center rounded-lg text-destructive hover:bg-destructive/5"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            )}
          </>
        )}
      </div>
    </li>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-3">
        {atLimit && (
          <p className="flex-1 text-sm text-muted-foreground">
            {t("limit", { max: maxStaff })}{" "}
            <Link href="/panel/obuna" className="font-semibold text-primary underline">
              {t("limitAction")}
            </Link>
            {maxStaff >= 5 && <> · {t("contactUs")}</>}
          </p>
        )}
        <button
          type="button"
          disabled={atLimit}
          onClick={() => {
            setError(null);
            setDraft({
              name: "",
              position: "",
              isActive: true,
              serviceIds: services.map((s) => s.id),
              weeklySchedule: null,
            });
          }}
          className={primaryButton}
        >
          <Plus className="size-5" aria-hidden />
          {t("add")}
        </button>
      </div>
      {active.length === 0 ? (
        <EmptyState icon="👤" title={t("empty")} text={t("emptyText")} />
      ) : (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
          {active.map((s, i) => row(s, i, active))}
        </ul>
      )}
      {archived.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold text-muted-foreground">{t("archivedTitle")}</h2>
          <ul className="divide-y overflow-hidden rounded-2xl border bg-card opacity-80">
            {archived.map((s, i) => row(s, i, archived))}
          </ul>
        </section>
      )}

      {draft && (
        <Modal
          open={!!draft}
          onOpenChange={(open) => !open && setDraft(null)}
          title={draft.id ? t("edit") : t("add")}
          size="lg"
          footer={
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className={cn(primaryButton, "w-full")}
            >
              {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
              {ta("save")}
            </button>
          }
        >
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="st-name" label={t("name")} error={error}>
                <input
                  id="st-name"
                  value={draft.name}
                  maxLength={60}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  aria-invalid={!!error || undefined}
                  className={inputClass}
                />
              </Field>
              <Field id="st-position" label={t("position")}>
                <input
                  id="st-position"
                  value={draft.position}
                  maxLength={60}
                  placeholder={t("positionPlaceholder")}
                  onChange={(e) => setDraft({ ...draft, position: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
            <fieldset>
              <legend className="mb-1.5 font-medium">{t("services")}</legend>
              <div className="flex flex-wrap gap-2">
                {services.map((s) => {
                  const on = draft.serviceIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          serviceIds: on
                            ? draft.serviceIds.filter((x) => x !== s.id)
                            : [...draft.serviceIds, s.id],
                        })
                      }
                      className={cn(
                        "inline-flex min-h-10 items-center rounded-full border px-3 text-sm font-medium",
                        on
                          ? "border-primary bg-accent text-accent-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {on ? "✓ " : ""}
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <fieldset className="space-y-3">
              <legend className="mb-1.5 font-medium">{t("schedule")}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { own: false, label: t("sameAsBusiness") },
                  { own: true, label: t("ownSchedule") },
                ].map((option) => (
                  <label
                    key={String(option.own)}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border px-3",
                      !!draft.weeklySchedule === option.own && "border-primary bg-accent/50",
                    )}
                  >
                    <input
                      type="radio"
                      name="schedule-mode"
                      checked={!!draft.weeklySchedule === option.own}
                      onChange={() =>
                        setDraft({
                          ...draft,
                          weeklySchedule: option.own
                            ? (draft.weeklySchedule ?? structuredClone(businessSchedule))
                            : null,
                        })
                      }
                      className="size-5 accent-primary"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              {draft.weeklySchedule && (
                <ScheduleEditor
                  value={draft.weeklySchedule}
                  onChange={(weeklySchedule) => setDraft({ ...draft, weeklySchedule })}
                  locale={locale}
                />
              )}
            </fieldset>
            <Toggle
              checked={draft.isActive}
              onChange={(isActive) => setDraft({ ...draft, isActive })}
              label={t("active")}
            />
            <section>
              <h3 className="mb-2 font-medium">{t("timeOff")}</h3>
              {editing ? (
                <TimeOffList
                  staffId={editing.id}
                  items={editing.timeOffs}
                  today={today}
                  emptyText={t("timeOffEmpty")}
                  addLabel={t("addTimeOff")}
                />
              ) : (
                <p className="text-sm text-muted-foreground">{t("saveFirst")}</p>
              )}
            </section>
          </div>
        </Modal>
      )}
    </div>
  );
}
