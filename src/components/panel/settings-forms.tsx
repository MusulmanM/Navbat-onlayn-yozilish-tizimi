"use client";

import { Check, ExternalLink, Loader2, Printer, QrCode, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  BusinessForm,
  businessPayload,
  validateBusiness,
  type BusinessFormValues,
} from "@/components/onboarding/business-form";
import { CopyButton } from "@/components/panel/copy-button";
import {
  Field,
  Toggle,
  inputClass,
  primaryButton,
  secondaryButton,
  textareaClass,
} from "@/components/panel/fields";
import { ScheduleEditor, scheduleErrors } from "@/components/panel/schedule-editor";
import { useAction } from "@/components/panel/use-action";
import type { Locale } from "@/config/locales";
import { Link } from "@/i18n/navigation";
import type { WeeklySchedule } from "@/lib/schedule";
import { cn } from "@/lib/utils";
import {
  changeSlugAction,
  saveNotificationsAction,
  saveProfileAction,
  saveRulesAction,
  saveScheduleAction,
  setPublishedAction,
} from "@/server/actions/catalog";

function SaveButton({ pending, onClick }: { pending: boolean; onClick: () => void }) {
  const ta = useTranslations("Actions");
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={cn(primaryButton, "w-full sm:w-auto")}
    >
      {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
      {pending ? ta("saving") : ta("save")}
    </button>
  );
}

export type ProfileValues = BusinessFormValues & {
  mapUrl: string;
  instagram: string;
  telegramUsername: string;
  description: string;
};

export function ProfileForm({ initial, locale }: { initial: ProfileValues; locale: Locale }) {
  const t = useTranslations("Settings");
  const { run, pending } = useAction();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const err = (key: string) =>
    errors[key] ? (t.has(`errors.${key}`) ? t(`errors.${key}`) : t("errors.url")) : null;

  const save = async () => {
    const found = validateBusiness(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    await run(
      () =>
        saveProfileAction({
          ...businessPayload(values),
          mapUrl: values.mapUrl || null,
          instagram: values.instagram || null,
          telegramUsername: values.telegramUsername || null,
          description: values.description || null,
        }),
      {
        onError: (_code, fields) => {
          if (fields) setErrors(fields);
          return !!fields;
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <BusinessForm
        values={values}
        onChange={(v) => setValues({ ...values, ...v })}
        errors={errors}
        locale={locale}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="pf-map" label={t("mapUrl")} error={err("mapUrl")} className="sm:col-span-2">
          <input
            id="pf-map"
            type="url"
            inputMode="url"
            value={values.mapUrl}
            placeholder="https://maps.google.com/…"
            onChange={(e) => setValues({ ...values, mapUrl: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field id="pf-ig" label={t("instagram")} error={err("instagram")}>
          <input
            id="pf-ig"
            value={values.instagram}
            placeholder="@"
            onChange={(e) => setValues({ ...values, instagram: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field id="pf-tg" label={t("telegram")} error={err("telegramUsername")}>
          <input
            id="pf-tg"
            value={values.telegramUsername}
            placeholder="@"
            onChange={(e) => setValues({ ...values, telegramUsername: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field id="pf-desc" label={t("description")} className="sm:col-span-2">
          <textarea
            id="pf-desc"
            rows={3}
            maxLength={1000}
            value={values.description}
            onChange={(e) => setValues({ ...values, description: e.target.value })}
            className={textareaClass}
          />
        </Field>
      </div>
      <SaveButton pending={pending} onClick={save} />
    </div>
  );
}

export function HoursForm({ initial, locale }: { initial: WeeklySchedule; locale: Locale }) {
  const { run, pending } = useAction();
  const [value, setValue] = useState(initial);
  return (
    <div className="space-y-4">
      <ScheduleEditor value={value} onChange={setValue} locale={locale} />
      <SaveButton
        pending={pending}
        onClick={() => {
          if (Object.keys(scheduleErrors(value)).length === 0)
            void run(() => saveScheduleAction(value));
        }}
      />
    </div>
  );
}

export type RulesValues = {
  slotStepMinutes: 15 | 30 | 60;
  minLeadMinutes: number;
  maxDaysAhead: number;
  autoConfirm: boolean;
  cancelUntilHours: number;
};

const LEAD_OPTIONS = [0, 15, 30, 60, 120, 180, 360, 720, 1440];
const DAYS_OPTIONS = [7, 14, 21, 30, 60, 90, 180];
const CANCEL_OPTIONS = [0, 1, 2, 3, 6, 12, 24, 48];

export function RulesForm({ initial }: { initial: RulesValues }) {
  const t = useTranslations("Settings");
  const { run, pending } = useAction();
  const [values, setValues] = useState(initial);
  const minutesLabel = (m: number) =>
    m === 0
      ? t("noLimit")
      : m % 60 === 0
        ? t("hours", { count: m / 60 })
        : t("minutes", { count: m });
  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-1 font-medium">{t("slotStep")}</legend>
        <p className="mb-2 text-sm text-muted-foreground">{t("slotStepHint")}</p>
        <div className="grid grid-cols-3 gap-2">
          {([15, 30, 60] as const).map((step) => (
            <label
              key={step}
              className={cn(
                "flex min-h-11 cursor-pointer items-center justify-center rounded-xl border font-semibold",
                values.slotStepMinutes === step &&
                  "border-primary bg-accent text-accent-foreground",
              )}
            >
              <input
                type="radio"
                name="slot-step"
                className="sr-only"
                checked={values.slotStepMinutes === step}
                onChange={() => setValues({ ...values, slotStepMinutes: step })}
              />
              {t("minutes", { count: step })}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="rl-lead" label={t("minLead")}>
          <select
            id="rl-lead"
            value={values.minLeadMinutes}
            onChange={(e) => setValues({ ...values, minLeadMinutes: Number(e.target.value) })}
            className={inputClass}
          >
            {LEAD_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {minutesLabel(m)}
              </option>
            ))}
          </select>
        </Field>
        <Field id="rl-days" label={t("maxDays")}>
          <select
            id="rl-days"
            value={values.maxDaysAhead}
            onChange={(e) => setValues({ ...values, maxDaysAhead: Number(e.target.value) })}
            className={inputClass}
          >
            {DAYS_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {t("days", { count: d })}
              </option>
            ))}
          </select>
        </Field>
        <Field id="rl-cancel" label={t("cancelUntil")}>
          <select
            id="rl-cancel"
            value={values.cancelUntilHours}
            onChange={(e) => setValues({ ...values, cancelUntilHours: Number(e.target.value) })}
            className={inputClass}
          >
            {CANCEL_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {h === 0 ? t("noLimit") : t("hours", { count: h })}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="rounded-xl border px-4 py-1">
        <Toggle
          checked={values.autoConfirm}
          onChange={(autoConfirm) => setValues({ ...values, autoConfirm })}
          label={t("autoConfirm")}
          hint={t("autoConfirmHint")}
        />
      </div>
      <SaveButton pending={pending} onClick={() => run(() => saveRulesAction(values))} />
    </div>
  );
}

export function NotificationsForm({
  initial,
}: {
  initial: { reminder24h: boolean; reminder2h: boolean; ownerNotify: boolean };
}) {
  const t = useTranslations("Settings");
  const { run, pending } = useAction();
  const [values, setValues] = useState(initial);
  return (
    <div className="space-y-4">
      <div className="divide-y rounded-xl border px-4">
        <Toggle
          checked={values.reminder24h}
          onChange={(reminder24h) => setValues({ ...values, reminder24h })}
          label={t("reminder24h")}
        />
        <Toggle
          checked={values.reminder2h}
          onChange={(reminder2h) => setValues({ ...values, reminder2h })}
          label={t("reminder2h")}
        />
        <Toggle
          checked={values.ownerNotify}
          onChange={(ownerNotify) => setValues({ ...values, ownerNotify })}
          label={t("ownerNotify")}
        />
      </div>
      <p className="text-sm text-muted-foreground">{t("remindersHint")}</p>
      <SaveButton pending={pending} onClick={() => run(() => saveNotificationsAction(values))} />
    </div>
  );
}

export function LinkSettings({
  webLink,
  telegramLink,
  pagePath,
  slug,
  published,
  hasService,
  hasStaff,
}: {
  webLink: string;
  telegramLink: string | null;
  pagePath: string;
  slug: string;
  published: boolean;
  hasService: boolean;
  hasStaff: boolean;
}) {
  const t = useTranslations("Settings");
  const ta = useTranslations("Actions");
  const te = useTranslations("PanelErrors");
  const { run, pending } = useAction();
  const [slugValue, setSlugValue] = useState(slug);
  const [slugError, setSlugError] = useState<string | null>(null);
  const canPublish = hasService && hasStaff;

  return (
    <div className="space-y-5">
      <section
        className={cn(
          "rounded-2xl border p-4",
          published ? "border-success/40 bg-success/5" : "border-pending/50 bg-pending/10",
        )}
      >
        <p className="font-semibold">{published ? t("published") : t("unpublished")}</p>
        {!published && (
          <ul className="mt-2 space-y-1 text-sm">
            {[
              { ok: hasService, text: t("needService"), href: "/panel/xizmatlar" },
              { ok: hasStaff, text: t("needStaff"), href: "/panel/ustalar" },
            ].map((r) => (
              <li key={r.text} className="flex items-center gap-2">
                {r.ok ? (
                  <Check className="size-4 text-success" aria-hidden />
                ) : (
                  <X className="size-4 text-destructive" aria-hidden />
                )}
                {r.ok ? (
                  r.text
                ) : (
                  <Link href={r.href} className="underline">
                    {r.text}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          disabled={pending || (!published && !canPublish)}
          onClick={() => run(() => setPublishedAction(!published))}
          className={cn(published ? secondaryButton : primaryButton, "mt-3")}
        >
          {published ? t("unpublish") : t("publish")}
        </button>
      </section>

      <section className="space-y-2">
        <p className="font-semibold">{t("webLink")}</p>
        <p className="rounded-lg bg-muted px-3 py-2.5 font-mono text-sm break-all">{webLink}</p>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={webLink} variant="primary" />
          <a href={pagePath} target="_blank" rel="noopener noreferrer" className={secondaryButton}>
            <ExternalLink className="size-4" aria-hidden />
            {t("openPage")}
          </a>
        </div>
      </section>
      <section className="space-y-2">
        <p className="font-semibold">{t("telegramLink")}</p>
        {telegramLink ? (
          <>
            <p className="rounded-lg bg-muted px-3 py-2.5 font-mono text-sm break-all">
              {telegramLink}
            </p>
            <CopyButton text={telegramLink} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t("noBot")}</p>
        )}
      </section>

      <section className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-start">
        {/* eslint-disable-next-line @next/next/no-img-element -- generated QR */}
        <img
          src={`/api/panel/qr?format=svg&s=${slug}`}
          alt={t("qr")}
          width={160}
          height={160}
          className="size-40 rounded-lg border"
        />
        <div className="flex w-full flex-col gap-2">
          <a href={`/api/panel/qr?format=png&s=${slug}`} download className={secondaryButton}>
            <QrCode className="size-4" aria-hidden />
            {t("downloadQr")}
          </a>
          <Link href="/panel/qr" className={secondaryButton}>
            <Printer className="size-4" aria-hidden />
            {t("printPoster")}
          </Link>
        </div>
      </section>

      <section className="space-y-2">
        <Field id="ls-slug" label={t("slug")} hint={t("slugHint")} error={slugError}>
          <div className="flex gap-2">
            <input
              id="ls-slug"
              value={slugValue}
              maxLength={40}
              onChange={(e) => setSlugValue(e.target.value)}
              className={cn(inputClass, "font-mono")}
            />
            <button
              type="button"
              disabled={pending || slugValue === slug}
              onClick={async () => {
                setSlugError(null);
                await run(() => changeSlugAction(slugValue.trim().toLowerCase()), {
                  onError: (code) => {
                    setSlugError(te.has(code) ? te(code) : ta("error"));
                    return true;
                  },
                });
              }}
              className={secondaryButton}
            >
              {ta("save")}
            </button>
          </div>
        </Field>
        <p className="text-sm text-pending-foreground">{t("slugWarning")}</p>
      </section>
    </div>
  );
}
