"use client";

import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/** Copies text; falls back to a hidden textarea on old Android browsers. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function CopyButton({
  text,
  label,
  className,
  variant = "outline",
}: {
  text: string;
  label?: string;
  className?: string;
  variant?: "outline" | "primary";
}) {
  const t = useTranslations("Actions");
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copyText(text)) {
          setDone(true);
          toast.success(t("copied"));
          window.setTimeout(() => setDone(false), 2000);
        } else toast.error(t("error"));
      }}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 font-semibold transition-colors",
        variant === "primary"
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "border bg-background hover:bg-muted",
        className,
      )}
    >
      {done ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {label ?? t("copy")}
    </button>
  );
}
