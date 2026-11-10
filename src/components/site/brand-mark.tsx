import { cn } from "@/lib/utils";

/** Small logo: a rounded square with a check-in-calendar glyph (pure SVG, no image request). */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      >
        <rect x="3.5" y="5" width="17" height="15" rx="3" />
        <path
          d="M8 3v4M16 3v4M8.5 13.5l2.5 2.5 4.5-5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
