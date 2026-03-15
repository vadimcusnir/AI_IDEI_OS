import { Skeleton } from "@/components/ui/skeleton";

/** Generic skeleton for list/grid pages like Library, Jobs, Neurons */
export function ListPageSkeleton({ columns = 3 }: { columns?: 1 | 2 | 3 }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-48 rounded-md" />
        <Skeleton className="h-8 w-28 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
      {/* Grid */}
      <div className={`grid gap-3 ${
        columns === 1 ? "grid-cols-1" :
        columns === 2 ? "grid-cols-1 sm:grid-cols-2" :
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      }`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-14 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
