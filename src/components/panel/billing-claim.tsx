"use client";

import { Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useAction } from "@/components/panel/use-action";
import { cn } from "@/lib/utils";
import { claimPaymentAction } from "@/server/actions/billing";

type PlanCard = { code: "START" | "PRO"; name: string; price: string; features: string[] };

/** Plan choice + "To'ladim" (manual payment period, spec 1.4, 7.6). */
export function BillingClaim({
  plans,
  initialPlan,
  claimedLabel,
}: {
  plans: PlanCard[];
  initialPlan: "START" | "PRO";
  claimedLabel: string | null;
}) {
  const t = useTranslations("Billing");
  const { runOk, pending } = useAction();
  const [plan, setPlan] = useState(initialPlan);
  const [claimed, setClaimed] = useState(claimedLabel);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {plans.map((p) => {
          const active = p.code === plan;
          return (
            <button
              key={p.code}
              type="button"
              aria-pressed={active}
              onClick={() => setPlan(p.code)}
              className={cn(
                "rounded-2xl border-2 bg-card p-5 text-left transition-colors",
                active
                  ? "border-primary ring-3 ring-primary/15"
                  : "border-border hover:border-primary/40",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xl font-bold">{p.name}</p>
                {active && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                    <Check className="size-3" aria-hidden />
                    {t("chosen")}
                  </span>
                )}
              </div>
              <p className="mt-2">
                <span className="text-2xl font-extrabold tabular-nums">{p.price}</span>{" "}
                <span className="text-muted-foreground">{t("perMonth")}</span>
              </p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
      <div className="rounded-2xl border bg-card p-4">
        {claimed ? (
          <p role="status" className="font-medium text-primary">
            {claimed}
          </p>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted-foreground">{t("paidHint")}</p>
            <button
              type="button"
              disabled={pending}
              onClick={async () => {
                if (await runOk(() => claimPaymentAction(plan), { success: t("claimed") }))
                  setClaimed(t("claimed"));
              }}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground disabled:opacity-60 sm:w-auto"
            >
              {pending && <Loader2 className="size-5 animate-spin" aria-hidden />}
              {t("paid")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
