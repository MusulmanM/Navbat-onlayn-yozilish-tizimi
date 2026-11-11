"use client";

import { Ban, Loader2, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Field,
  MoneyInput,
  inputClass,
  primaryButton,
  secondaryButton,
} from "@/components/panel/fields";
import { useAction } from "@/components/panel/use-action";
import { PLANS, PAYMENT_METHODS, type PaidPlanCode, type PaymentMethod } from "@/config/plans";
import { cn } from "@/lib/utils";
import {
  addPaymentAction,
  setBlockedAction,
  setFeaturedAction,
  setTrialEndsAction,
} from "@/server/actions/admin";

/** "To'lov qo'shish": amount, plan, days (default 30), method, note (spec 7.7). */
export function AdminPaymentForm({
  businessId,
  defaultPlan,
}: {
  businessId: string;
  defaultPlan: PaidPlanCode;
}) {
  const t = useTranslations("Admin");
  const { run, pending } = useAction();
  const [plan, setPlan] = useState<PaidPlanCode>(defaultPlan);
  const [amount, setAmount] = useState<number>(PLANS[defaultPlan].priceSom);
  const [periodDays, setPeriodDays] = useState(30);
  const [method, setMethod] = useState<PaymentMethod>("click");
  const [note, setNote] = useState("");

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field id="ap-plan" label={t("planLabel")}>
        <select
          id="ap-plan"
          value={plan}
          onChange={(e) => {
            const next = e.target.value as PaidPlanCode;
            setPlan(next);
            setAmount(PLANS[next].priceSom);
          }}
          className={inputClass}
        >
          <option value="START">Start</option>
          <option value="PRO">Pro</option>
        </select>
      </Field>
      <Field id="ap-amount" label={t("amount")}>
        <MoneyInput id="ap-amount" value={amount} onChange={setAmount} />
      </Field>
      <Field id="ap-days" label={t("periodDays")}>
        <input
          id="ap-days"
          type="number"
          inputMode="numeric"
          min={1}
          max={366}
          value={periodDays}
          onChange={(e) => setPeriodDays(Number(e.target.value) || 30)}
          className={inputClass}
        />
      </Field>
      <Field id="ap-method" label={t("method")}>
        <select
          id="ap-method"
          value={method}
          onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          className={inputClass}
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {t(`methods.${m}`)}
            </option>
          ))}
        </select>
      </Field>
      <Field id="ap-note" label={t("note")} className="sm:col-span-2">
        <input
          id="ap-note"
          value={note}
          maxLength={300}
          onChange={(e) => setNote(e.target.value)}
          className={inputClass}
        />
      </Field>
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          const ok = await run(
            () =>
              addPaymentAction(businessId, {
                amount,
                plan,
                periodDays,
                method,
                note: note || null,
              }),
            { success: t("paymentSaved") },
          );
          if (ok) setNote("");
        }}
        className={cn(primaryButton, "sm:col-span-2")}
      >
        {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
        {t("save")}
      </button>
    </div>
  );
}

export function AdminBusinessActions({
  businessId,
  blocked,
  featured,
}: {
  businessId: string;
  blocked: boolean;
  featured: boolean;
}) {
  const t = useTranslations("Admin");
  const { run, pending } = useAction();
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          (blocked || window.confirm(t("blockConfirm"))) &&
          run(() => setBlockedAction(businessId, !blocked))
        }
        className={cn(secondaryButton, !blocked && "text-destructive")}
      >
        <Ban className="size-4" aria-hidden />
        {blocked ? t("unblock") : t("block")}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => setFeaturedAction(businessId, !featured))}
        className={secondaryButton}
      >
        <Star className="size-4" aria-hidden />
        {featured ? t("untop") : t("top")}
      </button>
    </div>
  );
}

/** Trial end date (admin can shorten or extend the free period). */
export function AdminTrialForm({
  businessId,
  trialEnds,
}: {
  businessId: string;
  trialEnds: string;
}) {
  const t = useTranslations("Admin");
  const ta = useTranslations("Actions");
  const { run, pending } = useAction();
  const [value, setValue] = useState(trialEnds);
  return (
    <Field id="ap-trial" label={t("trialEnds")} hint={t("trialHint")}>
      <div className="flex gap-2">
        <input
          id="ap-trial"
          type="date"
          value={value}
          onChange={(e) => e.target.value && setValue(e.target.value)}
          className={inputClass}
        />
        <button
          type="button"
          disabled={pending || value === trialEnds}
          onClick={() =>
            run(() => setTrialEndsAction(businessId, value), { success: t("trialSaved") })
          }
          className={secondaryButton}
        >
          {ta("save")}
        </button>
      </div>
    </Field>
  );
}
