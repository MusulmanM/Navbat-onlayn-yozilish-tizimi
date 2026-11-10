import { cn } from "@/lib/utils";

// Static class names so Tailwind can see them. Colors are tokens from globals.css.
const BACKGROUNDS = [
  "bg-avatar-0",
  "bg-avatar-1",
  "bg-avatar-2",
  "bg-avatar-3",
  "bg-avatar-4",
  "bg-avatar-5",
  "bg-avatar-6",
  "bg-avatar-7",
] as const;

/** Deterministic: the same name always gets the same color. */
export function avatarIndex(name: string): number {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.codePointAt(0)!) >>> 0;
  return hash % BACKGROUNDS.length;
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0][0], words[1][0]] : [words[0]?.[0] ?? "?"];
  return letters.join("").toUpperCase();
}

export function InitialAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white",
        BACKGROUNDS[avatarIndex(name)],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
