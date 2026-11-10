import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Empty state: explanation + next step (spec 12). */
export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon?: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-10 text-center">
      {icon && (
        <div className="mb-3 text-4xl" aria-hidden>
          {icon}
        </div>
      )}
      <p className="text-lg font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border bg-card p-4 sm:p-5 ${className}`}>{children}</div>;
}
