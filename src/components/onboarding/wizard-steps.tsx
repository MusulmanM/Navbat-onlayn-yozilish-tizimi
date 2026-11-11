"use client";

import { ArrowLeft, ExternalLink, Loader2, Plus, Printer, QrCode, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  BusinessForm,
  businessPayload,
  validateBusiness,
  type BusinessFormValues,
} from "@/components/onboarding/business-form";
import { CopyButton } from "@/components/panel/copy-button";
import { MoneyInput, inputClass, primaryButton, secondaryButton } from "@/components/panel/fields";
import { ScheduleEditor, scheduleErrors } from "@/components/panel/schedule-editor";
import { useAction } from "@/components/panel/use-action";
import type { Locale } from "@/config/locales";
import { useRouter } from "@/i18n/navigation";
import type { WeeklySchedule } from "@/lib/schedule";
import { cn } from "@/lib/utils";
import {
  onboardingBusinessAction,
  onboardingFinishAction,
  onboardingScheduleAction,
  onboardingServicesAction,
  onboardingSlugAction,
  onboardingStaffAction,
} from "@/server/actions/onboarding";

function Footer({
  step,
  pending,
  onNext,
  nextLabel,
}: {
  step: number;
  pending: boolean;
  onNext: () => void;
  nextLabel?: string;
}) {
  const t = useTranslations("Onboarding");
  const router = useRouter();
  return (
    <div className="sticky bottom-0 -mx-4 mt-6 flex gap-2 border-t bg-background/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
      {step > 1 && (
        <button
          type="button"
          onClick={() => router.push(`/onboarding?step=${step - 1}`)}
          className={secondaryButton}
          aria-label={t("back")}
        >
          <ArrowLeft className="size-5" aria-hidden />
          <span className="hidden sm:inline">{t("back")}</span>
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={pending}
        className={cn(primaryButton, "flex-1")}
      >
        {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
        {pending ? t("saving") : (nextLabel ?? t("next"))}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function BusinessStep({ initial, locale }: { initial: BusinessFormValues; locale: Locale }) {
  const router = useRouter();
  const { run, pending } = useAction();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const next = async () => {
    const found = validateBusiness(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    const ok = await run(() => onboardingBusinessAction(businessPayload(values)), {
      success: false,
      onError: (_code, fields) => {
        if (fields) setErrors(fields);
        return !!fields;
      },
    });
    if (ok) router.push("/onboarding?step=2");
  };
  return (
    <>
      <BusinessForm values={values} onChange={setValues} errors={errors} locale={locale} />
      <Footer step={1} pending={pending} onNext={next} />
    </>
  );
}

export function HoursStep({ initial, locale }: { initial: WeeklySchedule; locale: Locale }) {
  const router = useRouter();
  const { runOk, pending } = useAction();
  const [value, setValue] = useState(initial);
  const next = async () => {
    if (Object.keys(scheduleErrors(value)).length) return;
    const ok = await runOk(() => onboardingScheduleAction(value), { success: false });
    if (ok) router.push("/onboarding?step=3");
  };
  return (
    <>
      <ScheduleEditor value={value} onChange={setValue} locale={locale} />
      <Footer step={2} pending={pending} onNext={next} />
    </>
  );
}

export type ServiceDraft = {
  key: string;
  id?: string;
  nameUz: string;
  nameRu: string | null;
  durationMinutes: number;
  price: number;
  priceIsFrom: boolean;
};

export function ServicesStep({ initial }: { initial: ServiceDraft[] }) {
  const t = useTranslations("Onboarding");
  const router = useRouter();
  const { runOk, pending } = useAction();
  const [rows, setRows] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const update = (key: string, patch: Partial<ServiceDraft>) =>
    setRows((list) => list.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const invalid = (r: ServiceDraft) =>
    r.nameUz.trim().length < 2 ||
    r.durationMinutes < 5 ||
    r.durationMinutes > 480 ||
    r.durationMinutes % 5 !== 0;

  const next = async () => {
    if (rows.length === 0) return setError(t("needOneService"));
    if (rows.some(invalid)) return setError(null);
    setError(null);
    const ok = await runOk(
      () =>
        onboardingServicesAction({
          services: rows.map(({ id, nameUz, nameRu, durationMinutes, price, priceIsFrom }) => ({
            id,
            nameUz,
            nameRu,
            durationMinutes,
            price,
            priceIsFrom,
          })),
        }),
      { success: false },
    );
    if (ok) router.push("/onboarding?step=4");
  };

  return (
    <>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li
            key={row.key}
            className={cn(
              "rounded-2xl border bg-card p-3 sm:p-4",
              invalid(row) && "border-destructive/50",
            )}
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  aria-label={t("serviceName")}
                  placeholder={t("serviceName")}
                  value={row.nameUz}
                  maxLength={80}
                  onChange={(e) => update(row.key, { nameUz: e.target.value })}
                  aria-invalid={row.nameUz.trim().length < 2 || undefined}
                  className={cn(inputClass, "font-semibold")}
                />
                <input
                  aria-label={t("serviceNameRu")}
                  placeholder={t("serviceNameRu")}
                  value={row.nameRu ?? ""}
                  maxLength={80}
                  onChange={(e) => update(row.key, { nameRu: e.target.value || null })}
                  className={cn(inputClass, "h-10 text-sm")}
                />
              </div>
              <button
                type="button"
                onClick={() => setRows((list) => list.filter((r) => r.key !== row.key))}
                aria-label={`${t("remove")}: ${row.nameUz}`}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5">
                <input
                  type="number"
                  inputMode="numeric"
                  min={5}
                  max={480}
                  step={5}
                  value={row.durationMinutes}
                  onChange={(e) =>
                    update(row.key, { durationMinutes: Number(e.target.value) || 0 })
                  }
                  className={cn(inputClass, "w-24 tabular-nums")}
                  aria-label={t("minutesShort")}
                />
                <span className="text-sm text-muted-foreground">{t("minutesShort")}</span>
              </label>
              <label className="flex items-center gap-1.5">
                <MoneyInput
                  value={row.price}
                  onChange={(price) => update(row.key, { price })}
                  className="w-32"
                  label={t("priceShort")}
                />
                <span className="text-sm text-muted-foreground">{t("priceShort")}</span>
              </label>
              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={row.priceIsFrom}
                  onChange={(e) => update(row.key, { priceIsFrom: e.target.checked })}
                  className="size-5 accent-primary"
                />
                {t("fromShort")}
              </label>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() =>
          setRows((list) => [
            ...list,
            {
              key: crypto.randomUUID(),
              nameUz: "",
              nameRu: null,
              durationMinutes: 30,
              price: 0,
              priceIsFrom: false,
            },
          ])
        }
        className={cn(secondaryButton, "mt-3 w-full border-dashed")}
      >
        <Plus className="size-5" aria-hidden />
        {t("addService")}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-destructive">
          {error}
        </p>
      )}
      <Footer step={3} pending={pending} onNext={next} />
    </>
  );
}

export type StaffDraft = {
  key: string;
  id?: string;
  name: string;
  position: string;
  serviceIds: string[];
};

export function StaffStep({
  initial,
  services,
  maxStaff,
}: {
  initial: StaffDraft[];
  services: Array<{ id: string; name: string }>;
  maxStaff: number;
}) {
  const t = useTranslations("Onboarding");
  const ts = useTranslations("StaffPage");
  const router = useRouter();
  const { runOk, pending } = useAction();
  const [rows, setRows] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const update = (key: string, patch: Partial<StaffDraft>) =>
    setRows((list) => list.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const next = async () => {
    if (rows.length === 0) return setError(t("needOneStaff"));
    if (rows.some((r) => r.name.trim().length < 2)) return setError(ts("errors.name"));
    setError(null);
    const ok = await runOk(
      () =>
        onboardingStaffAction({
          staff: rows.map(({ id, name, position, serviceIds }) => ({
            id,
            name,
            position,
            serviceIds,
          })),
        }),
      { success: false },
    );
    if (ok) router.push("/onboarding?step=5");
  };

  return (
    <>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.key} className="rounded-2xl border bg-card p-3 sm:p-4">
            <div className="flex items-start gap-2">
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                <input
                  aria-label={ts("name")}
                  placeholder={ts("name")}
                  value={row.name}
                  maxLength={60}
                  onChange={(e) => update(row.key, { name: e.target.value })}
                  aria-invalid={row.name.trim().length < 2 || undefined}
                  className={cn(inputClass, "font-semibold")}
                />
                <input
                  aria-label={ts("position")}
                  placeholder={ts("positionPlaceholder")}
                  value={row.position}
                  maxLength={60}
                  onChange={(e) => update(row.key, { position: e.target.value })}
                  className={inputClass}
                />
              </div>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => setRows((list) => list.filter((r) => r.key !== row.key))}
                  aria-label={`${t("remove")}: ${row.name}`}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive"
                >
                  <X className="size-5" aria-hidden />
                </button>
              )}
            </div>
            <p className="mt-3 mb-1.5 text-sm font-medium">{ts("services")}</p>
            <div className="flex flex-wrap gap-2">
              {services.map((s) => {
                const on = row.serviceIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      update(row.key, {
                        serviceIds: on
                          ? row.serviceIds.filter((x) => x !== s.id)
                          : [...row.serviceIds, s.id],
                      })
                    }
                    className={cn(
                      "inline-flex min-h-10 items-center rounded-full border px-3 text-sm font-medium",
                      on
                        ? "border-primary bg-accent text-accent-foreground"
                        : "bg-background text-muted-foreground",
                    )}
                  >
                    {on ? "✓ " : ""}
                    {s.name}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
      {rows.length < maxStaff ? (
        <button
          type="button"
          onClick={() =>
            setRows((list) => [
              ...list,
              {
                key: crypto.randomUUID(),
                name: "",
                position: "",
                serviceIds: services.map((s) => s.id),
              },
            ])
          }
          className={cn(secondaryButton, "mt-3 w-full border-dashed")}
        >
          <Plus className="size-5" aria-hidden />
          {t("addStaff")}
        </button>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{ts("limit", { max: maxStaff })}</p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-destructive">
          {error}
        </p>
      )}
      <Footer step={4} pending={pending} onNext={next} />
    </>
  );
}

export function DoneStep({
  link,
  telegramLink,
  slug,
  pagePath,
}: {
  link: string;
  telegramLink: string | null;
  slug: string;
  pagePath: string;
}) {
  const t = useTranslations("Onboarding");
  const ts = useTranslations("Settings");
  const te = useTranslations("PanelErrors");
  const ta = useTranslations("Actions");
  const { run, runOk, pending } = useAction();
  const [slugValue, setSlugValue] = useState(slug);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [qrVersion, setQrVersion] = useState(0);

  const finish = async (publish: boolean) => {
    const ok = await runOk(() => onboardingFinishAction(publish), { success: false });
    if (ok) window.location.assign(pagePath.startsWith("/ru") ? "/ru/panel" : "/panel");
  };
  const saveSlug = async () => {
    setSlugError(null);
    const ok = await run(() => onboardingSlugAction(slugValue.trim().toLowerCase()), {
      onError: (code) => {
        setSlugError(te.has(code) ? te(code) : code);
        return true;
      },
    });
    if (ok) setQrVersion((v) => v + 1);
  };

  return (
    <div className="space-y-5">
      <p className="text-lg">{t("doneText")}</p>
      <section className="space-y-2 rounded-2xl border bg-card p-4">
        <p className="font-semibold">{t("yourLink")}</p>
        <p className="rounded-lg bg-muted px-3 py-2.5 font-mono text-sm break-all">{link}</p>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={link} variant="primary" />
          {telegramLink && <CopyButton text={telegramLink} label={ts("telegramLink")} />}
          <a href={pagePath} target="_blank" rel="noopener noreferrer" className={secondaryButton}>
            <ExternalLink className="size-4" aria-hidden />
            {ts("openPage")}
          </a>
        </div>
      </section>
      <section className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-start">
        {/* eslint-disable-next-line @next/next/no-img-element -- generated QR */}
        <img
          src={`/api/panel/qr?format=svg&v=${qrVersion}`}
          alt={ts("qr")}
          width={160}
          height={160}
          className="size-40 rounded-lg border"
        />
        <div className="flex w-full flex-col gap-2">
          <a href={`/api/panel/qr?format=png&v=${qrVersion}`} download className={secondaryButton}>
            <QrCode className="size-4" aria-hidden />
            {ts("downloadQr")}
          </a>
          <a
            href={`${pagePath.startsWith("/ru") ? "/ru" : ""}/panel/qr`}
            target="_blank"
            rel="noopener noreferrer"
            className={secondaryButton}
          >
            <Printer className="size-4" aria-hidden />
            {ts("printPoster")}
          </a>
        </div>
      </section>
      <details className="rounded-2xl border bg-card p-4">
        <summary className="min-h-11 cursor-pointer font-semibold">{ts("changeSlug")}</summary>
        <div className="mt-2 space-y-2">
          <div className="flex gap-2">
            <input
              aria-label={ts("slug")}
              value={slugValue}
              maxLength={40}
              onChange={(e) => setSlugValue(e.target.value)}
              className={cn(inputClass, "font-mono")}
            />
            <button type="button" onClick={saveSlug} disabled={pending} className={secondaryButton}>
              {ta("save")}
            </button>
          </div>
          <p className="text-sm text-muted-foreground">{ts("slugHint")}</p>
          {slugError && <p className="text-sm text-destructive">{slugError}</p>}
        </div>
      </details>
      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={() => finish(true)}
          disabled={pending}
          className={cn(primaryButton, "w-full")}
        >
          {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
          {t("publish")}
        </button>
        <button
          type="button"
          onClick={() => finish(false)}
          disabled={pending}
          className="inline-flex min-h-11 w-full items-center justify-center font-semibold text-muted-foreground hover:text-foreground"
        >
          {t("later")}
        </button>
      </div>
    </div>
  );
}
