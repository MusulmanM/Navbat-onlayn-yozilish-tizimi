"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const inputClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

export const textareaClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export const primaryButton =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60";

export const secondaryButton =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border bg-background px-4 font-semibold transition-colors hover:bg-muted disabled:opacity-60";

/** Label + control + hint + error, with matching ids for screen readers. */
export function Field({
  id,
  label,
  hint,
  error,
  children,
  className,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block font-medium">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** So'm amount typed as "150 000" (digits only, spaces added for readability). */
export function MoneyInput({
  id,
  value,
  onChange,
  invalid,
  className,
  label,
}: {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  invalid?: boolean;
  className?: string;
  label?: string;
}) {
  return (
    <input
      id={id}
      aria-label={label}
      inputMode="numeric"
      autoComplete="off"
      aria-invalid={invalid || undefined}
      value={value ? String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "0"}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
        onChange(digits ? Number(digits) : 0);
      }}
      onFocus={(e) => e.target.select()}
      className={cn(inputClass, "tabular-nums", className)}
    />
  );
}

/** Accessible on/off switch built on a native checkbox (44 px tap area). */
export function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
  id,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <label
      className={cn(
        "flex min-h-11 cursor-pointer items-center justify-between gap-4",
        disabled && "opacity-60",
      )}
    >
      <span className="min-w-0">
        <span className="block font-medium">{label}</span>
        {hint && <span className="block text-sm text-muted-foreground">{hint}</span>}
      </span>
      <span className="relative inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className="h-7 w-12 rounded-full bg-input transition-colors peer-checked:bg-primary peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50"
        />
        <span
          aria-hidden
          className="absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"
        />
      </span>
    </label>
  );
}
