// Skeleton while a panel page loads (spec 12).
export default function PanelLoading() {
  return (
    <div className="animate-pulse space-y-5" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 rounded-lg bg-muted" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="space-y-px overflow-hidden rounded-2xl">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-20 bg-muted" />
        ))}
      </div>
    </div>
  );
}
