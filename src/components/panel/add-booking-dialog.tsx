"use client";

import { CheckCircle2, Loader2, Search, Send, UserPlus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { TelegramIcon } from "@/components/common/telegram-icon";
import { PhoneInput } from "@/components/common/phone-input";
import { CopyButton } from "@/components/panel/copy-button";
import { Modal } from "@/components/panel/modal";
import { usePanel, type AddBookingPrefill } from "@/components/panel/panel-context";
import { useAction } from "@/components/panel/use-action";
import { formatPhone } from "@/lib/phone";
import { formatDateLong } from "@/lib/time";
import { cn } from "@/lib/utils";
import {
  createBookingAction,
  panelSlotsAction,
  searchClientsAction,
} from "@/server/actions/bookings";

type ClientOption = { id: string; name: string; phone: string; telegram: boolean };
type SlotOption = { time: string; startsAt: string };
type Created = {
  manageToken: string;
  telegramLink: string | null;
  telegramLinked: boolean;
  startsAt: string;
};

const fieldClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/** "Yozilish qo'shish" (spec 7.6): client, service, staff, date, time → CONFIRMED, source PANEL. */
export function AddBookingDialog({
  open,
  onOpenChange,
  prefill,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefill: AddBookingPrefill;
}) {
  const t = useTranslations("AddBooking");
  const panel = usePanel();
  const { run, pending } = useAction();

  const firstService =
    panel.services.find((s) => !prefill.staffId || s.staffIds.includes(prefill.staffId)) ??
    panel.services[0];
  const [client, setClient] = useState<ClientOption | null>(prefill.client ?? null);
  const [mode, setMode] = useState<"search" | "new">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClientOption[] | null>(null);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [serviceId, setServiceId] = useState(firstService?.id ?? "");
  const service = panel.services.find((s) => s.id === serviceId);
  const staffOptions = panel.staff.filter((s) => service?.staffIds.includes(s.id));
  const [staffId, setStaffId] = useState(
    prefill.staffId && staffOptions.some((s) => s.id === prefill.staffId)
      ? prefill.staffId
      : (staffOptions[0]?.id ?? ""),
  );
  const [date, setDate] = useState(prefill.date ?? panel.today);
  const [outsideHours, setOutsideHours] = useState(false);
  const [slots, setSlots] = useState<SlotOption[] | null>(null);
  const [slot, setSlot] = useState<SlotOption | null>(null);
  const [note, setNote] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<Created | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const wantedTime = useRef(prefill.time ?? null);
  const slotRequest = useRef(0);

  // Client search with a small debounce.
  useEffect(() => {
    if (client || mode !== "search") return;
    const q = query.trim();
    if (q.length < 2) return;
    const timer = window.setTimeout(async () => {
      const res = await searchClientsAction(q);
      if (res.ok) setResults(res.data);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, client, mode]);

  // Free times for the chosen service / staff / date.
  useEffect(() => {
    if (!serviceId || !staffId || !date) return;
    const request = ++slotRequest.current;
    let cancelled = false;
    void (async () => {
      const load = (outside: boolean) =>
        panelSlotsAction({ serviceId, staffId, date, outsideHours: outside });
      let res = await load(outsideHours);
      if (cancelled || request !== slotRequest.current) return;
      // A time clicked in the calendar outside working hours: switch the toggle on by itself.
      if (
        res.ok &&
        wantedTime.current &&
        !outsideHours &&
        !res.data.some((s) => s.time === wantedTime.current)
      ) {
        const outside = await load(true);
        if (cancelled || request !== slotRequest.current) return;
        if (outside.ok && outside.data.some((s) => s.time === wantedTime.current)) {
          setOutsideHours(true);
          return;
        }
      }
      if (!res.ok) res = { ok: true, data: [] };
      setSlots(res.data);
      const wanted = wantedTime.current
        ? res.data.find((s) => s.time === wantedTime.current)
        : null;
      setSlot(wanted ?? null);
      wantedTime.current = null;
    })();
    return () => {
      cancelled = true;
    };
  }, [serviceId, staffId, date, outsideHours, reloadKey]);

  const changeService = (id: string) => {
    setServiceId(id);
    setSlots(null);
    setSlot(null);
    const next = panel.services.find((s) => s.id === id);
    if (next && !next.staffIds.includes(staffId))
      setStaffId(panel.staff.find((s) => next.staffIds.includes(s.id))?.id ?? "");
  };

  const submit = async () => {
    const errors: Record<string, string> = {};
    if (!client && mode === "new") {
      if (newName.trim().length < 2) errors.name = t("errors.name");
      if (newPhone.length !== 9) errors.phone = t("errors.phone");
    }
    if (!client && mode === "search") errors.client = t("errors.client");
    if (!slot) errors.slot = t("errors.slot");
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const result = await run(
      () =>
        createBookingAction({
          clientId: client?.id,
          newClient: client ? undefined : { name: newName, phone: `+998${newPhone}` },
          serviceId,
          staffId,
          startsAt: slot!.startsAt,
          outsideHours,
          internalNote: note || undefined,
        }),
      {
        success: false,
        onError: (code, fields) => {
          if (code === "SLOT_TAKEN") {
            setSlot(null);
            setSlots(null);
            setReloadKey((k) => k + 1);
            return false;
          }
          if (fields?.name || fields?.phone) {
            setFieldErrors({
              ...(fields.name ? { name: t("errors.name") } : {}),
              ...(fields.phone ? { phone: t("errors.phone") } : {}),
            });
            return true;
          }
          return false;
        },
      },
    );
    if (result) setCreated(result);
  };

  const businessName = panel.businessName;
  const messageText =
    created && slot
      ? t("clientMessage", {
          date: formatDateLong(date, panel.locale),
          time: slot.time,
          business: businessName,
          link: created.telegramLink ?? "",
        }).trim()
      : "";

  if (created) {
    return (
      <Modal open={open} onOpenChange={onOpenChange} title={t("createdTitle")}>
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto size-14 text-success" aria-hidden />
          <p className="text-lg font-semibold">{t("createdText")}</p>
          {!created.telegramLinked && (
            <div className="space-y-3 rounded-xl bg-muted/70 p-4 text-left">
              <p className="font-medium">{t("sendMessage")}</p>
              <p className="rounded-lg bg-background p-3 text-sm whitespace-pre-line">
                {messageText}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <CopyButton text={messageText} variant="primary" />
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(created.telegramLink ?? "")}&text=${encodeURIComponent(messageText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border bg-background px-4 font-semibold hover:bg-muted"
                >
                  <TelegramIcon className="size-4 text-[#229ED9]" />
                  {t("shareTelegram")}
                </a>
              </div>
            </div>
          )}
          {created.telegramLinked && (
            <p className="flex items-center justify-center gap-2 rounded-xl bg-accent p-3 font-medium text-accent-foreground">
              <Send className="size-4" aria-hidden />
              {t("telegramSent")}
            </p>
          )}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl border font-semibold hover:bg-muted"
          >
            {t("done")}
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t("title")}
      size="lg"
      footer={
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-lg font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
        >
          {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
          {t("save")}
        </button>
      }
    >
      <div className="space-y-5">
        {/* Client */}
        <section>
          <p className="mb-1.5 font-medium">{t("client")}</p>
          {client ? (
            <div className="flex items-center gap-3 rounded-xl border bg-accent/40 p-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{client.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatPhone(client.phone)} {client.telegram && "· Telegram ✓"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setClient(null);
                  setResults(null);
                }}
                aria-label={t("changeClient")}
                className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-muted"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
          ) : mode === "search" ? (
            <div>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (e.target.value.trim().length < 2) setResults(null);
                  }}
                  placeholder={t("searchPlaceholder")}
                  aria-label={t("searchPlaceholder")}
                  className={cn(fieldClass, "pl-10", fieldErrors.client && "border-destructive")}
                />
              </div>
              {results && results.length > 0 && (
                <ul className="mt-2 divide-y overflow-hidden rounded-xl border">
                  {results.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => setClient(r)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-muted"
                      >
                        <span className="font-medium">{r.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatPhone(r.phone)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {results && results.length === 0 && (
                <p className="mt-2 text-sm text-muted-foreground">{t("noClients")}</p>
              )}
              <button
                type="button"
                onClick={() => {
                  setMode("new");
                  const digits = query.replace(/\D/g, "");
                  if (digits.length >= 9) setNewPhone(digits.slice(-9));
                  else if (query.trim() && !digits) setNewName(query.trim());
                }}
                className="mt-2 inline-flex min-h-11 items-center gap-2 font-semibold text-primary"
              >
                <UserPlus className="size-5" aria-hidden />
                {t("newClient")}
              </button>
              {fieldErrors.client && (
                <p className="text-sm text-destructive">{fieldErrors.client}</p>
              )}
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border p-3">
              <div>
                <label htmlFor="ab-name" className="mb-1 block text-sm font-medium">
                  {t("name")}
                </label>
                <input
                  id="ab-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={60}
                  className={cn(fieldClass, fieldErrors.name && "border-destructive")}
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-sm text-destructive">{fieldErrors.name}</p>
                )}
              </div>
              <div>
                <label htmlFor="ab-phone" className="mb-1 block text-sm font-medium">
                  {t("phone")}
                </label>
                <PhoneInput
                  id="ab-phone"
                  value={newPhone}
                  onChange={setNewPhone}
                  invalid={!!fieldErrors.phone}
                />
                {fieldErrors.phone && (
                  <p className="mt-1 text-sm text-destructive">{fieldErrors.phone}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMode("search")}
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
              >
                <Search className="size-4" aria-hidden />
                {t("searchExisting")}
              </button>
            </div>
          )}
        </section>

        {/* Service and staff */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ab-service" className="mb-1.5 block font-medium">
              {t("service")}
            </label>
            <select
              id="ab-service"
              value={serviceId}
              onChange={(e) => changeService(e.target.value)}
              className={fieldClass}
            >
              {panel.services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.priceLabel}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ab-staff" className="mb-1.5 block font-medium">
              {panel.staffLabel}
            </label>
            <select
              id="ab-staff"
              value={staffId}
              onChange={(e) => {
                setStaffId(e.target.value);
                setSlot(null);
                setSlots(null);
              }}
              className={fieldClass}
            >
              {staffOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date and time */}
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-44 flex-1">
              <label htmlFor="ab-date" className="mb-1.5 block font-medium">
                {t("date")}
              </label>
              <input
                id="ab-date"
                type="date"
                value={date}
                onChange={(e) => {
                  if (!e.target.value) return;
                  setDate(e.target.value);
                  setSlot(null);
                  setSlots(null);
                }}
                className={fieldClass}
              />
            </div>
            <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-medium">
              <input
                type="checkbox"
                checked={outsideHours}
                onChange={(e) => {
                  setOutsideHours(e.target.checked);
                  setSlot(null);
                  setSlots(null);
                }}
                className="size-5 accent-primary"
              />
              {t("outsideHours")}
            </label>
          </div>
          <p className="mt-3 mb-2 font-medium first-letter:uppercase">
            {formatDateLong(date, panel.locale)}
          </p>
          {!slots ? (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" aria-hidden>
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="h-11 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">{t("noSlots")}</p>
          ) : (
            <div className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6">
              {slots.map((s) => (
                <button
                  key={s.startsAt}
                  type="button"
                  aria-pressed={slot?.startsAt === s.startsAt}
                  onClick={() => setSlot(s)}
                  className={cn(
                    "h-11 rounded-lg border font-semibold tabular-nums",
                    slot?.startsAt === s.startsAt
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:border-primary hover:bg-accent",
                  )}
                >
                  {s.time}
                </button>
              ))}
            </div>
          )}
          {fieldErrors.slot && <p className="mt-1 text-sm text-destructive">{fieldErrors.slot}</p>}
        </section>

        <div>
          <label htmlFor="ab-note" className="mb-1.5 block font-medium">
            {t("note")}
          </label>
          <textarea
            id="ab-note"
            rows={2}
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>
    </Modal>
  );
}
