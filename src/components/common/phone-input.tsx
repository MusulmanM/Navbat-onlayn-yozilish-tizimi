"use client";

import { forwardRef } from "react";
import { formatLocalPhoneInput } from "@/lib/phone";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  /** Up to 9 digits after +998. */
  value: string;
  onChange: (digits: string) => void;
  invalid?: boolean;
  describedBy?: string;
  autoFocus?: boolean;
  name?: string;
};

/** "+998" is fixed; the rest is typed with the mask "90 123 45 67" (spec 6.6). */
export const PhoneInput = forwardRef<HTMLInputElement, Props>(function PhoneInput(
  { id, value, onChange, invalid, describedBy, autoFocus, name },
  ref,
) {
  return (
    <div
      className={cn(
        "flex h-11 w-full items-center overflow-hidden rounded-lg border border-input bg-background transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        invalid && "border-destructive ring-3 ring-destructive/20",
      )}
    >
      <span className="flex h-full items-center border-r bg-muted px-3 text-base font-medium text-muted-foreground select-none">
        +998
      </span>
      <input
        ref={ref}
        id={id}
        name={name}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="90 123 45 67"
        autoFocus={autoFocus}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        value={formatLocalPhoneInput(value)}
        onChange={(event) => {
          let digits = event.target.value.replace(/\D/g, "");
          // Pasted full numbers: "+998 90 123 45 67" → drop the country code.
          if (digits.length > 9 && digits.startsWith("998")) digits = digits.slice(3);
          onChange(digits.slice(0, 9));
        }}
        className="h-full min-w-0 flex-1 bg-transparent px-3 text-base tracking-wide outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
});
