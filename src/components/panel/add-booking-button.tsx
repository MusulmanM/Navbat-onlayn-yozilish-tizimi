"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePanel, type AddBookingPrefill } from "@/components/panel/panel-context";
import { cn } from "@/lib/utils";

export function AddBookingButton({
  prefill,
  className,
  label,
}: {
  prefill?: AddBookingPrefill;
  className?: string;
  label?: string;
}) {
  const t = useTranslations("PanelNav");
  const { openAddBooking } = usePanel();
  return (
    <button
      type="button"
      onClick={() => openAddBooking(prefill)}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 font-semibold text-primary-foreground hover:bg-primary/90",
        className,
      )}
    >
      <Plus className="size-5" aria-hidden />
      {label ?? t("addBooking")}
    </button>
  );
}
