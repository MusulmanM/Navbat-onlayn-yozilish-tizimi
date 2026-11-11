import { getTranslations } from "next-intl/server";

// A booking page drawn with CSS only (no image download on slow connections).
export async function PhoneMockup() {
  const t = await getTranslations("Landing");
  return (
    <div aria-hidden className="relative mx-auto w-64 select-none sm:w-72">
      <div className="rounded-[2.5rem] border-[10px] border-foreground/90 bg-background shadow-2xl">
        <div className="mx-auto mt-1 h-4 w-24 rounded-b-xl bg-foreground/90" />
        <div className="space-y-3 px-4 pt-3 pb-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-xl bg-avatar-6 text-lg font-bold text-white">
              AB
            </span>
            <div>
              <p className="font-bold leading-tight">{t("mockTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("mockSubtitle")}</p>
            </div>
          </div>
          {[t("mockService1"), t("mockService2")].map((name, i) => (
            <div key={name} className="flex items-center justify-between rounded-xl border p-2.5">
              <div>
                <p className="text-sm font-semibold">{name}</p>
                <p className="text-xs text-muted-foreground">
                  {i === 0 ? "30 · 50 000" : "45 · 70 000"}
                </p>
              </div>
              <span className="rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                {t("mockBook")}
              </span>
            </div>
          ))}
          <div className="flex gap-1.5">
            {[t("mockDay"), "13", "14", "15"].map((d, i) => (
              <span
                key={d}
                className={`flex h-12 flex-1 flex-col items-center justify-center rounded-lg border text-xs font-bold ${i === 0 ? "border-primary bg-primary text-primary-foreground" : ""}`}
              >
                {i === 0 ? <span className="text-[10px] font-medium">{d}</span> : null}
                {i === 0 ? "12" : d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {["10:00", "10:30", "11:00", "14:00", "15:30", "17:00"].map((time, i) => (
              <span
                key={time}
                className={`rounded-lg border py-1.5 text-center text-xs font-semibold tabular-nums ${i === 2 ? "border-primary bg-accent text-accent-foreground" : ""}`}
              >
                {time}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -bottom-4 -left-6 rounded-xl bg-background px-3 py-2 text-sm font-semibold shadow-lg ring-1 ring-border sm:-left-10">
        {t("mockToast")}
      </div>
    </div>
  );
}
