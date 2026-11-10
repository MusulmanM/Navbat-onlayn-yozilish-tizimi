"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Accessible modal: a bottom sheet on phones (thumb-friendly), a centered dialog on desktop.
 * Focus trap, Escape and backdrop click come from Base UI.
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
}) {
  const t = useTranslations("Actions");
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => onOpenChange(next)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-foreground/40 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <DialogPrimitive.Popup
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-2xl bg-background shadow-xl outline-none transition-transform duration-200 data-ending-style:translate-y-8 data-ending-style:opacity-0 data-starting-style:translate-y-8 data-starting-style:opacity-0",
            "sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[88dvh] sm:w-full sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl",
            size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg",
          )}
        >
          <div className="flex shrink-0 items-start gap-2 border-b px-4 py-3">
            <div className="min-w-0 flex-1 pt-1.5">
              <DialogPrimitive.Title className="text-lg leading-tight font-semibold">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              aria-label={t("close")}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-muted"
            >
              <X className="size-5" aria-hidden />
            </DialogPrimitive.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">{children}</div>
          {footer && (
            <div className="shrink-0 border-t bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {footer}
            </div>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
