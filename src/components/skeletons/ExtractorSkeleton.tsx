import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton for Extractor page */
export function ExtractorSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-56" />
      </div>
      {/* Upload area */}
      <Skeleton className="h-40 w-full rounded-xl" />
      {/* Episodes list */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-28" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-7 w-20 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
