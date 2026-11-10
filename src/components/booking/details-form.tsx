"use client";

import { Loader2, MessageSquarePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, type ReactNode } from "react";
import type { Locale } from "@/config/locales";
import { apiRequest } from "@/components/booking/api";
import type { ApiFailure, BookingResult, SlotInfo } from "@/components/booking/types";
import { PhoneInput } from "@/components/common/phone-input";
import { cn } from "@/lib/utils";

export type DetailsValues = { name: string; phone: string; comment: string; consent: boolean };
type FieldErrors = Partial<Record<"name" | "phone" | "consent" | "comment", string>>;

/** Step 5: name, phone, optional comment, consent (spec 7.2). */
export function DetailsForm({
  slug,
  locale,
  values,
  onChange,
  serviceId,
  staffId,
  slot,
  tgInitData,
  summary,
  errorText,
  onBooked,
  onSlotTaken,
  setNotice,
}: {
  slug: string;
  locale: Locale;
  values: DetailsValues;
  onChange: (values: DetailsValues) => void;
  serviceId: string;
  staffId: string;
  slot: SlotInfo;
  tgInitData?: string;
  summary: ReactNode;
  errorText: (error: ApiFailure) => string;
  onBooked: (result: BookingResult, values: DetailsValues) => void;
  onSlotTaken: () => void;
  setNotice: (text: string | null) => void;
}) {
  const t = useTranslations("Booking");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [showComment, setShowComment] = useState(values.comment.length > 0);
  const [website, setWebsite] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof DetailsValues>(key: K, value: DetailsValues[K]) => {
    onChange({ ...values, [key]: value });
    if (errors[key as keyof FieldErrors]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (values.name.replace(/\s+/g, " ").trim().length < 2) next.name = t("fieldErrors.name");
    if (values.phone.length !== 9) next.phone = t("fieldErrors.phone");
    if (!values.consent) next.consent = t("fieldErrors.consent");
    if (values.comment.length > 300) next.comment = t("fieldErrors.comment");
    return next;
  };

  const focusFirst = (found: FieldErrors) => {
    if (found.name) nameRef.current?.focus();
    else if (found.phone) phoneRef.current?.focus();
    else if (found.consent) consentRef.current?.focus();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const found = validate();
    setErrors(found);
    if (Object.values(found).some(Boolean)) {
      focusFirst(found);
      return;
    }
    setSubmitting(true);
    setNotice(null);
    const res = await apiRequest<BookingResult>(`/api/public/${slug}/bookings`, {
      method: "POST",
      json: {
        serviceId,
        staffId,
        startsAt: slot.startsAt,
        name: values.name,
        phone: `+998${values.phone}`,
        comment: values.comment || undefined,
        consent: values.consent,
        website,
        tgInitData,
      },
    });
    setSubmitting(false);
    if (res.ok) {
      onBooked(res.data, values);
      return;
    }
    if (res.error.code === "SLOT_TAKEN") {
      onSlotTaken();
      return;
    }
    if (res.error.code === "VALIDATION_ERROR" && res.error.fields) {
      const mapped: FieldErrors = {};
      for (const key of ["name", "phone", "consent", "comment"] as const) {
        if (res.error.fields[key]) mapped[key] = t(`fieldErrors.${key}`);
      }
      if (Object.keys(mapped).length > 0) {
        setErrors(mapped);
        focusFirst(mapped);
        return;
      }
    }
    setNotice(errorText(res.error));
  };

  const fieldError = (key: keyof FieldErrors, id: string) =>
    errors[key] ? (
      <p id={id} className="mt-1.5 text-sm text-destructive">
        {errors[key]}
      </p>
    ) : null;

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col" lang={locale}>
      <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain p-4">
        {summary}

        <div>
          <label htmlFor="bk-name" className="mb-1.5 block font-medium">
            {t("name")}
          </label>
          <input
            ref={nameRef}
            id="bk-name"
            name="name"
            autoComplete="name"
            enterKeyHint="next"
            maxLength={60}
            placeholder={t("namePlaceholder")}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            aria-invalid={!!errors.name || undefined}
            aria-describedby={errors.name ? "bk-name-error" : undefined}
            className={cn(
              "h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              errors.name && "border-destructive ring-3 ring-destructive/20",
            )}
          />
          {fieldError("name", "bk-name-error")}
        </div>

        <div>
          <label htmlFor="bk-phone" className="mb-1.5 block font-medium">
            {t("phone")}
          </label>
          <PhoneInput
            ref={phoneRef}
            id="bk-phone"
            name="phone"
            value={values.phone}
            onChange={(digits) => set("phone", digits)}
            invalid={!!errors.phone}
            describedBy={errors.phone ? "bk-phone-error" : undefined}
          />
          {fieldError("phone", "bk-phone-error")}
        </div>

        {showComment ? (
          <div>
            <label htmlFor="bk-comment" className="mb-1.5 block font-medium">
              {t("comment")}
            </label>
            <textarea
              id="bk-comment"
              name="comment"
              rows={3}
              maxLength={300}
              placeholder={t("commentPlaceholder")}
              value={values.comment}
              onChange={(e) => set("comment", e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            {fieldError("comment", "bk-comment-error")}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowComment(true)}
            className="inline-flex min-h-11 items-center gap-2 font-medium text-primary"
          >
            <MessageSquarePlus className="size-5" aria-hidden />
            {t("comment")}
          </button>
        )}

        {/* Honeypot: hidden from people, bots fill it in (spec 6.10). */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="bk-website">Website</label>
          <input
            id="bk-website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              ref={consentRef}
              type="checkbox"
              checked={values.consent}
              onChange={(e) => set("consent", e.target.checked)}
              aria-invalid={!!errors.consent || undefined}
              aria-describedby={errors.consent ? "bk-consent-error" : undefined}
              className="mt-0.5 size-6 shrink-0 cursor-pointer accent-primary"
            />
            <span className="text-sm leading-6">
              {t.rich("consent", {
                link: (chunks) => (
                  <a
                    href={`${locale === "ru" ? "/ru" : ""}/maxfiylik`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline underline-offset-2"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </span>
          </label>
          {fieldError("consent", "bk-consent-error")}
        </div>
      </div>

      <div className="shrink-0 border-t bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70"
        >
          {submitting && <Loader2 className="size-5 animate-spin" aria-hidden />}
          {submitting ? t("submitting") : t("submit")}
        </button>
      </div>
    </form>
  );
}
