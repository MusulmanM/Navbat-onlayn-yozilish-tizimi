"use client";

import { useTranslations } from "next-intl";
import type { BookingStatus } from "@/lib/bookings";
import { cn } from "@/lib/utils";

export const STATUS_CLASSES: Record<BookingStatus, string> = {
  PENDING: "bg-pending/20 text-pending-foreground ring-pending/40",
  CONFIRMED: "bg-accent text-accent-foreground ring-primary/20",
  COMPLETED: "bg-success/12 text-success ring-success/25",
  NO_SHOW: "bg-destructive/10 text-destructive ring-destructive/25",
  CANCELLED_BY_CLIENT: "bg-muted text-muted-foreground ring-border",
  CANCELLED_BY_BUSINESS: "bg-muted text-muted-foreground ring-border",
};

export function StatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  const t = useTranslations("Status");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset",
        STATUS_CLASSES[status],
        className,
      )}
    >
      {t(status)}
    </span>
  );
}
