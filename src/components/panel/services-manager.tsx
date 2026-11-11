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
import { EmptyState } from "@/components/panel/page-header";
import {
  Field,
  MoneyInput,
  Toggle,
  inputClass,
  primaryButton,
  textareaClass,
} from "@/components/panel/fields";
import { Modal } from "@/components/panel/modal";
import { useAction } from "@/components/panel/use-action";
import { cn } from "@/lib/utils";
import {
  deleteServiceAction,
  moveServiceAction,
  saveServiceAction,
  setServiceActiveAction,
} from "@/server/actions/catalog";

export type ServiceItem = {
  id: string;
  nameUz: string;
  nameRu: string | null;
  descriptionUz: string | null;
  descriptionRu: string | null;
  durationMinutes: number;
  bufferMinutes: number;
  price: number;
  priceIsFrom: boolean;
  isActive: boolean;
  staffIds: string[];
  priceLabel: string;
  durationLabel: string;
  bookingsCount: number;
};

type Draft = Omit<ServiceItem, "priceLabel" | "durationLabel" | "bookingsCount" | "id"> & {
  id?: string;
};

const BUFFERS = [0, 5, 10, 15, 20, 30, 45, 60];

export function ServicesManager({
  services,
  staff,
  locale,
}: {
  services: ServiceItem[];
  staff: Array<{ id: string; name: string }>;
  locale: "uz" | "ru";
}) {
  const t = useTranslations("Services");
  const ta = useTranslations("Actions");
  const { run, pending } = useAction();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const active = services.filter((s) => s.isActive);
  const archived = services.filter((s) => !s.isActive);

  const openNew = () => {
    setErrors({});
    setDraft({
      nameUz: "",
      nameRu: null,
      descriptionUz: null,
      descriptionRu: null,
      durationMinutes: 30,
      bufferMinutes: 0,
      price: 0,
      priceIsFrom: false,
      isActive: true,
      staffIds: staff.map((s) => s.id),
    });
  };
  const openEdit = (s: ServiceItem) => {
    setErrors({});
    setDraft({ ...s });
  };

  const save = async () => {
    if (!draft) return;
    const found: Record<string, string> = {};
    if (draft.nameUz.trim().length < 2) found.nameUz = t("errors.nameUz");
    if (draft.durationMinutes < 5 || draft.durationMinutes > 480 || draft.durationMinutes % 5 !== 0)
      found.duration = t("errors.duration");
    setErrors(found);
    if (Object.keys(found).length) return;
    const ok = await run(() => saveServiceAction(draft), {
      onError: (_code, fields) => {
        if (!fields) return false;
        setErrors(
          Object.fromEntries(
            Object.keys(fields).map((k) => [
              k === "durationMinutes" ? "duration" : k,
              t.has(`errors.${k}`) ? t(`errors.${k}`) : t("errors.duration"),
            ]),
          ),
        );
        return true;
      },
    });
    if (ok) setDraft(null);
  };

  const row = (s: ServiceItem, index: number, list: ServiceItem[]) => (
    <li key={s.id} className="flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{locale === "ru" ? (s.nameRu ?? s.nameUz) : s.nameUz}</p>
        <p className="text-sm text-muted-foreground">
          {s.durationLabel} · <span className="font-medium text-foreground">{s.priceLabel}</span>
          {s.bufferMinutes > 0 && ` · +${t("minutes", { count: s.bufferMinutes })}`}
        </p>
        {s.isActive && s.staffIds.length === 0 && (
          <p className="mt-1 text-sm text-destructive">{t("noStaffWarning")}</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        {s.isActive && (
          <>
            <button
              type="button"
              disabled={pending || index === 0}
              onClick={() => run(() => moveServiceAction(s.id, "up"), { success: false })}
              aria-label={ta("moveUp")}
              className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-30"
            >
              <ArrowUp className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              disabled={pending || index === list.length - 1}
              onClick={() => run(() => moveServiceAction(s.id, "down"), { success: false })}
              aria-label={ta("moveDown")}
              className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-30"
            >
              <ArrowDown className="size-4" aria-hidden />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => openEdit(s)}
          aria-label={ta("edit")}
          className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-muted"
        >
          <Pencil className="size-4" aria-hidden />
        </button>
        {s.isActive ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => setServiceActiveAction(s.id, false))}
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
              onClick={() => run(() => setServiceActiveAction(s.id, true))}
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
                  window.confirm(t("deleteConfirm")) && run(() => deleteServiceAction(s.id))
                }
                aria-label={ta("delete")}
                title={ta("delete")}
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
      <div className="flex justify-end">
        <button type="button" onClick={openNew} className={primaryButton}>
          <Plus className="size-5" aria-hidden />
          {t("add")}
        </button>
      </div>
      {active.length === 0 ? (
        <EmptyState icon="✂️" title={t("empty")} text={t("emptyText")} />
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="sv-name-uz" label={t("nameUz")} error={errors.nameUz}>
              <input
                id="sv-name-uz"
                value={draft.nameUz}
                maxLength={80}
                onChange={(e) => setDraft({ ...draft, nameUz: e.target.value })}
                aria-invalid={!!errors.nameUz || undefined}
                className={inputClass}
              />
            </Field>
            <Field id="sv-name-ru" label={t("nameRu")}>
              <input
                id="sv-name-ru"
                value={draft.nameRu ?? ""}
                maxLength={80}
                onChange={(e) => setDraft({ ...draft, nameRu: e.target.value || null })}
                className={inputClass}
              />
            </Field>
            <Field id="sv-duration" label={t("duration")} error={errors.duration}>
              <input
                id="sv-duration"
                type="number"
                inputMode="numeric"
                min={5}
                max={480}
                step={5}
                value={draft.durationMinutes}
                onChange={(e) =>
                  setDraft({ ...draft, durationMinutes: Number(e.target.value) || 0 })
                }
                aria-invalid={!!errors.duration || undefined}
                className={inputClass}
              />
            </Field>
            <Field id="sv-buffer" label={t("buffer")} hint={t("bufferHint")}>
              <select
                id="sv-buffer"
                value={draft.bufferMinutes}
                onChange={(e) => setDraft({ ...draft, bufferMinutes: Number(e.target.value) })}
                className={inputClass}
              >
                {BUFFERS.map((b) => (
                  <option key={b} value={b}>
                    {t("minutes", { count: b })}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="sv-price" label={t("price")} hint={t("priceHint")} error={errors.price}>
              <MoneyInput
                id="sv-price"
                value={draft.price}
                onChange={(price) => setDraft({ ...draft, price })}
              />
            </Field>
            <label className="flex min-h-11 cursor-pointer items-center gap-2.5 self-end font-medium">
              <input
                type="checkbox"
                checked={draft.priceIsFrom}
                onChange={(e) => setDraft({ ...draft, priceIsFrom: e.target.checked })}
                className="size-5 accent-primary"
              />
              {t("priceIsFrom")}
            </label>
            <Field id="sv-desc-uz" label={t("descriptionUz")} className="sm:col-span-2">
              <textarea
                id="sv-desc-uz"
                rows={2}
                maxLength={500}
                value={draft.descriptionUz ?? ""}
                onChange={(e) => setDraft({ ...draft, descriptionUz: e.target.value || null })}
                className={textareaClass}
              />
            </Field>
            <Field id="sv-desc-ru" label={t("descriptionRu")} className="sm:col-span-2">
              <textarea
                id="sv-desc-ru"
                rows={2}
                maxLength={500}
                value={draft.descriptionRu ?? ""}
                onChange={(e) => setDraft({ ...draft, descriptionRu: e.target.value || null })}
                className={textareaClass}
              />
            </Field>
            <fieldset className="sm:col-span-2">
              <legend className="mb-1.5 font-medium">{t("staff")}</legend>
              <div className="flex flex-wrap gap-2">
                {staff.map((s) => {
                  const on = draft.staffIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          staffIds: on
                            ? draft.staffIds.filter((x) => x !== s.id)
                            : [...draft.staffIds, s.id],
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
              {draft.staffIds.length === 0 && (
                <p className="mt-1 text-sm text-destructive">{t("noStaffWarning")}</p>
              )}
            </fieldset>
            <div className="sm:col-span-2">
              <Toggle
                checked={draft.isActive}
                onChange={(isActive) => setDraft({ ...draft, isActive })}
                label={t("active")}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
