/** A grey placeholder shape for something that is still loading. Give it the size of the real thing, e.g. <Skeleton className="h-24 rounded-card" />. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />;
}

/** A few placeholder lines inside a live region, so a screen reader hears "Loading" once and the screen is never blank. */
export function SkeletonBlock({ label = "Loading", lines = 3, className = "" }: { label?: string; lines?: number; className?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={`flex flex-col gap-3 ${className}`}>
      <Skeleton className="h-6 w-2/3" />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 1 ? "w-4/5" : "w-full"}`} />
      ))}
    </div>
  );
}
