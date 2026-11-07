import { Skeleton } from "@/components/ui/skeleton";

/** Shown while a Military screen is loading, so the page is never blank. */
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading" className="space-y-4">
      <Skeleton className="h-11 w-32" />
      <Skeleton className="h-16 rounded-card" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="aspect-4/3 rounded-card" />
        <Skeleton className="aspect-4/3 rounded-card" />
      </div>
      <Skeleton className="h-24 rounded-card" />
    </div>
  );
}
