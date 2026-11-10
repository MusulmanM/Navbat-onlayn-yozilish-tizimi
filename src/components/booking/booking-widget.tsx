"use client";

import { AlertCircle, ArrowLeft, ChevronRight, Phone, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "@/config/locales";
import { apiRequest } from "@/components/booking/api";
import { BookingSuccess } from "@/components/booking/booking-success";
import { DateStrip, DateStripSkeleton } from "@/components/booking/date-strip";
import { DetailsForm, type DetailsValues } from "@/components/booking/details-form";
import { TimeGrid, TimeGridSkeleton } from "@/components/booking/time-grid";
import type {
  ApiFailure,
  BookingResult,
  DayInfo,
  SlotInfo,
  WidgetService,
  WidgetStaff,
} from "@/components/booking/types";
import { useTelegramWebApp } from "@/components/booking/use-telegram";
import { InitialAvatar } from "@/components/common/initial-avatar";
import { formatDateLong } from "@/lib/time";
import { cn } from "@/lib/utils";

type Step = "staff" | "datetime" | "details" | "done";

export type BookingWidgetProps = {
  slug: string;
  locale: Locale;
  /** Today in the business time zone, "YYYY-MM-DD". */
  today: string;
  businessName: string;
  phone: string;
  phoneLabel: string;
  address: string;
  staffLabel: string;
  staffAcc: string;
  services: WidgetService[];
  staff: WidgetStaff[];
  bookingDisabled: boolean;
  initialServiceId?: string;
  telegramMode: boolean;
};

type HistoryState = { nvStep?: Step; nvDepth?: number } | null;

const STORAGE_KEY = "navbat:client";

function readSavedClient(): { name?: string; phone?: string } {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as {
      name?: string;
      phone?: string;
    };
  } catch {
    return {};
  }
}

export function BookingWidget(props: BookingWidgetProps) {
  const { slug, locale, services, staff, telegramMode } = props;
  const t = useTranslations("Booking");
  const tc = useTranslations("Common");
  const tg = useTelegramWebApp(telegramMode);

  const [step, setStep] = useState<Step | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState("any");
  const [days, setDays] = useState<DayInfo[] | null>(null);
  const [daysError, setDaysError] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotInfo[] | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [slot, setSlot] = useState<SlotInfo | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [details, setDetails] = useState<DetailsValues>({
    name: "",
    phone: "",
    comment: "",
    consent: false,
  });

  const depth = useRef(0);
  const stepRef = useRef<Step | null>(null);
  const pendingNotice = useRef<string | null>(null);
  const daysRequest = useRef(0);
  const slotsRequest = useRef(0);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const autoOpened = useRef(false);

  const service = services.find((s) => s.id === serviceId) ?? null;
  const staffOptions = service ? staff.filter((s) => service.staffIds.includes(s.id)) : [];
  const hasStaffStep = staffOptions.length > 1;
  const chosenStaff = staff.find((s) => s.id === staffId) ?? null;

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const errorText = useCallback(
    (error: ApiFailure): string => {
      if (error.code === "TOO_MANY_ACTIVE_BOOKINGS") {
        return t("errors.TOO_MANY_ACTIVE_BOOKINGS", { max: Number(error.data?.max ?? 3) });
      }
      if (error.code === "BOOKING_DISABLED")
        return t("errors.BOOKING_DISABLED", { phone: props.phoneLabel });
      const key = `errors.${error.code}`;
      return t.has(key) ? t(key) : t("errors.UNKNOWN");
    },
    [t, props.phoneLabel],
  );

  // --- navigation: every step is a browser history entry, so the phone's back button works.
  const navigate = useCallback((next: Step) => {
    depth.current += 1;
    window.history.pushState({ nvStep: next, nvDepth: depth.current } satisfies HistoryState, "");
    setNotice(null);
    setStep(next);
  }, []);

  const resetFlow = useCallback(() => {
    setServiceId(null);
    setStaffId("any");
    setDays(null);
    setDate(null);
    setSlots(null);
    setSlot(null);
    setResult(null);
    setNotice(null);
  }, []);

  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      const state = event.state as HistoryState;
      if (stepRef.current === "done") {
        // After a successful booking, "back" closes the whole flow.
        const extra = state?.nvDepth ?? 0;
        depth.current = 0;
        resetFlow();
        setStep(null);
        if (extra > 0) window.history.go(-extra);
        return;
      }
      depth.current = state?.nvDepth ?? 0;
      setStep(state?.nvStep ?? null);
      setNotice(pendingNotice.current);
      pendingNotice.current = null;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [resetFlow]);

  const goBack = useCallback(() => window.history.back(), []);
  const closeAll = useCallback(() => {
    const d = depth.current;
    if (d > 0) window.history.go(-d);
    else setStep(null);
  }, []);

  // Telegram's own back button (spec 8.5).
  useEffect(() => {
    if (!tg) return;
    if (step && step !== "done") {
      tg.BackButton.show();
      tg.BackButton.onClick(goBack);
    } else {
      tg.BackButton.hide();
    }
    return () => tg.BackButton.offClick(goBack);
  }, [tg, step, goBack]);

  // Lock page scroll under the overlay; Escape goes one step back.
  useEffect(() => {
    if (!step) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") goBack();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [step, goBack]);

  // Move focus to the step title so screen readers announce the new step.
  useEffect(() => {
    if (step) titleRef.current?.focus();
  }, [step]);

  // --- data
  const fetchSlots = useCallback(
    async (svc: string, stf: string, day: string) => {
      const request = ++slotsRequest.current;
      setSlots(null);
      setSlotsError(null);
      const res = await apiRequest<{ slots: SlotInfo[] }>(
        `/api/public/${slug}/slots?serviceId=${encodeURIComponent(svc)}&staffId=${encodeURIComponent(stf)}&date=${day}`,
      );
      if (request !== slotsRequest.current) return;
      if (res.ok) setSlots(res.data.slots);
      else setSlotsError(errorText(res.error));
    },
    [slug, errorText],
  );

  const fetchDays = useCallback(
    async (svc: string, stf: string, keepDate: string | null) => {
      const request = ++daysRequest.current;
      setDays(null);
      setDaysError(null);
      setSlots(null);
      const res = await apiRequest<{ days: DayInfo[] }>(
        `/api/public/${slug}/days?serviceId=${encodeURIComponent(svc)}&staffId=${encodeURIComponent(stf)}`,
      );
      if (request !== daysRequest.current) return;
      if (!res.ok) {
        setDaysError(errorText(res.error));
        return;
      }
      setDays(res.data.days);
      const keep = keepDate && res.data.days.some((d) => d.date === keepDate && d.hasSlots);
      const first = keep ? keepDate : (res.data.days.find((d) => d.hasSlots)?.date ?? null);
      setDate(first);
      if (first) void fetchSlots(svc, stf, first);
      else setSlots([]);
    },
    [slug, errorText, fetchSlots],
  );

  // --- actions
  const chooseService = useCallback(
    (id: string) => {
      const chosen = services.find((s) => s.id === id);
      if (!chosen || props.bookingDisabled) return;
      const options = staff.filter((s) => chosen.staffIds.includes(s.id));
      setServiceId(id);
      setSlot(null);
      setDate(null);
      setResult(null);
      if (options.length <= 1) {
        const only = options[0]?.id ?? "any";
        setStaffId(only);
        void fetchDays(id, only, null);
        navigate("datetime");
      } else {
        setStaffId("any");
        navigate("staff");
      }
    },
    [services, staff, props.bookingDisabled, fetchDays, navigate],
  );

  // ?s=<serviceId> opens the flow with that service preselected (spec 7.2).
  useEffect(() => {
    if (autoOpened.current || !props.initialServiceId) return;
    autoOpened.current = true;
    const id = props.initialServiceId;
    const timer = window.setTimeout(() => chooseService(id), 0);
    return () => window.clearTimeout(timer);
  }, [props.initialServiceId, chooseService]);

  const chooseStaff = (id: string) => {
    if (!serviceId) return;
    setStaffId(id);
    setSlot(null);
    void fetchDays(serviceId, id, date);
    navigate("datetime");
  };

  const chooseDate = (day: string) => {
    if (!serviceId || day === date) return;
    setDate(day);
    setSlot(null);
    void fetchSlots(serviceId, staffId, day);
  };

  const chooseSlot = (chosen: SlotInfo) => {
    setSlot(chosen);
    setDetails((current) => {
      if (current.name || current.phone) return current;
      const saved = readSavedClient();
      const tgUser = tg?.initDataUnsafe.user;
      const tgName = [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(" ");
      return { ...current, name: tgName || saved.name || "", phone: saved.phone ?? "" };
    });
    navigate("details");
  };

  const onBooked = (booking: BookingResult, values: DetailsValues) => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ name: values.name, phone: values.phone }),
      );
    } catch {
      // Private mode: remembering is only a convenience.
    }
    tg?.HapticFeedback?.notificationOccurred("success");
    setResult(booking);
    navigate("done");
  };

  const onSlotTaken = () => {
    tg?.HapticFeedback?.notificationOccurred("error");
    pendingNotice.current = t("errors.SLOT_TAKEN");
    setSlot(null);
    if (serviceId) void fetchDays(serviceId, staffId, date);
    window.history.back();
  };

  const startOver = () => {
    resetFlow();
    closeAll();
  };

  // --- rendering
  const stepList: Step[] = hasStaffStep
    ? ["staff", "datetime", "details"]
    : ["datetime", "details"];
  const stepIndex = step && step !== "done" ? stepList.indexOf(step) + 2 : null; // service is step 1
  const totalSteps = stepList.length + 1;
  const title =
    step === "staff"
      ? t("chooseStaff", { staffAcc: props.staffAcc })
      : step === "datetime"
        ? t("chooseDateTime")
        : step === "details"
          ? t("details")
          : step === "done" && result
            ? result.status === "PENDING"
              ? t("pendingTitle")
              : t("confirmedTitle")
            : "";
  const staffName = staffId === "any" ? null : chosenStaff?.name;

  return (
    <>
      <ServiceList
        services={services}
        disabled={props.bookingDisabled}
        phone={props.phone}
        phoneLabel={props.phoneLabel}
        onChoose={chooseService}
      />

      {step && service && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-step-title"
          className="fixed inset-0 z-50 flex justify-center bg-foreground/40 sm:items-center sm:p-6"
        >
          <div className="flex h-dvh w-full flex-col overflow-hidden bg-background sm:h-auto sm:max-h-[90dvh] sm:max-w-lg sm:rounded-2xl sm:shadow-xl">
            <header className="flex h-14 shrink-0 items-center gap-1 border-b px-1.5">
              {step !== "done" && !tg ? (
                <button
                  type="button"
                  onClick={goBack}
                  aria-label={tc("back")}
                  className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-muted"
                >
                  <ArrowLeft className="size-5" aria-hidden />
                </button>
              ) : (
                <span className="w-2" />
              )}
              <div className="min-w-0 flex-1 px-1">
                <p
                  id="booking-step-title"
                  ref={titleRef}
                  tabIndex={-1}
                  className="truncate text-base font-semibold outline-none"
                >
                  {title}
                </p>
                {stepIndex && (
                  <p className="text-xs text-muted-foreground">
                    {t("stepOf", { current: stepIndex, total: totalSteps })}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={closeAll}
                aria-label={tc("close")}
                className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-muted"
              >
                <X className="size-5" aria-hidden />
              </button>
            </header>
            {stepIndex && (
              <div className="h-1 shrink-0 bg-muted" aria-hidden>
                <div
                  className="h-full bg-primary transition-[width] duration-300"
                  style={{ width: `${(stepIndex / totalSteps) * 100}%` }}
                />
              </div>
            )}

            {notice && (
              <div
                role="alert"
                className="mx-4 mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <p>{notice}</p>
              </div>
            )}

            {step === "staff" && (
              <div className="flex-1 overflow-y-auto overscroll-contain p-4">
                <ul className="space-y-2">
                  <li>
                    <button
                      type="button"
                      onClick={() => chooseStaff("any")}
                      className="flex w-full items-center gap-3 rounded-xl border-2 border-primary/30 bg-accent/40 p-3 text-left hover:border-primary"
                    >
                      <span
                        aria-hidden
                        className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-xl text-primary-foreground"
                      >
                        ⚡
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">
                          {t("anyStaff", {
                            staffLower: props.staffLabel.toLocaleLowerCase(locale),
                          })}
                        </span>
                        <span className="block text-sm text-muted-foreground">
                          {t("anyStaffHint")}
                        </span>
                      </span>
                      <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
                    </button>
                  </li>
                  {staffOptions.map((member) => (
                    <li key={member.id}>
                      <button
                        type="button"
                        onClick={() => chooseStaff(member.id)}
                        className="flex w-full items-center gap-3 rounded-xl border p-3 text-left hover:border-primary hover:bg-muted/40"
                      >
                        <InitialAvatar name={member.name} className="size-12 rounded-xl text-lg" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">{member.name}</span>
                          {member.position && (
                            <span className="block text-sm text-muted-foreground">
                              {member.position}
                            </span>
                          )}
                        </span>
                        <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {step === "datetime" && (
              <div className="flex-1 overflow-y-auto overscroll-contain p-4">
                <Summary
                  service={service}
                  staffLabel={props.staffLabel}
                  staffName={staffName ?? (hasStaffStep ? t("anyStaffShort") : null)}
                />
                <h2 className="mt-5 mb-2 font-semibold">{t("chooseDate")}</h2>
                {daysError ? (
                  <ErrorBox
                    text={daysError}
                    retry={() => serviceId && void fetchDays(serviceId, staffId, date)}
                    retryLabel={tc("retry")}
                  />
                ) : !days ? (
                  <DateStripSkeleton />
                ) : !days.some((d) => d.hasSlots) ? (
                  <EmptyBox text={t("noDays", { phone: props.phoneLabel })} phone={props.phone} />
                ) : (
                  <>
                    <DateStrip
                      days={days}
                      selected={date}
                      onSelect={chooseDate}
                      locale={locale}
                      today={props.today}
                    />
                    {date && (
                      <h2 className="mt-4 mb-3 font-semibold first-letter:uppercase">
                        {formatDateLong(date, locale)}
                      </h2>
                    )}
                    {slotsError ? (
                      <ErrorBox
                        text={slotsError}
                        retry={() => serviceId && date && void fetchSlots(serviceId, staffId, date)}
                        retryLabel={tc("retry")}
                      />
                    ) : !slots ? (
                      <TimeGridSkeleton />
                    ) : slots.length === 0 ? (
                      <p className="rounded-xl bg-muted p-4 text-center text-muted-foreground">
                        {t("noSlots")}
                      </p>
                    ) : (
                      <TimeGrid
                        slots={slots}
                        selected={slot?.startsAt ?? null}
                        onSelect={chooseSlot}
                      />
                    )}
                  </>
                )}
              </div>
            )}

            {step === "details" && slot && date && (
              <DetailsForm
                slug={slug}
                locale={locale}
                values={details}
                onChange={setDetails}
                serviceId={service.id}
                staffId={staffId}
                slot={slot}
                tgInitData={tg?.initData}
                summary={
                  <Summary
                    service={service}
                    staffLabel={props.staffLabel}
                    staffName={staffName}
                    when={`${formatDateLong(date, locale)}, ${slot.time}`}
                    address={props.address}
                  />
                }
                errorText={errorText}
                onBooked={onBooked}
                onSlotTaken={onSlotTaken}
                setNotice={setNotice}
              />
            )}

            {step === "done" && result && date && slot && (
              <BookingSuccess
                locale={locale}
                result={result}
                telegramMode={!!tg}
                onClose={() => tg?.close()}
                onBookAnother={startOver}
                summary={
                  <Summary
                    service={service}
                    staffLabel={props.staffLabel}
                    staffName={result.staffName}
                    when={`${formatDateLong(date, locale)}, ${slot.time}`}
                    address={props.address}
                  />
                }
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ServiceList({
  services,
  disabled,
  phone,
  phoneLabel,
  onChoose,
}: {
  services: WidgetService[];
  disabled: boolean;
  phone: string;
  phoneLabel: string;
  onChoose: (id: string) => void;
}) {
  const t = useTranslations("Booking");
  const tb = useTranslations("Business");
  return (
    <section aria-labelledby="services-title" className="space-y-3">
      <h2 id="services-title" className="text-xl font-bold">
        {tb("services")}
      </h2>
      {disabled && (
        <div role="status" className="rounded-xl border border-pending/40 bg-pending/10 p-4">
          <p className="font-medium">{tb("bookingDisabled", { phone: phoneLabel })}</p>
          <a
            href={`tel:${phone}`}
            className="mt-3 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 font-semibold text-primary-foreground"
          >
            <Phone className="size-4" aria-hidden />
            {tb("call")}
          </a>
        </div>
      )}
      {services.length === 0 ? (
        <p className="rounded-xl bg-muted p-4 text-muted-foreground">{tb("noServices")}</p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {services.map((service) => {
            const content = (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{service.name}</span>
                  {service.description && (
                    <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">
                      {service.description}
                    </span>
                  )}
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {service.durationLabel} ·{" "}
                    <span className="font-semibold text-foreground">{service.priceLabel}</span>
                  </span>
                </span>
                {!disabled && (
                  <span className="inline-flex h-10 shrink-0 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">
                    {t("book")}
                  </span>
                )}
              </>
            );
            return (
              <li key={service.id}>
                {disabled ? (
                  <div className="flex items-center gap-3 p-4">{content}</div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onChoose(service.id)}
                    className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50"
                  >
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Summary({
  service,
  staffLabel,
  staffName,
  when,
  address,
}: {
  service: WidgetService;
  staffLabel: string;
  staffName: string | null | undefined;
  when?: string;
  address?: string;
}) {
  return (
    <div className="rounded-xl bg-muted/70 p-3.5 text-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-foreground">{service.name}</p>
        <p className="shrink-0 font-semibold text-foreground">{service.priceLabel}</p>
      </div>
      <p className="mt-0.5 text-muted-foreground">
        {service.durationLabel}
        {staffName ? ` · ${staffLabel}: ${staffName}` : ""}
      </p>
      {when && <p className="mt-1.5 font-semibold text-primary first-letter:uppercase">{when}</p>}
      {address && <p className="mt-0.5 text-muted-foreground">{address}</p>}
    </div>
  );
}

function ErrorBox({
  text,
  retry,
  retryLabel,
}: {
  text: string;
  retry: () => void;
  retryLabel: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center"
    >
      <p className="text-destructive">{text}</p>
      <button
        type="button"
        onClick={retry}
        className="mt-3 inline-flex h-11 items-center rounded-lg border bg-background px-4 font-semibold"
      >
        {retryLabel}
      </button>
    </div>
  );
}

function EmptyBox({ text, phone }: { text: string; phone: string }) {
  const tb = useTranslations("Business");
  return (
    <div className={cn("rounded-xl bg-muted p-4 text-center")}>
      <p className="text-muted-foreground">{text}</p>
      <a
        href={`tel:${phone}`}
        className="mt-3 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-4 font-semibold text-primary-foreground"
      >
        <Phone className="size-4" aria-hidden />
        {tb("call")}
      </a>
    </div>
  );
}
